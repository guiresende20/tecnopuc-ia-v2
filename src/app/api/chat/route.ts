// src/app/api/chat/route.ts
// Endpoint principal do RAG pipeline com streaming.
// Fluxo: recebe query → gera embedding → busca Supabase → monta prompt → streama Gemini

import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding, streamChat, buildSystemPrompt, ChatMessage } from '@/lib/gemini';
import { hybridMatchDocuments, getSettings } from '@/lib/supabase';
import { chatLimiter, enforceLimit, getClientIp } from '@/lib/rate-limit';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

export const runtime = 'edge';

// Limites defensivos para controlar custo do Gemini e memória do servidor.
const MAX_QUERY_CHARS = 2000;   // uma pergunta institucional normal cabe com sobra
const MAX_HISTORY_TURNS = 50;   // ~25 trocas user/assistant

export async function POST(req: NextRequest) {
  const limited = await enforceLimit(chatLimiter, getClientIp(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const { messages, query, locale: rawLocale }: { messages: ChatMessage[]; query: string; locale?: unknown } = body;
    const locale: Locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'query é obrigatório.' }, { status: 400 });
    }

    if (query.length > MAX_QUERY_CHARS) {
      return NextResponse.json(
        { error: `Pergunta muito longa. Limite de ${MAX_QUERY_CHARS} caracteres.` },
        { status: 400 },
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages deve ser uma lista não vazia.' },
        { status: 400 },
      );
    }

    if (messages.length > MAX_HISTORY_TURNS) {
      return NextResponse.json(
        { error: `Histórico muito longo. Limite de ${MAX_HISTORY_TURNS} mensagens.` },
        { status: 400 },
      );
    }

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || typeof lastMsg.content !== 'string') {
      return NextResponse.json(
        { error: 'A última mensagem do histórico é inválida.' },
        { status: 400 },
      );
    }

    // 1. Buscar configs do admin DB e gerar embedding em paralelo.
    //    O embedding é multilíngue (gemini-embedding-2-preview), então a
    //    query do usuário vai direto para o modelo sem tradução prévia.
    const [settings, queryEmbedding] = await Promise.all([
      getSettings(),
      generateEmbedding(query),
    ]);

    // 2. Buscar os chunks mais relevantes via hybrid search (pgvector + FTS via RRF).
    //    Chunks só-vetoriais ainda respeitam settings.similarityThreshold; chunks
    //    que vieram do FTS (fts_rank presente) passam direto — o match literal já
    //    confirma relevância e RRF cuida da ordenação.
    const candidates = await hybridMatchDocuments(
      queryEmbedding,
      query,
      settings.matchCount,
    );
    const relevantDocs = candidates.filter(
      (d) => d.fts_rank != null || (d.similarity ?? 0) >= settings.similarityThreshold,
    );

    // 3. Montar o contexto com os documentos recuperados
    let contextText: string;
    if (relevantDocs.length === 0) {
      contextText = 'Nenhuma informação específica encontrada na base de conhecimento.';
    } else {
      contextText = relevantDocs
        .map((doc, i) => {
          const source = doc.metadata?.source ?? 'desconhecido';
          return `[Fonte ${i + 1}: ${source}]\n${doc.content}`;
        })
        .join('\n\n---\n\n');
    }

    // 4. Montar o system prompt enriquecido com o contexto RAG + instrução de idioma
    const systemPrompt = buildSystemPrompt(contextText, settings.system_prompt, locale);

    // 5. Iniciar streaming da resposta do Gemini com temperatura/tokens/thinking paramétricos.
    //    thinkingLevel='low' (default) desliga thinking → corta TTFT em 200-800ms.
    //    Pra RAG isso geralmente é certo: o contexto já vem injetado, raramente
    //    se beneficia de raciocínio interno do modelo.
    const stream = await streamChat(
      messages,
      systemPrompt,
      settings.temperature,
      settings.maxTokens,
      settings.thinkingLevel,
    );

    // 6. Retornar o stream para o frontend (edge runtime chunka automaticamente)
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Sources': JSON.stringify(
          relevantDocs.map((d) => ({
            source: d.metadata?.source,
            similarity: d.similarity?.toFixed(2),
            fts_rank: d.fts_rank?.toFixed(3),
            rrf_score: d.rrf_score?.toFixed(4),
          }))
        ),
      },
    });
  } catch (error) {
    console.error('[/api/chat] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar a mensagem.' },
      { status: 500 }
    );
  }
}
