// src/app/api/admin/contribuicoes/route.ts
// Endpoints admin para moderar contribuições da comunidade.
//   GET   → lista contribuições por status + count de pendentes (para badge)
//   PATCH → aprova (ingere no RAG) ou rejeita

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authAdmin } from '../settings/route';
import { adminLimiter, enforceLimit, getClientIp } from '@/lib/rate-limit';
import { ingestContent } from '@/lib/ingest';

const ALLOWED_STATUS = [
  'aguardando_email',
  'aguardando_revisao',
  'aprovada',
  'rejeitada',
] as const;
type Status = (typeof ALLOWED_STATUS)[number];

function getAdminUsername(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) return null;
  try {
    const decoded = atob(authHeader.split(' ')[1]);
    const colonIndex = decoded.indexOf(':');
    return colonIndex === -1 ? null : decoded.slice(0, colonIndex);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const limited = await enforceLimit(adminLimiter, getClientIp(req));
  if (limited) return limited;

  if (!authAdmin(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const url = new URL(req.url);
  const statusParam = url.searchParams.get('status');
  const status =
    statusParam && (ALLOWED_STATUS as readonly string[]).includes(statusParam)
      ? (statusParam as Status)
      : null;

  let query = supabase
    .from('contribuicoes')
    .select(
      'id, conteudo_original, conteudo_aprovado, categoria, email, status, criada_em, email_verificado_em, revisada_por, revisada_em, motivo_rejeicao, knowledge_source_id',
    )
    .order('criada_em', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: pendingCount } = await supabase
    .from('contribuicoes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aguardando_revisao');

  return NextResponse.json({ items: data ?? [], pendingCount: pendingCount ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const limited = await enforceLimit(adminLimiter, getClientIp(req));
  if (limited) return limited;

  if (!authAdmin(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const username = getAdminUsername(req);
  if (!username) {
    return NextResponse.json({ error: 'Username inválido' }, { status: 401 });
  }

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
  const id = typeof data.id === 'string' ? data.id : '';
  const acao = data.acao;

  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 });
  }

  // Garante que a contribuição existe e está em estado válido para moderação.
  const { data: contrib, error: fetchError } = await supabase
    .from('contribuicoes')
    .select('id, status')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !contrib) {
    return NextResponse.json({ error: 'Contribuição não encontrada.' }, { status: 404 });
  }

  if (contrib.status !== 'aguardando_revisao') {
    return NextResponse.json(
      { error: `Contribuição não está em revisão (status atual: ${contrib.status}).` },
      { status: 409 },
    );
  }

  if (acao === 'aprovar') {
    const titulo = typeof data.titulo === 'string' ? data.titulo.trim() : '';
    const conteudoAprovado =
      typeof data.conteudo_aprovado === 'string' ? data.conteudo_aprovado.trim() : '';

    if (!titulo) {
      return NextResponse.json({ error: 'Título obrigatório para aprovação.' }, { status: 400 });
    }
    if (conteudoAprovado.length < 50) {
      return NextResponse.json({ error: 'Conteúdo aprovado muito curto.' }, { status: 400 });
    }

    try {
      const { knowledgeSourceId, documentIds } = await ingestContent({
        title: titulo,
        content: conteudoAprovado,
        type: 'comunidade',
        extraMetadata: {
          contribuicao_id: id,
          origem: 'comunidade',
        },
      });

      const { error: updateError } = await supabase
        .from('contribuicoes')
        .update({
          status: 'aprovada',
          conteudo_aprovado: conteudoAprovado,
          revisada_por: username,
          revisada_em: new Date().toISOString(),
          knowledge_source_id: knowledgeSourceId,
          documents_ids: documentIds,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return NextResponse.json({
        ok: true,
        knowledgeSourceId,
        chunkCount: documentIds.length,
      });
    } catch (err) {
      console.error('[contribuicoes aprovar]', err);
      return NextResponse.json({ error: 'Falha ao aprovar contribuição.' }, { status: 500 });
    }
  }

  if (acao === 'rejeitar') {
    const motivo =
      typeof data.motivo_rejeicao === 'string' && data.motivo_rejeicao.trim()
        ? data.motivo_rejeicao.trim()
        : null;

    const { error: updateError } = await supabase
      .from('contribuicoes')
      .update({
        status: 'rejeitada',
        revisada_por: username,
        revisada_em: new Date().toISOString(),
        motivo_rejeicao: motivo,
      })
      .eq('id', id);

    if (updateError) {
      console.error('[contribuicoes rejeitar]', updateError);
      return NextResponse.json({ error: 'Falha ao rejeitar.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
}
