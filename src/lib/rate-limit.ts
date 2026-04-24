// src/lib/rate-limit.ts
// Rate limiting via Upstash Redis + @upstash/ratelimit.
// O contador vive no Redis (shared state) — funciona em serverless/edge e com
// múltiplas instâncias (Netlify Functions, Vercel, etc.).
//
// Configuração: exige UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN.
// Se não estiverem definidas (ex: dev local sem signup), o limiter vira no-op
// e nenhuma rota é bloqueada. Em produção essas variáveis DEVEM estar presentes.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasRedis ? Redis.fromEnv() : null;

type Window = `${number} ${'s' | 'm' | 'h' | 'd'}`;

function createLimiter(name: string, requests: number, window: Window): Ratelimit | null {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: `tecnopuc:${name}`,
  });
}

// Limites calibrados para uso humano real.
// Chatbot institucional: ~5 req/min por usuário normal; 20/min dá folga generosa.
export const chatLimiter         = createLimiter('chat',          20, '1 m');
export const voiceContextLimiter = createLimiter('voice-ctx',     10, '1 m');
export const ingestLimiter       = createLimiter('ingest',         2, '1 m');
// Admin geral (após login) — admin usando UI faz cliques esparsos, 30/min sobra.
export const adminLimiter        = createLimiter('admin',         30, '1 m');
// Anti-brute-force na porta de entrada do admin — falhas de login caem aqui.
export const adminLoginLimiter   = createLimiter('admin-login',    5, '1 m');
// Upload é operação cara — 10/min já é muito.
export const adminUploadLimiter  = createLimiter('admin-upload',  10, '1 m');

export function getClientIp(req: NextRequest): string {
  // Netlify e Vercel populam x-forwarded-for; primeiro IP é o cliente original.
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  // Fallback absoluto (dev local sem proxy): chave compartilhada, todos no mesmo balde.
  return 'unknown';
}

// Se a chamada estourar o limite, devolve a Response 429 pronta.
// Se estiver dentro do limite — ou se o Redis não estiver configurado — retorna null
// e a rota segue normalmente.
export async function enforceLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<NextResponse | null> {
  if (!limiter) return null;

  try {
    const { success, limit, remaining, reset } = await limiter.limit(key);
    if (success) return null;

    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Muitas requisições em pouco tempo. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      },
    );
  } catch (err) {
    // Se o Redis cair, não derruba a API — só loga e libera.
    // Fail-open é consciente: rate limit é defesa em profundidade, não é o único controle.
    console.error('[rate-limit] Redis indisponível, request liberada:', err);
    return null;
  }
}
