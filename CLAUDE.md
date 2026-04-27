# TecnoPUC Chatbot — Guia para o Claude CLI

## Visão Geral do Projeto

Chatbot inteligente do **TecnoPUC (Parque Científico e Tecnológico da PUCRS)** com arquitetura RAG (Retrieval-Augmented Generation). O sistema responde perguntas com base em arquivos de conhecimento, usando embeddings vetoriais para recuperar contexto relevante antes de gerar a resposta.

**Stack:**
- **Framework:** Next.js 16 (App Router) com TypeScript
- **IA:** Google Gemini API (`@google/generative-ai`)
- **Banco de dados vetorial:** Supabase (pgvector)
- **Voz:** Gemini Multimodal Live API (WebSocket)
- **Estilos:** Tailwind CSS v4

---

## Arquitetura

```
src/
  app/
    page.tsx                  # Interface principal do chatbot
    admin/page.tsx            # Painel de administração
    api/
      chat/route.ts           # Endpoint principal do chat (RAG pipeline)
      ingest/route.ts         # Ingestão de documentos via API
      admin/
        settings/route.ts     # Configurações do admin
        sources/route.ts      # Gerenciamento de fontes
        upload/route.ts       # Upload de documentos
      voice-context/route.ts  # Contexto para modo de voz
  components/
    ChatInput.tsx             # Input com suporte a voz
    ChatWindow.tsx            # Janela de mensagens
    VoiceButton.tsx           # Botão de ativação de voz
  lib/
    gemini.ts                 # Cliente Gemini + buildSystemPrompt()
    gemini-live.ts            # WebSocket para voz em tempo real
    supabase.ts               # Cliente Supabase

knowledge/                    # Base de conhecimento em Markdown (.md)
scripts/
  ingest.ts                   # Script de ingestão para o Supabase
```

---

## Comandos Essenciais

```bash
# Desenvolvimento
npm run dev          # Inicia servidor em http://localhost:3000

# Build e produção
npm run build
npm run start

# Ingestão da base de conhecimento (rodar após alterar arquivos em knowledge/)
npx tsx scripts/ingest.ts

# Lint
npm run lint
```

---

## Fluxo RAG

1. Usuário envia pergunta
2. `api/chat/route.ts` gera embedding da pergunta via Gemini
3. Busca por similaridade no Supabase (pgvector)
4. Trechos relevantes dos arquivos `.md` são injetados no system prompt via `buildSystemPrompt(context)`
5. Gemini gera resposta baseada **apenas** no contexto recuperado

---

## Arquivos Críticos para Edição

### Personalidade da IA
Edite `src/lib/gemini.ts` — função `buildSystemPrompt(context: string)`:
- Define o tom de voz, regras de comunicação e identidade do assistente
- **Nunca remover** as tags `--- CONTEXTO ---` e `--- FIM DO CONTEXTO ---`

### Base de Conhecimento
- Arquivos `.md` em `knowledge/`
- Após qualquer alteração, rodar: `npx tsx scripts/ingest.ts`

### Voz do Robô
Edite `src/lib/gemini-live.ts` — campo `voiceName`:
- `Puck` — masculina, descontraída
- `Aoede` — feminina, suave
- `Charon` — masculina, séria
- `Kore` — feminina, firme
- `Fenrir` — masculina, dinâmica

---

## Variáveis de Ambiente

