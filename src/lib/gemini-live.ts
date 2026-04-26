// src/lib/gemini-live.ts
// Gerencia a conexão WebSocket com a Gemini Multimodal Live API.
// Portado do portfólio (guilherme_portifolio/src/lib/gemini-live.ts) e adaptado
// para receber o systemInstruction dinamicamente via /api/voice-context.

export type LiveChatStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'speaking'
  | 'error';

export interface LiveChatCallbacks {
  onStatusChange: (status: LiveChatStatus) => void;
  onTextAction?: (text: string) => void;
  onTurnComplete?: (aiText: string, userText: string) => void;
  onError?: (error: string) => void;
  onAudioLevel?: (level: number) => void;
}

export class GeminiLiveChat {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private levelRafId: number | null = null;
  private inputLevelRafId: number | null = null;

  private nextPlayTime = 0;
  private currentAiText = '';
  private currentUserText = '';
  private activeSources: AudioBufferSourceNode[] = [];

  private currentStatus: LiveChatStatus = 'disconnected';
  private vadFramesAbove = 0;
  // RMS em float32 (0-1). ~0.025 corta ruído ambiente mas detecta fala normal.
  private readonly VAD_THRESHOLD = 0.025;
  // 4096 samples @ 16kHz = ~256ms por frame. 2 frames = ~512ms de fala sustentada.
  private readonly VAD_MIN_FRAMES = 2;

  // Suavização exponencial assimétrica do nível de input. ScriptProcessor emite
  // a cada ~256ms (4Hz) e o RMS por frame é muito jittery (sílabas vs pausas).
  // Coeficientes pequenos = janela de média ampla; preferimos perder fidelidade
  // de pico a ter o aura pulsando em saltos.
  private smoothedInputLevel = 0;
  private targetInputLevel = 0;
  private readonly INPUT_ATTACK = 0.12;
  private readonly INPUT_RELEASE = 0.05;

  // `authToken` é um token efêmero emitido pelo servidor via authTokens.create().
  // Não é a chave privada do Gemini — dura ≤30 min e vale ≤1 sessão.
  constructor(
    private authToken: string,
    private callbacks: LiveChatCallbacks,
    private systemInstruction: string
  ) {}

  private updateStatus(status: LiveChatStatus) {
    const prev = this.currentStatus;
    this.currentStatus = status;
    this.callbacks.onStatusChange(status);

    // Start rAF poll when entering speaking state
    if (status === 'speaking' && prev !== 'speaking') {
      if (!this.levelRafId) {
        this.levelRafId = requestAnimationFrame(() => this.pollOutputLevel());
      }
    }

    // Stop rAF poll when leaving speaking state and reset level
    if (status !== 'speaking' && prev === 'speaking') {
      if (this.levelRafId !== null) {
        cancelAnimationFrame(this.levelRafId);
        this.levelRafId = null;
      }
      this.callbacks.onAudioLevel?.(0);
    }

    // Start input level smoothing rAF when entering listening
    if (status === 'listening' && prev !== 'listening') {
      if (!this.inputLevelRafId) {
        this.inputLevelRafId = requestAnimationFrame(this.pollInputLevel);
      }
    }

    // Stop input smoothing when leaving listening
    if (status !== 'listening' && prev === 'listening') {
      if (this.inputLevelRafId !== null) {
        cancelAnimationFrame(this.inputLevelRafId);
        this.inputLevelRafId = null;
      }
      this.smoothedInputLevel = 0;
      this.targetInputLevel = 0;
    }

    // Reset level on disconnect
    if (status === 'disconnected') {
      this.callbacks.onAudioLevel?.(0);
    }
  }

  private pollInputLevel = () => {
    if (this.currentStatus !== 'listening') {
      this.inputLevelRafId = null;
      return;
    }
    const target = this.targetInputLevel;
    const coeff = target > this.smoothedInputLevel ? this.INPUT_ATTACK : this.INPUT_RELEASE;
    this.smoothedInputLevel += (target - this.smoothedInputLevel) * coeff;
    this.callbacks.onAudioLevel?.(this.smoothedInputLevel);
    this.inputLevelRafId = requestAnimationFrame(this.pollInputLevel);
  };

