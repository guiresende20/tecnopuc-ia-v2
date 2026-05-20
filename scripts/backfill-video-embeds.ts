// scripts/backfill-video-embeds.ts
// Backfill one-time: varre as knowledge_sources existentes, extrai os vídeos
// do conteúdo e popula a coluna video_embeds.
//
// Rodar UMA vez após aplicar video-embeds-setup.sql:
//   npx tsx scripts/backfill-video-embeds.ts
//
// Idempotente: pode rodar de novo sem efeito colateral (sempre recalcula a
// partir do content atual).

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { extractVideoEmbeds } from '../src/lib/video-embeds';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Variáveis de ambiente não configuradas. Verifique .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('id, title, content');

  if (error) throw new Error(`Erro ao listar sources: ${error.message}`);

  const sources = data ?? [];
  console.log(`\n🔍 ${sources.length} source(s) para escanear.\n`);

  let updated = 0;
  let totalVideos = 0;

  for (const row of sources) {
    const videos = extractVideoEmbeds(row.content ?? '');
    if (videos.length === 0) continue;

    const { error: updateError } = await supabase
      .from('knowledge_sources')
      .update({ video_embeds: videos })
      .eq('id', row.id);

    if (updateError) {
      console.error(`   ❌ source ${row.id} (${row.title}): ${updateError.message}`);
      continue;
    }

    updated++;
    totalVideos += videos.length;
    console.log(`   ✅ source ${row.id} (${row.title}): ${videos.length} vídeo(s) — ${videos.map((v) => v.provider).join(', ')}`);
  }

  console.log(`\n🎉 Backfill concluído. ${updated} source(s) atualizada(s), ${totalVideos} vídeo(s) no total.\n`);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
