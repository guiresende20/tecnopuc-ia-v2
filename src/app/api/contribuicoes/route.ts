// src/app/api/contribuicoes/route.ts
// Endpoint público para envio de contribuições da comunidade.
// Fluxo: validação → rate limit (IP + e-mail) → token → persistência → e-mail.

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabase } from '@/lib/supabase';
import {
  contribuicoesEmailLimiter,
  contribuicoesIpLimiter,
  enforceLimit,
  getClientIp,
} from '@/lib/rate-limit';
import { sendConfirmacaoContribuicao } from '@/lib/email';

const MIN_LEN = 50;
const MAX_LEN = 5000;
const MAX_CATEGORIA = 80;
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Honeypot anti-bot: campo "website" oculto no form. Bots populam tudo;
  // humanos não veem. Se vier preenchido, respondemos OK silenciosamente.
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const conteudo = typeof data.conteudo === 'string' ? data.conteudo.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const categoria =
    typeof data.categoria === 'string' && data.categoria.trim()
      ? data.categoria.trim().slice(0, MAX_CATEGORIA)
      : null;

  // Validações
  if (conteudo.length < MIN_LEN) {
    return NextResponse.json(
      { error: `Conteúdo muito curto (mínimo ${MIN_LEN} caracteres).` },
      { status: 400 },
    );
  }
  if (conteudo.length > MAX_LEN) {
    return NextResponse.json(
      { error: `Conteúdo muito longo (máximo ${MAX_LEN} caracteres).` },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 });
  }

  // Rate limit por IP primeiro (mais barato)
  const ipBlock = await enforceLimit(contribuicoesIpLimiter, ip);
  if (ipBlock) return ipBlock;

  // Rate limit por e-mail
  const emailBlock = await enforceLimit(contribuicoesEmailLimiter, email);
  if (emailBlock) return emailBlock;

  // Token + persistência
  const token = randomBytes(32).toString('hex');
  const expiraEm = new Date(Date.now() + TOKEN_TTL_MS);

  const { error: insertError } = await supabase.from('contribuicoes').insert({
    conteudo_original: conteudo,
    email,
    categoria,
    ip_address: ip,
    status: 'aguardando_email',
    token_validacao: token,
    token_expira_em: expiraEm.toISOString(),
  });

  if (insertError) {
    console.error('[contribuicoes POST] erro insert:', insertError);
    return NextResponse.json({ error: 'Falha ao registrar contribuição.' }, { status: 500 });
  }

  // Disparo do e-mail. Se falhar, contribuição existe e admin pode investigar/reenviar.
  // Não expomos o erro ao usuário pra evitar leak de detalhes do provedor.
  const sendResult = await sendConfirmacaoContribuicao({
    para: email,
    token,
    conteudoPreview: conteudo,
  });
  if (!sendResult.ok) {
    console.error('[contribuicoes POST] envio de e-mail falhou:', sendResult.error);
  }

  return NextResponse.json({
    ok: true,
    mensagem: 'Verifique seu e-mail para confirmar a contribuição (link válido por 1h).',
  });
}
