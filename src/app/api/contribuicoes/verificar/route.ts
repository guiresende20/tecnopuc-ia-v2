// src/app/api/contribuicoes/verificar/route.ts
// Validação do e-mail de contribuição.
//
// IMPORTANTE: a validação é um POST (muta estado), NUNCA um GET. Scanners de
// segurança de e-mail (ex.: Microsoft Defender / Safe Links do Office 365)
// fazem GET automático em todo link de e-mail para checar phishing — se a
// mutação estivesse no GET, a contribuição seria auto-validada (e o token
// single-use queimado) antes de o humano clicar. O link do e-mail aponta para a
// página /contribuir/confirmar, que dispara este POST somente no clique humano.
//
// O GET aqui é apenas um fallback: redireciona para a página de confirmação sem
// mutar nada (caso alguém abra a URL da API direto, ou um link antigo ainda
// esteja em trânsito).

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const baseUrl = process.env.APP_BASE_URL ?? url.origin;
  const dest = token
    ? `${baseUrl}/contribuir/confirmar?token=${encodeURIComponent(token)}`
    : `${baseUrl}/contribuir/expirado`;
  return NextResponse.redirect(dest);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 });
  }

  const token =
    typeof body === 'object' &&
    body !== null &&
    typeof (body as Record<string, unknown>).token === 'string'
      ? ((body as Record<string, unknown>).token as string)
      : '';

  if (!token) {
    return NextResponse.json({ ok: false, error: 'Token ausente.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contribuicoes')
    .select('id, status, token_expira_em')
    .eq('token_validacao', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: 'Token inválido.' }, { status: 404 });
  }

  // Idempotência: se já foi promovida, trata como sucesso.
  if (data.status === 'aguardando_revisao' || data.status === 'aprovada') {
    return NextResponse.json({ ok: true, status: data.status });
  }
  if (data.status !== 'aguardando_email') {
    return NextResponse.json({ ok: false, error: 'Estado inválido.' }, { status: 409 });
  }

  const expira = data.token_expira_em ? new Date(data.token_expira_em) : null;
  if (!expira || expira.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: 'Token expirado.' }, { status: 410 });
  }

  const { error: updateError } = await supabase
    .from('contribuicoes')
    .update({
      status: 'aguardando_revisao',
      email_verificado_em: new Date().toISOString(),
      token_validacao: null,
      token_expira_em: null,
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('[contribuicoes verificar] update falhou:', updateError);
    return NextResponse.json({ ok: false, error: 'Falha ao confirmar.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'aguardando_revisao' });
}
