// scripts/bench-thinking.ts
// Benchmark do impacto de thinkingBudget no TTFT do Gemini 2.5 Flash.
// Execute com: npx tsx scripts/bench-thinking.ts
//
// Mede Time To First Token (TTFT) — momento entre o request e o primeiro byte
// do stream — pra comparar:
//   - thinkingLevel='high' → thinkingBudget=-1 (modelo decide, comportamento antigo)
//   - thinkingLevel='low'  → thinkingBudget=0  (thinking desligado, novo default)
//
// Não envolve o dev server: chama streamChat() direto. Isola a latência do LLM
// das overheads de HTTP, edge runtime, Supabase RPC, embedding, etc.

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Dynamic import: gemini.ts lê process.env no load, então tem que vir
// DEPOIS do dotenv.config() (ES module hoisting executaria import estático antes).
type StreamChat = typeof import('../src/lib/gemini').streamChat;
type BuildSystemPrompt = typeof import('../src/lib/gemini').buildSystemPrompt;
let streamChat: StreamChat;
let buildSystemPrompt: BuildSystemPrompt;

const SAMPLE_CONTEXT = `[Fonte 1: tecnopuc.md]
TecnoPUC é o Parque Científico e Tecnológico da PUCRS, fundado em 2003. Hoje abriga
mais de 150 empresas residentes, com forte presença em IA, energia, saúde e tecnologia
para imagem. O parque tem 4 hubs verticais e diversos programas de aceleração.

[Fonte 2: hubs.md]
Os hubs do TecnoPUC são verticais temáticas que conectam empresas, pesquisadores e
projetos: Hub de Saúde, Hub de Energia, Hub de Tecnologias para Imagem e Hub de IA.
Cada hub tem coordenação dedicada e programa próprio de eventos.`;

const SAMPLE_PROMPT =
  'Você é um assistente do TecnoPUC. Responda com base apenas no contexto fornecido. ' +
  'Se a resposta não estiver no contexto, diga que não sabe.';

const QUERIES = [
  'O que é o TecnoPUC?',
  'Quais são os hubs?',
  'Em que ano foi fundado?',
  'Quantas empresas tem no parque?',
  'Quais áreas mais fortes?',
];

async function measureTTFT(
  thinkingLevel: 'low' | 'high',
  query: string,
): Promise<{ ttft: number; ttlb: number; chunks: number; chars: number }> {
  const systemPrompt = buildSystemPrompt(SAMPLE_CONTEXT, SAMPLE_PROMPT, 'pt');
  const messages = [{ role: 'user' as const, content: query }];

  const t0 = performance.now();
  const stream = await streamChat(messages, systemPrompt, 0.5, 512, thinkingLevel);

  const reader = stream.getReader();
  let firstByteAt: number | null = null;
  let chunks = 0;
  let chars = 0;
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstByteAt === null) firstByteAt = performance.now();
    chunks++;
    chars += decoder.decode(value, { stream: true }).length;
  }
  const ttlb = performance.now() - t0;
  const ttft = firstByteAt !== null ? firstByteAt - t0 : ttlb;

  return { ttft, ttlb, chunks, chars };
}

const median = (arr: number[]): number => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};
const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
const min = (arr: number[]): number => Math.min(...arr);
const max = (arr: number[]): number => Math.max(...arr);

async function runRound(label: 'high' | 'low'): Promise<number[]> {
  const ttfts: number[] = [];
  console.log(`\n── Modo ${label} (thinkingBudget=${label === 'low' ? 0 : -1}) ──`);
  for (let i = 0; i < QUERIES.length; i++) {
    const r = await measureTTFT(label, QUERIES[i]);
    ttfts.push(r.ttft);
    console.log(
      `  q${i + 1}: TTFT=${r.ttft.toFixed(0).padStart(5)} ms  ` +
        `TTLB=${r.ttlb.toFixed(0).padStart(5)} ms  ` +
        `${r.chunks}ch / ${r.chars} chars  "${QUERIES[i]}"`,
    );
  }
  return ttfts;
}

async function main() {
  const gemini = await import('../src/lib/gemini');
  streamChat = gemini.streamChat;
  buildSystemPrompt = gemini.buildSystemPrompt;

  console.log('Benchmark: impacto de thinkingBudget no TTFT do Gemini 2.5 Flash');
  console.log(`Queries: ${QUERIES.length}  ·  Modelo: gemini-2.5-flash\n`);

  // Warm-up (descarta) — primeira chamada paga overhead de conexão/handshake.
  console.log('Warm-up (descartado)...');
  await measureTTFT('low', 'aquecimento');

  // Intercalando high/low pra reduzir viés de variação temporária do endpoint.
  const high1 = await runRound('high');
  const low1 = await runRound('low');
  const high2 = await runRound('high');
  const low2 = await runRound('low');

  const high = [...high1, ...high2];
  const low = [...low1, ...low2];

  console.log('\n══════════════════ RESULTADOS (TTFT) ══════════════════');
  console.log(
    `high (thinkingBudget=-1): median=${median(high).toFixed(0)} ms  ` +
      `avg=${avg(high).toFixed(0)} ms  min=${min(high).toFixed(0)}  max=${max(high).toFixed(0)}`,
  );
  console.log(
    `low  (thinkingBudget=0):  median=${median(low).toFixed(0)} ms  ` +
      `avg=${avg(low).toFixed(0)} ms  min=${min(low).toFixed(0)}  max=${max(low).toFixed(0)}`,
  );
  const deltaMed = median(high) - median(low);
  const deltaPct = (deltaMed / median(high)) * 100;
  console.log(
    `\nGanho na mediana: ${deltaMed.toFixed(0)} ms ` +
      `(${deltaPct >= 0 ? '-' : '+'}${Math.abs(deltaPct).toFixed(1)}% TTFT)`,
  );
}

main().catch((err) => {
  console.error('Falha no benchmark:', err);
  process.exit(1);
});
