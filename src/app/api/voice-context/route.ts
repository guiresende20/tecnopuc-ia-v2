// src/app/api/voice-context/route.ts
// Retorna systemInstruction RAG + token efêmero para abrir a sessão de voz.
// Fluxo seguro: a chave privada do Gemini NUNCA sai do servidor. O cliente recebe
// apenas um token temporário (30 min, 1 uso) que o Google valida na WebSocket.

import { NextRequest, NextResponse } from 'next/server';
import { getSettings, supabase } from '@/lib/supabase';
import { buildSystemPrompt } from '@/lib/gemini';
import { voiceContextLimiter, enforceLimit, getClientIp } from '@/lib/rate-limit';
import { GoogleGenAI } from '@google/genai';
import { isLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/locales';

export const runtime = 'nodejs';

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function mintEphemeralToken(): Promise<string> {
  const now = Date.now();
  const token = await genai.authTokens.create({
    config: {
      // Token serve pra 1 abertura de sessão. Resumir sessão não conta como uso.
      uses: 1,
      // Janela curta pra iniciar a sessão (60s). Se o cliente demorar mais, erro.
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      // Duração máxima da sessão em si (30 min). Caso vaze, dano é limitado no tempo.
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      httpOptions: { apiVersion: 'v1alpha' },
    },
  });

  if (!token.name) {
    throw new Error('authTokens.create retornou token sem name');
  }
  return token.name;
}

export async function GET(req: NextRequest) {
  const limited = await enforceLimit(voiceContextLimiter, getClientIp(req));
  if (limited) return limited;

  const localeParam = req.nextUrl.searchParams.get('locale');
  const locale: Locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE;

  try {
    // 1. Monta systemInstruction com contexto RAG
    const { data, error } = await supabase
      .from('documents')
      .select('content, metadata')
      .order('id', { ascending: true })
      .limit(20);

    if (error) {
      console.error('[/api/voice-context] Erro Supabase:', error);
      throw error;
    }

    const docs = data ?? [];
    const context =
      docs.length > 0
        ? docs
            .map((doc) => {
              const source = (doc.metadata as { source?: string })?.source ?? 'geral';
              return `[${source}]\n${doc.content}`;
            })
            .join('\n\n---\n\n')
        : 'Base de conhecimento ainda não indexada.';

    const settings = await getSettings();
    const systemInstruction = buildSystemPrompt(context, settings.system_prompt, locale);

    // 2. Minta token efêmero — só agora, depois de tudo mais ter dado certo.
    const ephemeralToken = await mintEphemeralToken();

    return NextResponse.json({ systemInstruction, ephemeralToken });
  } catch (error) {
    console.error('[/api/voice-context]', error);

    // Fallback: tenta ainda entregar token + prompt genérico. Se nem o token
    // puder ser criado, é erro duro — não faz sentido continuar sem ele.
    try {
      const fallbackSettings = await getSettings();
      const fallbackInstruction = buildSystemPrompt(
        'Base de conhecimento temporariamente indisponível. Responda de forma geral sobre o TecnoPUC.',
        fallbackSettings.system_prompt,
        locale,
      );
      const ephemeralToken = await mintEphemeralToken();
      return NextResponse.json({
        systemInstruction: fallbackInstruction,
        ephemeralToken,
      });
    } catch (fallbackErr) {
      console.error('[/api/voice-context] fallback também falhou:', fallbackErr);
      return NextResponse.json(
        { error: 'Serviço de voz temporariamente indisponível.' },
        { status: 503 },
      );
    }
  }
}
