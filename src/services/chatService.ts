import type { ResponseNode } from '@/types/app.types';
import type { Locale } from '@/i18n/locales';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatStreamResult {
  responseNode: ResponseNode;
  abort: () => void;
}

export async function streamChat(
  messages: ChatMessage[],
  query: string,
  locale: Locale,
  onChunk: (text: string) => void,
  signal: AbortSignal,
): Promise<ResponseNode> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, query, locale }),
    signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`API error: ${res.status}`);
  }

  const sourcesHeader = res.headers.get('X-Sources');
  const sources = sourcesHeader ? JSON.parse(sourcesHeader) : [];

  const videoHeader = res.headers.get('X-Video');
  const video = videoHeader ? JSON.parse(videoHeader) : null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(fullText);
  }

  const node: ResponseNode = {
    id: `resp_${Date.now()}`,
    origin: 'text',
    type: 'primary',
    body: fullText,
    voiceAvailable: true,
    actions: [{ type: 'copy' }, { type: 'expand' }, { type: 'replay_voice' }],
    sources,
    video,
  };

  return node;
}
