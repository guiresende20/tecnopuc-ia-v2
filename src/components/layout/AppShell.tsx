'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { useViewportMode } from '@/hooks/useViewportMode';
import { useAppStore } from '@/store/appStore';
import { HeaderBar } from './HeaderBar';
import { ExperienceStage } from '@/components/stage/ExperienceStage';
import { InputZone } from '@/components/input/InputZone';
import { StageBackground } from '@/components/stage/StageBackground';
import { ToastLayer } from '@/components/overlays/ToastLayer';
import { streamChat, type ChatMessage } from '@/services/chatService';
import { GeminiLiveChat, type LiveChatStatus } from '@/lib/gemini-live';
import type { ResponseNode } from '@/types/app.types';

export function AppShell() {
  useViewportMode();

  const setTState = useAppStore((s) => s.setTState);
  const setSubmitting = useAppStore((s) => s.setSubmitting);
  const showToast = useAppStore((s) => s.showToast);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);

  // Text chat state
  const [responses, setResponses] = useState<ResponseNode[]>([]);
  const [userMessages, setUserMessages] = useState<{ id: string; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  // Voice state
  const [voiceStatus, setVoiceStatus] = useState<LiveChatStatus>('disconnected');
  const liveChatRef = useRef<GeminiLiveChat | null>(null);
  const voiceContextCache = useRef<{ systemInstruction: string; ephemeralToken: string } | null>(null);

  // Pre-fetch voice context on mount to cut latency on first click
  useEffect(() => {
    fetch('/api/voice-context')
      .then((r) => r.json())
      .then((data) => { voiceContextCache.current = data; })
      .catch(() => {});
  }, []);

  // Sync voice status → tState
  useEffect(() => {
    const map: Partial<Record<LiveChatStatus, Parameters<typeof setTState>[0]>> = {
      connecting: 'processing',
      connected: 'listening',
      listening: 'listening',
      speaking: 'speaking',
      disconnected: 'idle',
      error: 'error',
    };
    const next = map[voiceStatus];
    if (next) setTState(next);
    if (voiceStatus === 'error') {
      setTimeout(() => setTState('idle'), 3000);
    }
  }, [voiceStatus, setTState]);

  const handleVoiceToggle = useCallback(async () => {
    // If active — stop
    if (liveChatRef.current) {
      liveChatRef.current.stop();
      liveChatRef.current = null;
      setVoiceStatus('disconnected');
      setAudioLevel(0);
      return;
    }

    setVoiceStatus('connecting');

    try {
      const context =
        voiceContextCache.current ??
        (await fetch('/api/voice-context').then((r) => r.json()));
      // Token efêmero é single-use e expira em 60s pra iniciar sessão nova — sempre
      // descartar após 1 sessão e buscar fresco na próxima vez.
      voiceContextCache.current = null;

      const { systemInstruction, ephemeralToken } = context as {
        systemInstruction: string;
        ephemeralToken: string;
      };

      if (!ephemeralToken) throw new Error('Token de voz não recebido do servidor.');

      const chat = new GeminiLiveChat(
        ephemeralToken,
        {
          onStatusChange: (status) => setVoiceStatus(status),
          onAudioLevel: (level) => setAudioLevel(level),
          onTurnComplete: (aiText, userText) => {
            // Add voice turn to the conversation visible in the UI
            if (userText.trim()) {
              setUserMessages((prev) => [
                ...prev,
                { id: `v_u_${Date.now()}`, content: userText.trim() },
              ]);
            }
            if (aiText.trim()) {
              const node: ResponseNode = {
                id: `v_a_${Date.now()}`,
                origin: 'voice',
                type: 'primary',
                body: aiText.trim(),
              };
              setResponses((prev) => [...prev, node]);
              // Also add to text history so next text turn has context
              historyRef.current = [
                ...historyRef.current,
                { role: 'user', content: userText.trim() },
                { role: 'assistant', content: aiText.trim() },
              ];
            }
          },
          onError: (err) => {
            console.error('[AppShell Voice]', err);
            setVoiceStatus('error');
            showToast('error', 'Erro na conversa por voz. Tente novamente.');
          },
        },
        systemInstruction,
      );

      liveChatRef.current = chat;
      await chat.start();
    } catch (err) {
      console.error('[AppShell Voice] start failed:', err);
      setVoiceStatus('error');
      liveChatRef.current = null;
      showToast('error', 'Não foi possível iniciar o modo voz. Verifique sua conexão.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      liveChatRef.current?.stop();
    };
  }, []);

  const handleSend = useCallback(async (query: string) => {
    if (isStreaming) return;

    const userMsg = { id: `u_${Date.now()}`, content: query };
    setUserMessages((prev) => [...prev, userMsg]);

    const userChatMsg: ChatMessage = { role: 'user', content: query };
    const messagesForApi = [...historyRef.current, userChatMsg];
    historyRef.current = messagesForApi;

    setIsStreaming(true);
    setStreamingText('');
    setSubmitting(true);
    setTState('processing');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const node = await streamChat(
        messagesForApi,
        query,
        (text) => {
          setStreamingText(text);
          setTState('responding');
        },
        controller.signal,
      );

      historyRef.current = [...messagesForApi, { role: 'assistant', content: node.body ?? '' }];
      setResponses((prev) => [...prev, node]);
      setTState('stable');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setTState('stable');
      } else {
        console.error('[AppShell] Chat error:', err);
        const errorNode: ResponseNode = {
          id: `err_${Date.now()}`,
          origin: 'text',
          type: 'primary',
          body: 'Desculpe, ocorreu um erro. Tente novamente.',
        };
        setResponses((prev) => [...prev, errorNode]);
        setTState('error');
        showToast('error', 'Erro ao buscar resposta. Tente novamente.');
        setTimeout(() => setTState('idle'), 3000);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      setSubmitting(false);
    }
  }, [isStreaming, setTState, setSubmitting]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleVoiceInterrupt = useCallback(() => {
    liveChatRef.current?.interruptSpeech();
  }, []);

  const handleClearConversation = useCallback(() => {
    // Also stop voice session if active
    liveChatRef.current?.stop();
    liveChatRef.current = null;
    setVoiceStatus('disconnected');

    setResponses([]);
    setUserMessages([]);
    historyRef.current = [];
    setTState('idle');
  }, [setTState]);

  const hasContent = responses.length > 0 || isStreaming;

  return (
    <div className="app-shell">
      <StageBackground />
      <ToastLayer />
      <HeaderBar onClearConversation={handleClearConversation} />

      <main className="app-main">
        <ExperienceStage
          responses={responses}
          userMessages={userMessages}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onClose={handleClearConversation}
        />
      </main>

      <InputZone
        onSend={handleSend}
        onStop={handleStop}
        disabled={isStreaming}
        showSuggestions={!hasContent}
        voiceStatus={voiceStatus}
        onVoiceToggle={handleVoiceToggle}
        onVoiceInterrupt={handleVoiceInterrupt}
      />

      <style jsx>{`
        .app-shell {
          height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          background: #08080e;
        }
        .app-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
