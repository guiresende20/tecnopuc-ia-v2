import type { Locale } from '@/i18n/locales';

export type ViewportMode = 'desktop' | 'mobile';

export type InteractionMode = 'text' | 'voice' | 'hybrid';

export type TState =
  | 'idle'
  | 'hover'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'speaking'
  | 'stable'
  | 'uncertainty'
  | 'error';

export type HubId = 'hubs' | 'estrutura' | 'programas' | 'sobre';

export type ResponseOrigin = 'text' | 'voice' | 'hub';
export type ResponseType = 'primary' | 'secondary' | 'card' | 'topic';

export interface ResponseAction {
  type: 'copy' | 'expand' | 'replay_voice';
}

export interface ResponseNode {
  id: string;
  origin: ResponseOrigin;
  type: ResponseType;
  title?: string;
  body?: string;
  summary?: string;
  relevance?: number;
  voiceAvailable?: boolean;
  actions?: ResponseAction[];
  sources?: { source: string; similarity: string }[];
}

export interface RadialItem {
  id: HubId;
  label: string;
  description?: string;
  icon?: string;
}

export interface PanelFlags {
  detail: boolean;
  hub: boolean;
  timeline: boolean;
  audioSettings: boolean;
}

export interface AudioState {
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  recording: boolean;
  partialTranscript: string;
  finalTranscript: string;
  speaking: boolean;
  voiceName: string;
  playbackRate: number;
  volume: number;
  muted: boolean;
}

export interface InputState {
  value: string;
  submitting: boolean;
}

export interface AppState {
  locale: Locale;
  viewportMode: ViewportMode;
  interactionMode: InteractionMode;
  tState: TState;
  radialOpen: boolean;
  selectedHub: HubId | null;
  activeResponseId: string | null;
  responses: ResponseNode[];
  panels: PanelFlags;
  audio: AudioState;
  input: InputState;
}
