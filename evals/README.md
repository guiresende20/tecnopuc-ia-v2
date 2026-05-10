# Eval Set — Retrieval do TecnoPUC

Eval set para medir objetivamente a qualidade do retrieval do RAG, comparando pipelines (vector-only baseline vs hybrid vs hybrid+rerank) com **dados** em vez de impressão.

## Estrutura

```
evals/
  queries.json       # 32 queries com ground truth (expected_sources)
  results/           # snapshots .json gerados pelo script
  README.md          # este arquivo
```

## Como rodar

Pré-requisito: `.env.local` configurado (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) e ingestão da knowledge base já feita (`npx tsx scripts/ingest.ts`).

```bash
# Baseline vector-only (modo atual em produção)
npx tsx scripts/eval-retrieval.ts

# Quando hybrid estiver implementado:
npx tsx scripts/eval-retrieval.ts --mode=hybrid

# Outros flags:
#   --k=10            tamanho do top-K buscado (default 10)
#   --queries=path    caminho alternativo do queries.json
```

## Métricas

Para cada K em `[1, 3, 5, 10]`:

- **Hit@K** — fração de queries em que ao menos um `expected_source` aparece nos K primeiros. Métrica binária por query, média no agregado.
- **Recall@K** — fração média de `expected_sources` recuperados nos K primeiros. Penaliza quando esperam-se múltiplas fontes e só uma vem.
- **MRR** — média de `1/rank` do primeiro hit. Captura ordenação: vir em #1 vale mais que em #5.
- **Latência p50/p95** — tempo total embedding + busca (ms).

## Categorias de query

| Categoria | n | O que testa |
|---|---|---|
| `factual_basic` | 4 | Perguntas institucionais simples (PT) — baseline fácil |
| `proper_noun` | 6 | Siglas/nomes raros (IPaq, InsCer, FabLab, Garage, NoHarm.ai, HANGAR) — caso clássico onde FTS deve ganhar de vector |
| `short_ambiguous` | 3 | Queries de 1 palavra ("hubs", "empresas", "programas") — vector pulveriza |
| `multilingual_en` | 3 | Cross-lingual EN→PT — embedding multilíngue é o único recurso |
| `multilingual_es` | 2 | Cross-lingual ES→PT |
| `multilingual_zh` | 2 | Cross-lingual ZH→PT — caso mais difícil |
| `intent_fine` | 3 | Negação ("sem ser residente"), perfil ("investidor"), estágio ("só ideia") — terreno do reranker |
| `specific_topic` | 4 | Hubs por área (IA, saúde, agro, integração PUCRS) |
| `specific_company` | 3 | Empresas nominadas (Apple, HP, Epic Games) |
| `service_infra` | 2 | Coworking, laboratórios |

## Ground truth

`expected_sources` referencia o filename em `knowledge/`. Esse é o campo `metadata.source` indexado em `documents` pelo `scripts/ingest.ts`. Cada query tem 1–3 fontes esperadas.

## Critério de aprovação para promover hybrid → produção

A Fase 1 só entra em produção se, no mesmo eval set:

1. **Hit@5 hybrid ≥ Hit@5 vector** em todas as categorias (sem regressão)
2. **Hit@5 médio sobe ≥ 5 pontos percentuais** sobre o baseline
3. **p95 de latência adicional ≤ 100ms** vs baseline (FTS roda no mesmo Postgres, deve ser barato)

Se hybrid passar mas Hit@5 ainda estiver < 0.85 em `intent_fine` ou em `multilingual_*`, isso justifica avançar para o reranker (Fase 2).

## Atualizando o eval set

Quando entrarem novos arquivos em `knowledge/` ou novas contribuições da comunidade aprovadas, adicione ao menos 2–3 queries em `queries.json` cobrindo os termos novos. O versionamento é o campo `version` no JSON — bump ao alterar.

## Limitações conhecidas

- Eval estático: não captura efeito de histórico de conversa no retrieval (hoje, no `/api/chat`, a query é só `lastMsg.content`, então OK pro baseline)
- Não mede qualidade da resposta gerada — só do retrieval. Resposta ruim com retrieval bom é problema de prompt, não desse eval
- Multilingual em ZH é só 2 queries — sinal limitado
- Não testa robustez a typo/variação morfológica explicitamente
