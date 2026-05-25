// scripts/debug-contribuicoes.ts
// Diagnóstico do fluxo de contribuições: mostra distribuição por status e as
// linhas mais recentes (com idade do token e se foi verificado). Só lê.
//
// Uso:  npx tsx scripts/debug-contribuicoes.ts

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  .env.local incompleto (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function rel(date: string | null): string {
  if (!date) return '—';
  const diffMs = Date.now() - new Date(date).getTime();
  const min = Math.round(diffMs / 60000);
  if (Math.abs(min) < 60) return `${min}min atrás`;
  const h = Math.round(min / 60);
  if (Math.abs(h) < 48) return `${h}h atrás`;
  return `${Math.round(h / 24)}d atrás`;
}

async function main() {
  console.log(`\n🔎 Supabase: ${SUPABASE_URL}\n`);

  const { data: all, error } = await supabase
    .from('contribuicoes')
    .select(
      'id, status, email, criada_em, email_verificado_em, token_expira_em, revisada_por, revisada_em',
    )
    .order('criada_em', { ascending: false });

  if (error) {
    console.error('❌  Erro ao consultar:', error.message);
    process.exit(1);
  }

  const rows = all ?? [];
  console.log(`Total de contribuições: ${rows.length}\n`);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  console.log('Distribuição por status:');
  for (const [s, n] of Object.entries(counts)) console.log(`  ${s.padEnd(20)} ${n}`);

  console.log('\nÚltimas 12 contribuições:');
  console.log(
    '  id  | status              | criado       | verificado    | email',
  );
  console.log('  ' + '-'.repeat(78));
  for (const r of rows.slice(0, 12)) {
    const id = String(r.id).padStart(4);
    const status = r.status.padEnd(19);
    const criado = rel(r.criada_em).padEnd(12);
    const verif = (r.email_verificado_em ? rel(r.email_verificado_em) : '✗ não verif').padEnd(13);
    const email = r.email ?? '—';
    console.log(`  ${id} | ${status} | ${criado} | ${verif} | ${email}`);
  }

  // Foco: presas em aguardando_email (e-mail/link não funcionou)
  const presas = rows.filter((r) => r.status === 'aguardando_email');
  if (presas.length > 0) {
    console.log(
      `\n⚠️  ${presas.length} contribuição(ões) presas em "aguardando_email" (link nunca clicado/funcionou).`,
    );
  } else {
    console.log('\n✅ Nenhuma presa em "aguardando_email".');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