O projeto requer um arquivo `.env.local` na raiz com:
```
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
INGEST_SECRET=...
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

> **Segurança:** todas as variáveis são server-side. O browser nunca recebe a chave Gemini — para o modo voz, o servidor emite um **token efêmero** via `authTokens.create()` em `/api/voice-context` (válido ≤30 min, single-use). As variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `NEXT_PUBLIC_GEMINI_API_KEY` foram removidas intencionalmente. Se no futuro for necessário acesso client-side ao Supabase (ex: Realtime), reintroduza as variáveis **e** habilite RLS com policies adequadas antes.

---

## Banco de Dados (Supabase)

- Setup inicial: executar `supabase-setup.sql` e `admin-setup.sql` no painel do Supabase
- A tabela de documentos usa a extensão `pgvector` para busca semântica

---

## Convenções

- TypeScript estrito — sem `any` desnecessário
- Componentes React em `src/components/` com nomes em PascalCase
- Rotas de API em `src/app/api/` seguindo App Router do Next.js
- Variáveis de ambiente públicas prefixadas com `NEXT_PUBLIC_`

## Instruções para a nova arquitetura do frontend

abaixo as instruções novas para a remodelagem do front-end do projeto.

manu radial 3D

Contexto do projeto

Este projeto é a evolução do frontend existente do Assistente TecnoPUC. A referência funcional e visual atual é a interface disponível em https://tecnopuc-ia.netlify.app/.

O objetivo é reconstruir ou refatorar essa experiência em uma arquitetura mais robusta, modular e multimodal, preservando a identidade visual do projeto e expandindo suas capacidades.

O símbolo principal da interface é um “T”. O asset 3D desse “T” será fornecido externamente e deve ser tratado como o núcleo da experiência.

Utilize um visual moderno e tecnológico


O sistema deve suportar:

input por texto
input por áudio
resposta em texto
resposta em voz
navegação institucional por hubs
funcionamento em desktop e mobile
Diretriz central

O “T” 3D não é um enfeite. Ele é o centro semântico, visual e interativo da interface.

Ele deve:

indicar estado do sistema
reagir a hover, hold, escuta, processamento e fala
ancorar o menu radial
servir como foco visual da experiência
reforçar a identidade do assistente

Toda a interface deve ser pensada ao redor dele.

Regras obrigatórias de interação
Desktop

No desktop, o menu radial deve abrir por hover sobre o “T”.

Mobile

No mobile, o menu radial deve abrir por hold no “T”.

Interação removida

Não implementar drag no “T”.

Hubs fixos do menu radial

O menu radial deve conter exatamente estes itens:

Hubs
Estrutura
Programas
Sobre

Esses itens são fixos e devem ser tratados como atalhos institucionais nativos da interface.

Modalidade de entrada e saída

A interface deve ser multimodal desde a base.

Entrada

O usuário pode interagir por:

texto
áudio
Saída

O assistente pode responder por:

texto
voz sintetizada

Texto e voz devem coexistir. A experiência não deve tratar voz como recurso secundário ou opcional no desenho da arquitetura.

Objetivo de implementação

Implementar uma base de frontend em React com arquitetura modular, estado global claro, componentes separados por domínio e suporte preparado para:

asset 3D do “T”
captura de áudio
reconhecimento de fala
síntese de voz
conteúdo institucional estruturado
experiência responsiva
Princípios de UX
Clareza

A interface precisa continuar compreensível mesmo com 3D, animação e voz.

Hierarquia

O “T” é o centro. O restante da interface deve apoiar essa hierarquia.

Feedback explícito

O usuário precisa perceber claramente quando o sistema está:

aguardando
ouvindo
processando
respondendo
falando
em erro


Robustez

A experiência precisa continuar funcional mesmo sem 3D ou sem voz.

Simplicidade operacional

O usuário deve entender rapidamente:

como perguntar por texto
como usar o microfone
como abrir os hubs
como interromper ou repetir a voz do assistente
Arquitetura macro

A aplicação deve ser organizada na seguinte estrutura conceitual:

App
AppShell
HeaderBar
MainLayout
ExperienceStage
SidePanelManager
InputZone
OverlayLayers

Estrutura hierárquica de componentes

App
AppShell
HeaderBar
BrandBlock
AssistantStatus
UtilityActions
MainLayout
ExperienceStage
StageBackground
TCore3D
TAudioAura
TRadialMenu
ResponseLayer
ResponseFocusCard
VoiceTranscriptLayer
SessionTrail
StageFeedbackLayer
SidePanelManager
DetailPanel
HubPanel
TimelinePanel
AudioSettingsPanel
InputZone
TextInputDock
PromptInput
SendButton
SuggestionChips
InputFeedback
VoiceInputDock
MicButton
VoiceCaptureIndicator
LiveTranscriptPreview
VoiceControls
OverlayLayers
LoadingOverlay
ToastLayer
ModalLayer
OnboardingOverlay
MobileHoldHint

Responsabilidades por componente
AppShell

Responsável por montar a aplicação, prover contexto global, controlar responsividade e coordenar painéis e overlays.

Deve controlar pelo menos:

modo desktop ou mobile
modo de interação texto, voz ou híbrido
painel ativo
sessão atual
status geral da aplicação
HeaderBar

Responsável pelo topo da interface.

Deve conter:

branding do projeto
status atual do assistente
ações auxiliares

Ações previstas:

limpar conversa
abrir histórico
abrir ajustes de áudio
mutar voz
abrir ajuda
ExperienceStage

Responsável pelo palco central da experiência.

É a área onde vivem:

o “T” 3D
a aura de áudio
o menu radial
as respostas
os feedbacks de voz
os rastros visuais da sessão

Esse componente deve ser o centro da experiência visual.

TCore3D

Responsável por carregar e renderizar o asset 3D do “T”.

Deve aceitar:

URL do asset
estado visual atual
callbacks de interação
nível de áudio opcional

Estados obrigatórios:

idle
hover
listening
processing
responding
speaking
stable
uncertainty
error

Comportamento esperado por estado:

idle
rotação lenta, oscilação leve, iluminação neutra

hover
escala ligeiramente maior, glow sutil, preparação visual para o radial

listening
pulsação ou resposta ao volume do microfone

processing
concentração visual, partículas convergindo, sensação de processamento

responding
transição visual para emissão de conteúdo

speaking
resposta sincronizada com a voz sintetizada

stable
repouso após conclusão da resposta

uncertainty
instabilidade discreta

error
estado visual reduzido e claramente identificável

TAudioAura

Responsável por comunicar visualmente escuta e fala ao redor do “T”.

Deve reagir a:

nível de entrada do microfone
reprodução da voz sintetizada

Função:

indicar que o sistema está ouvindo
indicar que o sistema está falando
reforçar a natureza multimodal da interface
TRadialMenu

Responsável pelo menu institucional ancorado no “T”.

Regras:

desktop abre com hover
mobile abre com hold
fecha ao clicar fora
fecha após seleção
não usa drag

Itens fixos ao redor do T em 3D:

Hubs
Estrutura
Programas
Sobre

Selecionar um item deve disparar conteúdo estrutural do assistente.

ResponseLayer

Responsável por renderizar os blocos de resposta.

Deve suportar dois modos:

modo conversation
respostas vindas de texto ou voz do usuário

modo hub
respostas estruturadas vindas do menu radial

As respostas podem ser organizadas em:

foco principal
blocos secundários
cards temáticos
agrupamentos por tópico
ResponseFocusCard

Responsável por mostrar a resposta principal da interação atual.

Ações suportadas:

copiar
expandir
ouvir novamente
interromper voz
continuar a conversa a partir daquela resposta
VoiceTranscriptLayer

Responsável por mostrar a transcrição do input por voz.

Estados:

hidden
listening-live
recognized-final
error

Durante captura, deve mostrar transcrição parcial. Após reconhecimento final, deve consolidar o texto.

SessionTrail

Responsável por sinalizar memória e continuidade da sessão.

Pode ser implementado como:

linha temporal discreta
marcadores de turnos
mini mapa lateral

Não deve competir com o conteúdo principal.

StageFeedbackLayer

Responsável por feedbacks temporários de estado.

Pode conter:

partículas
ondas
pulsos
confirmações visuais
transições suaves

Esses efeitos devem comunicar estado. Não devem ser decorativos sem função.

SidePanelManager

Responsável por orquestrar painéis auxiliares.

Painéis previstos:

DetailPanel
HubPanel
TimelinePanel
AudioSettingsPanel
DetailPanel

Responsável por abrir uma resposta em versão expandida.

Deve exibir:

título
corpo completo
contexto adicional
ações relacionadas
HubPanel

Responsável por exibir o conteúdo aprofundado dos hubs institucionais.

Conteúdo esperado por seção:

Hubs
cards dos hubs, descrições, links e caminhos de aprofundamento

Estrutura
visão organizacional e funcionamento do parque

Programas
lista de programas, descrições e formas de acesso

Sobre
contexto institucional, posicionamento e propósito

TimelinePanel

Responsável por mostrar histórico ou sessões anteriores.

AudioSettingsPanel

Responsável pelos controles de voz.

Deve permitir:

ativar ou desativar fala do assistente
ajustar volume
ajustar velocidade
selecionar voz
definir reprodução automática ou manual
mutar efeitos
InputZone

Responsável por agrupar o input textual e o input por voz.

TextInputDock

Responsável pela área de input textual.

Subcomponentes:

PromptInput
SendButton
SuggestionChips
InputFeedback
PromptInput

Campo principal de texto.

Regras:

Enter envia
Shift + Enter quebra linha
foco pode gerar reação sutil no “T”

Estados:

idle
focused
typing
disabled
submitting
SendButton

Botão de envio textual.

O carregamento principal da experiência deve continuar no “T”, não apenas no botão.

SuggestionChips

Atalhos rápidos de pergunta.

Exemplos:

O que é o TecnoPUC?
Quais empresas estão no parque?
Como posso fazer parte do TecnoPUC?
Me explique os programas
Quais são os hubs?

Podem preencher o campo ou enviar diretamente.

InputFeedback

Responsável por avisos ligados ao input.

Exemplos:

erro de envio
conexão instável
gravação cancelada
texto muito curto
aguardando permissão de microfone
VoiceInputDock

Responsável pela captura de áudio.

Subcomponentes:

MicButton
VoiceCaptureIndicator
LiveTranscriptPreview
VoiceControls
MicButton

Botão principal de input por voz.

Estados:

idle
armed
recording
processing
error
disabled

Regras:

clique ou toque inicia escuta
novo clique ou toque interrompe
estado visual precisa ser inequívoco
deve coexistir com o input de texto
VoiceCaptureIndicator

Responsável por indicar que o sistema está ouvindo.

Pode conter:

ponto vermelho
timer
waveform
texto curto
LiveTranscriptPreview

Responsável por mostrar a transcrição parcial em tempo real.

A transcrição parcial deve ter distinção visual da final.

VoiceControls

Responsável por ações auxiliares do fluxo de áudio.

Pode incluir:

cancelar gravação
reenviar
alternar modo automático
alternar push-to-talk
definir idioma se necessário
LoadingOverlay

Usado apenas para estados excepcionais, como:

carregamento inicial
falha de inicialização
carregamento do asset 3D
ToastLayer

Mensagens curtas de sistema.

Exemplos:

microfone liberado
microfone negado
resposta copiada
erro ao carregar voz
ModalLayer

Para conteúdo modal, como:

tutorial
permissão de áudio
política de uso
OnboardingOverlay

Introdução inicial da experiência.

Deve ensinar:

como perguntar por texto
como usar voz
como abrir os hubs
como ouvir respostas
MobileHoldHint

Dica específica de mobile para ensinar que o radial abre por hold.

Deve aparecer no início e desaparecer após aprendizado do gesto.

Fluxos obrigatórios
Fluxo de texto
Usuário digita no PromptInput.
Usuário envia a mensagem.
O “T” muda para processing.
O frontend consulta o backend.
A resposta textual retorna.
O “T” muda para responding.
A resposta principal aparece no ResponseFocusCard.
Se a fala estiver ativa, a síntese começa.
O “T” muda para speaking.
Ao final, o “T” muda para stable.
Fluxo de voz com resposta falada
Usuário ativa o MicButton.
O sistema entra em listening.
O “T” e a aura indicam escuta.
A transcrição parcial aparece.
Ao fim da fala, o reconhecimento consolida o texto.
O texto entra na conversa.
O “T” muda para processing.
O backend responde.
A resposta textual aparece.
A síntese de voz é iniciada.
O “T” muda para speaking.
O usuário pode interromper ou repetir a fala.
Fluxo de hub no desktop
Usuário passa o mouse sobre o “T”.
O “T” entra em hover.
O menu radial abre.
Usuário escolhe um item.
O radial fecha.
O “T” entra em processing.
O conteúdo estrutural é montado.
O conteúdo aparece no HubPanel ou no ResponseLayer.
Se configurado, o sistema também lê um resumo em voz.
Fluxo de hub no mobile
Usuário mantém o toque sobre o “T”.
O menu radial abre.
Usuário seleciona um item.
O conteúdo é carregado.
O “T” volta para estado estável após a exibição.
Estado global recomendado

A aplicação deve manter um estado global mínimo com:

viewportMode
interactionMode
tState
radialOpen
selectedHub
activeResponseId
responses
painéis abertos
estado de áudio
estado do input textual

Estrutura conceitual:

AppState com:

viewportMode: desktop | mobile
interactionMode: text | voice | hybrid
tState: idle | hover | listening | processing | responding | speaking | stable | uncertainty | error
radialOpen: boolean
selectedHub: null | hubs | estrutura | programas | sobre
activeResponseId: string | null
responses: lista de ResponseNode
panels: flags para detail, hub, timeline e audio settings
audio: permissão, gravação, transcrição parcial, transcrição final, fala ativa, nome da voz, playbackRate, volume
input: valor atual e estado de envio
Tipos de dados recomendados
RadialItem

Deve conter:

id
label
description opcional
icon opcional
ResponseNode

Deve conter:

id
origin: text | voice | hub
type: primary | secondary | card | topic
title opcional
body opcional
summary opcional
relevance opcional
voiceAvailable opcional
actions opcionais como copy, expand e replay voice
Organização de pastas recomendada

src
app
App.tsx
providers
routes

components
layout
AppShell.tsx
HeaderBar.tsx
BrandBlock.tsx
AssistantStatus.tsx
UtilityActions.tsx

stage
ExperienceStage.tsx
StageBackground.tsx
StageFeedbackLayer.tsx
SessionTrail.tsx
VoiceTranscriptLayer.tsx

t-core
TCore3D.tsx
TAudioAura.tsx
TStateMachine.ts
TCoreController.ts
TParticles.tsx

radial-menu
TRadialMenu.tsx
TRadialMenuItem.tsx
radialMenu.config.ts

responses
ResponseLayer.tsx
ResponseFocusCard.tsx
ResponseNodeCard.tsx
responseLayout.utils.ts

input
InputZone.tsx
TextInputDock.tsx
PromptInput.tsx
SendButton.tsx
SuggestionChips.tsx
InputFeedback.tsx
VoiceInputDock.tsx
MicButton.tsx
VoiceCaptureIndicator.tsx
LiveTranscriptPreview.tsx
VoiceControls.tsx

panels
SidePanelManager.tsx
DetailPanel.tsx
HubPanel.tsx
TimelinePanel.tsx
AudioSettingsPanel.tsx

overlays
LoadingOverlay.tsx
ToastLayer.tsx
ModalLayer.tsx
OnboardingOverlay.tsx
MobileHoldHint.tsx

hooks
useViewportMode.ts
useHoldGesture.ts
useSpeechRecognition.ts
useSpeechSynthesis.ts
useConversationState.ts
useRadialMenu.ts

services
chatService.ts
speechRecognitionService.ts
speechSynthesisService.ts
audioPermissionService.ts

store
appStore.ts

types
app.types.ts
audio.types.ts
response.types.ts
menu.types.ts

assets
t-3d
README.md

styles
globals.css

Requisitos de UX
O “T” deve permanecer reconhecível em todos os estados.
O feedback de escuta e fala precisa ser inequívoco.
O input por voz deve ser simples de ativar e interromper.
A resposta falada deve poder ser repetida ou interrompida.
O conteúdo institucional deve ser acessível por clique e também compatível com resposta por voz.
A interface deve continuar clara mesmo sem áudio.
A experiência não pode depender exclusivamente do 3D para ser compreensível.
Requisitos técnicos
Suportar carregamento assíncrono do asset 3D.
Prever fallback 2D se o 3D falhar.
Integrar microfone com gerenciamento de permissão.
Integrar síntese de voz desacoplada da camada visual.
Sincronizar estado de áudio com estado visual do “T”.
Desacoplar conteúdo institucional da camada de interface.
Prever ambientes sem suporte confiável a speech recognition.
Fallbacks obrigatórios
Se o asset 3D falhar
Exibir versão 2D estática do “T”.
Manter radial e respostas funcionando.
Se o reconhecimento de voz falhar
Avisar claramente.
Manter input textual disponível.
Permitir nova tentativa.
Se a síntese de voz falhar
Manter resposta textual.
Permitir replay quando possível.
Se o dispositivo for fraco
Reduzir partículas.
Simplificar aura.
Reduzir efeitos visuais secundários.
Stack sugerida
Base
React
TypeScript
3D
react-three-fiber
drei
Estado
Zustand

ou

XState, caso a implementação exija maior rigor nos fluxos do “T”, do microfone e da síntese
Animação
Framer Motion
Estilo
Tailwind CSS
Áudio
Web Speech API, quando suportada

ou

integração com serviços externos de STT e TTS
Prioridade de implementação
Fase 1

Implementar a base estrutural:

AppShell
HeaderBar
ExperienceStage
InputZone
estado global inicial
organização de pastas
layout responsivo básico
Fase 2

Implementar o núcleo da experiência:

TCore3D com estados básicos
TRadialMenu
PromptInput
SendButton
SuggestionChips
ResponseFocusCard
ResponseLayer
Fase 3

Implementar multimodalidade:

MicButton
VoiceInputDock
VoiceTranscriptLayer
integração com speech recognition
integração com speech synthesis
sincronização entre áudio e T
Fase 4

Implementar conteúdo estrutural:

HubPanel
DetailPanel
TimelinePanel
conteúdo dos hubs
integração entre radial e respostas
Fase 5

Refinar experiência:

partículas e feedbacks visuais
onboarding
hints de mobile
ajustes de performance
fallback 2D
polimento de animações
O que gerar

A implementação deve gerar:

estrutura inicial de componentes React
tipos TypeScript
store global
placeholders de conteúdo
fluxo de texto
fluxo de voz
fluxo de hubs
integração preparada para o asset 3D do “T”
comportamento responsivo para desktop e mobile
Restrições importantes
Não usar drag no “T”.
Não tratar áudio como recurso secundário.
Não esconder o estado do sistema apenas em texto.
Não permitir que o visual prejudique a clareza de uso.
Não acoplar a lógica dos hubs diretamente ao componente visual do radial.
Não depender do 3D para a aplicação continuar funcional.
Resultado esperado

Ao final, o projeto deve entregar uma interface conversacional institucional multimodal, clara, visualmente forte, coerente com a identidade TecnoPUC e preparada para evoluir sem reestruturação total da base. O T em 3d símbolo do tecnopuc deve estar no meio da pagina.


