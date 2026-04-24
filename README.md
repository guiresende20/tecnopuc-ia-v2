# TecnoPUC Chatbot

Assistente virtual do **TecnoPUC** (Parque Científico e Tecnológico da PUCRS) com arquitetura RAG (Retrieval-Augmented Generation) e suporte a conversa por voz em tempo real.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **IA:** Google Gemini API (`@google/generative-ai` + `@google/genai`)
- **Banco vetorial:** Supabase (pgvector)
- **Voz:** Gemini Multimodal Live API (WebSocket) com tokens efêmeros
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit`
- **Estilo:** Tailwind CSS v4

## Como funciona

### Chat por texto (RAG)
1. Usuário envia pergunta → `POST /api/chat`
2. Servidor gera embedding da query via Gemini
3. Busca os chunks mais relevantes no Supabase via `pgvector` (`match_documents`)
4. Monta system prompt com o contexto recuperado
5. Streama a resposta do Gemini para o cliente

### Voz bidirecional
1. Cliente requisita `GET /api/voice-context`
2. Servidor cria um **token efêmero** (`authTokens.create`, 30 min, 1 uso) e devolve junto com o `systemInstruction` RAG
3. Cliente abre WebSocket direto com `generativelanguage.googleapis.com` usando o token
4. Áudio do microfone vai pra Gemini; áudio de resposta volta pro cliente
5. VAD local detecta interrupção (usuário falando por cima da IA) e corta a fala imediatamente

A chave privada do Gemini **nunca sai do servidor**.

## Pré-requisitos

- Node 20+
- Conta no Google AI Studio (API key do Gemini)
- Projeto Supabase com extensão pgvector
- Conta Upstash (Redis gratuito pra rate limiting — opcional em dev)

## Setup local

```bash
# 1. Instala dependências
npm install

# 2. Copia o template de variáveis e preenche com valores reais
cp .env.example .env.local

# 3. Setup do banco Supabase (rodar no SQL Editor, em ordem)
#    - supabase-setup.sql   → cria tabela documents + função match_documents
#    - admin-setup.sql      → cria knowledge_sources e chatbot_settings
#    - Ativar RLS (3 linhas ALTER TABLE ... ENABLE ROW LEVEL SECURITY)

# 4. Indexa a base de conhecimento inicial
npx tsx scripts/ingest.ts

# 5. Roda
npm run dev
```

Abra <http://localhost:3000>.

## Variáveis de ambiente

Ver `.env.example`. As obrigatórias em produção:

| Variável | Escopo | Origem |
|---|---|---|
| `GEMINI_API_KEY` | servidor | Google AI Studio |
| `SUPABASE_URL` | servidor | Supabase Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Supabase Dashboard (bypassa RLS) |
| `INGEST_SECRET` | servidor | `openssl rand -hex 32` |
| `ADMIN_USERNAME` + `ADMIN_PASSWORD` | servidor | definir manualmente |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | servidor | Upstash Console |

Nenhuma variável `NEXT_PUBLIC_*` é necessária — todo acesso a serviços externos passa pelo servidor.

## Comandos

```bash
npm run dev          # servidor de desenvolvimento
npm run build        # build de produção
npm run start        # servir build de produção
npm run lint         # ESLint

npx tsx scripts/ingest.ts       # reindexa knowledge/*.md no Supabase
npx tsx scripts/scrape.ts       # scrape do site tecnopuc.pucrs.br (gera .md)
```

## Estrutura

```
src/
  app/
    page.tsx                         # interface principal
    admin/page.tsx                   # painel de administração
    api/
      chat/route.ts                  # pipeline RAG com streaming
      voice-context/route.ts         # emite token efêmero para o modo voz
      ingest/route.ts                # reindexação protegida por Bearer
      admin/{settings,sources,upload}/route.ts
  components/
    layout/AppShell.tsx              # orquestra estado global + voz
    input/TextInputDock.tsx          # input de texto + botão de mic
    stage/ExperienceStage.tsx        # palco central com o T 3D
    ...
  lib/
    gemini.ts                        # cliente Gemini (texto + embeddings)
    gemini-live.ts                   # WebSocket Live API + VAD local
    supabase.ts                      # cliente service_role + helpers
    rate-limit.ts                    # limiters por rota via Upstash
knowledge/                           # markdown do RAG (fonte de verdade)
scripts/                             # ingest, scrape, migrate
supabase-setup.sql                   # schema inicial do pgvector
admin-setup.sql                      # tabelas do painel admin
```

## Segurança

O projeto implementa múltiplas camadas defensivas:

- **Tokens efêmeros** para voz — chave privada nunca vai ao cliente
- **RLS ativo** em todas as tabelas Supabase (service_role bypassa server-side)
- **Rate limiting** por IP em todas as rotas via Upstash Redis
- **Security headers** (HSTS, X-Frame-Options, Permissions-Policy, etc)
- **Validação de tamanho** em queries e uploads
- **Mensagens de erro genéricas** em respostas 5xx (stack fica no log)
- **Basic Auth** no painel admin + limiter anti-brute-force

Detalhes da arquitetura em `CLAUDE.md`.

## Deploy no Netlify

1. Conectar o repositório ao Netlify.
2. Build command: `npm run build` · Publish directory: `.next`.
3. Configurar todas as variáveis de ambiente listadas acima em `Site configuration → Environment variables`.
4. Depois do primeiro deploy, rodar a ingestão inicial via `POST /api/ingest` com header `Authorization: Bearer <INGEST_SECRET>`.

## Licença

Uso interno TecnoPUC / PUCRS.
