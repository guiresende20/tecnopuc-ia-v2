// src/app/api/contribuicoes/verificar/route.ts
// Endpoint chamado pelo link do e-mail de confirmação.
// Valida o token, promove status para aguardando_revisao e redireciona o
// usuário para uma página de feedback.

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const baseUrl = process.env.APP_BASE_URL ?? url.origin;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/contribuir/expirado`);
  }

  const { data, error } = await supabase
    .from('contribuicoes')
    .select('id, status, token_expira_em')
    .eq('token_validacao', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.redirect(`${baseUrl}/contribuir/expirado`);
  }

  // Se já foi promovida (clicou no link duas vezes), trata como sucesso.
  if (data.status === 'aguardando_revisao' || data.status === 'aprovada') {
    return NextResponse.redirect(`${baseUrl}/contribuir/validado`);
  }
  if (data.status !== 'aguardando_email') {
    return NextResponse.redirect(`${baseUrl}/contribuir/expirado`);
  }

  const expira = data.token_expira_em ? new Date(data.token_expira_em) : null;
  if (!expira || expira.getTime() < Date.now()) {
    return NextResponse.redirect(`${baseUrl}/contribuir/expirado`);
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
    return NextResponse.redirect(`${baseUrl}/contribuir/expirado`);
  }

  return NextResponse.redirect(`${baseUrl}/contribuir/validado`);
}