  private pollOutputLevel() {
    if (!this.analyserNode || this.currentStatus !== 'speaking') {
      this.levelRafId = null;
      return;
    }
    const data = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.analyserNode.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const val = (data[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / data.length);
    this.callbacks.onAudioLevel?.(Math.min(1, rms / 0.3));
    this.levelRafId = requestAnimationFrame(() => this.pollOutputLevel());
  }

  public interruptSpeech() {
    if (this.currentStatus !== 'speaking') return;
    this.clearAudioQueue();
    this.currentAiText = '';
    this.vadFramesAbove = 0;
    this.updateStatus('listening');
  }

  public async start() {
    this.updateStatus('connecting');

    try {
      // AudioContext precisa de interação do usuário antes de ser criado
      this.audioContext = new (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )({
        sampleRate: 16000, // Gemini Live espera 16kHz para input
      });

      // AnalyserNode conectado ao destino para monitorar nível de saída (speaking)
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.connect(this.audioContext.destination);

      // Endpoint BidiGenerateContentConstrained + query param access_token são
      // obrigatórios para tokens efêmeros (diferente do endpoint com ?key= usado
      // com API key permanente).
      const wssUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${this.authToken}`;
      this.ws = new WebSocket(wssUrl);

      this.ws.onopen = () => {
        const setup = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-latest',
            generationConfig: {
              responseModalities: ['AUDIO'],
              thinkingConfig: { thinkingLevel: 'low' },
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Puck',
                  },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: this.systemInstruction }],
            },
          },
        };
        console.log('[TecnoPUC Live] Setup enviado:', setup.setup.model);
        this.ws?.send(JSON.stringify(setup));
      };

      this.ws.onmessage = async (event) => {
        let msg;
        try {
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            msg = JSON.parse(text);
          } else {
            msg = JSON.parse(event.data);
          }
        } catch (e) {
          console.error('[TecnoPUC Live] Erro no parse do WebSocket:', e);
          return;
        }

        if (msg.error) {
          this.callbacks.onError?.(
            `API Error: ${msg.error.message || JSON.stringify(msg.error)}`
          );
          this.stop();
          return;
        }

        if (msg.setupComplete) {
          this.updateStatus('connected');
          await this.startRecording();
          return;
        }

        // Interrupção (Barge-in): quando o usuário começa a falar e a IA ainda está respondendo
        if (msg.serverContent?.interrupted) {
          console.log('[TecnoPUC Live] IA interrompida pelo usuário.');
          this.clearAudioQueue();
          this.currentAiText = ''; // Reseta o texto
          this.updateStatus('listening');
          return;
        }

        // Transcrição do áudio do usuário
        if (msg.serverContent?.inputTranscription?.text) {
          this.currentUserText += msg.serverContent.inputTranscription.text;
        }

        if (msg.serverContent?.modelTurn) {
          this.updateStatus('speaking');
          const parts = msg.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.text && this.callbacks.onTextAction) {
              this.callbacks.onTextAction(part.text);
              this.currentAiText += part.text;
            }
            if (part.inlineData?.data) {
              this.playAudioChunk(part.inlineData.data);
            }
          }
        }

        if (msg.serverContent?.turnComplete) {
          this.updateStatus('listening');
          if (this.currentAiText && this.callbacks.onTurnComplete) {
            this.callbacks.onTurnComplete(this.currentAiText, this.currentUserText);
          }
          this.currentAiText = '';
          this.currentUserText = '';
        }
      };

      this.ws.onerror = (e) => {
        console.error('[TecnoPUC Live] WebSocket Error:', e);
        this.callbacks.onError?.('Erro de conexão com a API de voz.');
        this.stop();
      };

      this.ws.onclose = (event) => {
        console.log(
          `[TecnoPUC Live] WS Closed: Code=${event.code}, Reason=${event.reason || 'vazio'}`
        );
        this.updateStatus('disconnected');
        this.stop();
      };
    } catch (e) {
      console.error(e);
      this.callbacks.onError?.('Não foi possível acessar o microfone ou conectar à API.');
      this.stop();
    }
  }

  private async startRecording() {
    if (!this.audioContext) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // ScriptProcessorNode: obsoleto mas com amplo suporte (inclusive Safari/Mobile)
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calcular RMS uma vez para VAD e para nível visual
        let sumSq = 0;
        for (let i = 0; i < inputData.length; i++) sumSq += inputData[i] * inputData[i];
        const rms = Math.sqrt(sumSq / inputData.length);

        // VAD local: interrompe a fala da IA assim que o usuário começa a falar
        if (this.currentStatus === 'speaking') {
          if (rms > this.VAD_THRESHOLD) {
            this.vadFramesAbove++;
            if (this.vadFramesAbove >= this.VAD_MIN_FRAMES) {
              this.interruptSpeech();
            }
          } else {
            this.vadFramesAbove = 0;
          }
        } else {
          this.vadFramesAbove = 0;
        }

        // Atualiza target; pollInputLevel rAF emite suavizado a ~60Hz.
        // Normalização em 0.25 (mais alta) evita saturar em 1.0 com fala normal —
        // mantém range útil pro aura modular escala suavemente.
        if (this.currentStatus === 'listening') {
          this.targetInputLevel = Math.min(1, rms / 0.25);
        }

        // Converter Float32 → PCM Int16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        const base64Chunk = this.bufferToBase64(pcm16.buffer);
        const msg = {
          realtimeInput: {
            audio: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Chunk,
            },
          },
        };
        this.ws.send(JSON.stringify(msg));
      };

      this.updateStatus('listening');
    } catch (err) {
      const e = err as DOMException;
      const msg =
        e.name === 'NotAllowedError'  ? 'Permissão de microfone negada.' :
        e.name === 'NotFoundError'    ? 'Nenhum microfone encontrado.' :
        e.name === 'NotReadableError' ? 'Microfone em uso por outro aplicativo.' :
        e.name === 'OverconstrainedError' ? 'Configuração de áudio incompatível com o microfone.' :
        e.name === 'SecurityError'    ? 'Microfone requer contexto HTTPS ou localhost.' :
        `Falha ao iniciar captura: ${e.message || e.name || 'erro desconhecido'}`;
      console.error('[TecnoPUC Live]', msg, err);
      this.callbacks.onError?.(msg);
      this.stop();
    }
  }

  private clearAudioQueue() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources = [];
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }
  }

  private async playAudioChunk(base64Data: string) {
    if (!this.audioContext) return;

    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Saída da API Live: PCM 24kHz 16-bit
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    audioBuffer.copyToChannel(float32Data, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyserNode ?? this.audioContext.destination);

    source.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== source);
    };
    this.activeSources.push(source);

    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  public stop() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.levelRafId !== null) {
      cancelAnimationFrame(this.levelRafId);
      this.levelRafId = null;
    }

    if (this.inputLevelRafId !== null) {
      cancelAnimationFrame(this.inputLevelRafId);
      this.inputLevelRafId = null;
    }
    this.smoothedInputLevel = 0;
    this.targetInputLevel = 0;

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.audioContext) {
      this.clearAudioQueue();
      this.audioContext.close();
      this.audioContext = null;
    }

    this.nextPlayTime = 0;
    this.updateStatus('disconnected');
  }
}
