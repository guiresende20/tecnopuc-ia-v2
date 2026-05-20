// src/lib/video-embeds.ts
// Detecção e montagem de embeds de vídeo (YouTube / Vimeo / Loom).
//
// Módulo PURO, sem dependências — pode ser importado tanto no servidor
// (ingestão, /api/chat) quanto no client (componente VideoEmbed) e em
// scripts standalone (tsx) sem puxar SDKs.
//
// Vídeo NÃO participa do RAG: não vira embedding nem é buscado. É só um
// anexo visual ligado à knowledge_source, exibido quando aquela source é
// citada na resposta.

export type VideoProvider = 'youtube' | 'vimeo' | 'loom';

export interface VideoEmbed {
  provider: VideoProvider;
  id: string;
  url: string; // URL canônica (clicável) do vídeo
}

// Cada matcher captura o ID no grupo 1. Vários matchers podem apontar para o
// mesmo provider (ex: YouTube tem forma de path e forma de query).
const MATCHERS: { provider: VideoProvider; re: RegExp }[] = [
  // YouTube — path: youtu.be/ID, /embed/ID, /shorts/ID, /live/ID, /v/ID
  {
    provider: 'youtube',
    re: /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/)([A-Za-z0-9_-]{11})/gi,
  },
  // YouTube — query: youtube.com/watch?...v=ID (v= em qualquer posição)
  {
    provider: 'youtube',
    re: /youtube(?:-nocookie)?\.com\/watch\?(?:[^\s"'<>]*&)?v=([A-Za-z0-9_-]{11})/gi,
  },
  // Vimeo — vimeo.com/123456789 ou player.vimeo.com/video/123456789
  {
    provider: 'vimeo',
    re: /(?:player\.)?vimeo\.com\/(?:video\/)?(\d{6,})/gi,
  },
  // Loom — loom.com/share/ID ou loom.com/embed/ID (IDs são hex longos)
  {
    provider: 'loom',
    re: /loom\.com\/(?:share|embed)\/([A-Za-z0-9]{16,})/gi,
  },
];

function canonicalUrl(provider: VideoProvider, id: string): string {
  switch (provider) {
    case 'youtube':
      return `https://youtu.be/${id}`;
    case 'vimeo':
      return `https://vimeo.com/${id}`;
    case 'loom':
      return `https://www.loom.com/share/${id}`;
  }
}

// Extrai todos os vídeos de um texto, sem duplicatas, na ordem em que
// aparecem. A ordem importa: a estratégia de exibição usa o primeiro vídeo
// da source mais relevante.
export function extractVideoEmbeds(text: string): VideoEmbed[] {
  if (!text) return [];

  const hits: { index: number; provider: VideoProvider; id: string }[] = [];
  for (const { provider, re } of MATCHERS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      hits.push({ index: m.index, provider, id: m[1] });
    }
  }

  hits.sort((a, b) => a.index - b.index);

  const seen = new Set<string>();
  const result: VideoEmbed[] = [];
  for (const h of hits) {
    const key = `${h.provider}:${h.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ provider: h.provider, id: h.id, url: canonicalUrl(h.provider, h.id) });
  }
  return result;
}

// Monta a URL do <iframe>. YouTube usa youtube-nocookie por padrão (não
// rastreia até o play — melhor para LGPD).
export function buildEmbedUrl(v: VideoEmbed): string {
  switch (v.provider) {
    case 'youtube':
      return `https://www.youtube-nocookie.com/embed/${v.id}`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${v.id}`;
    case 'loom':
      return `https://www.loom.com/embed/${v.id}`;
  }
}
