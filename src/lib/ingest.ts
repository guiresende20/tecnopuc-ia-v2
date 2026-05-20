// src/lib/ingest.ts
// Helper reusável para ingerir um pedaço de conteúdo no RAG.
// Cria uma linha em knowledge_sources e gera os chunks vetoriais em documents.
//
// Usado pelo fluxo de aprovação de contribuições da comunidade.
// Os fluxos legados (scripts/ingest.ts e api/admin/sources) seguem com sua
// própria lógica equivalente — migração para este helper é cleanup futuro.

import { supabase } from './supabase';
import { generateEmbedding } from './gemini';
import { extractVideoEmbeds } from './video-embeds';

interface IngestOptions {
  title: string;
  content: string;
  type?: string;                                // ex: 'document', 'comunidade', 'file'
  extraMetadata?: Record<string, unknown>;      // mesclado em documents.metadata
}

interface IngestResult {
  knowledgeSourceId: number;
  documentIds: number[];
}

function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 20) chunks.push(chunk);
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function ingestContent({
  title,
  content,
  type = 'document',
  extraMetadata = {},
}: IngestOptions): Promise<IngestResult> {
  const { data: source, error: sourceError } = await supabase
    .from('knowledge_sources')
    .insert({ title, content, type, video_embeds: extractVideoEmbeds(content) })
    .select('id')
    .single();

  if (sourceError || !source) {
    throw new Error(`Falha ao criar knowledge_source: ${sourceError?.message ?? 'sem retorno'}`);
  }

  const sourceId = source.id as number;
  const chunks = chunkText(content);
  const documentIds: number[] = [];

  const BATCH_SIZE = 5;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const inserted = await Promise.all(
      batch.map(async (chunk, idx) => {
        const chunkIndex = i + idx;
        const embedding = await generateEmbedding(chunk);
        const { data, error } = await supabase
          .from('documents')
          .insert({
            content: chunk,
            metadata: { source_id: sourceId, title, chunkIndex, ...extraMetadata },
            embedding,
          })
          .select('id')
          .single();
        if (error || !data) {
          console.error(`[ingest] Erro chunk ${chunkIndex}:`, error?.message);
          return null;
        }
        return data.id as number;
      }),
    );
    for (const id of inserted) {
      if (id !== null) documentIds.push(id);
    }
    // Respiro entre lotes para não estourar rate limit do Gemini.
    await new Promise((r) => setTimeout(r, 200));
  }

  return { knowledgeSourceId: sourceId, documentIds };
}
