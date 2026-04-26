import { create } from 'zustand';
import type {
  AppState,
  TState,
  HubId,
  InteractionMode,
  ViewportMode,
  ResponseNode,
} from '@/types/app.types';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface AppActions {
  setAudioLevel: (level: number) => void;
  setViewportMode: (mode: ViewportMode) => void;
  setInteractionMode: (mode: InteractionMode) => void;
  setTState: (state: TState) => void;
  setRadialOpen: (open: boolean) => void;
  setSelectedHub: (hub: HubId | null) => void;
  setActiveResponseId: (id: string | null) => void;
  addResponse: (response: ResponseNode) => void;
  clearResponses: () => void;
  togglePanel: (panel: keyof AppState['panels']) => void;
  closeAllPanels: () => void;
  setAudioPermission: (permission: AppState['audio']['permission']) => void;
  setRecording: (recording: boolean) => void;
  setPartialTranscript: (text: string) => void;
  setFinalTranscript: (text: string) => void;
  setSpeaking: (speaking: boolean) => void;
  setMuted: (muted: boolean) => void;
  setInputValue: (value: string) => void;
  setSubmitting: (submitting: boolean) => void;
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

const initialState: AppState & { toasts: Toast[]; audioLevel: number } = {
  toasts: [],
  audioLevel: 0,
  viewportMode: 'desktop',
  interactionMode: 'text',
  tState: 'idle',
  radialOpen: false,
  selectedHub: null,
  activeResponseId: null,
  responses: [],
  panels: {
    detail: false,
    hub: false,
    timeline: false,
    audioSettings: false,
  },
  audio: {
    permission: 'unknown',
    recording: false,
    partialTranscript: '',
    finalTranscript: '',
    speaking: false,
    voiceName: 'Puck',
    playbackRate: 1,
    volume: 1,
    muted: false,
  },
  input: {
    value: '',
    submitting: false,
  },
};

export const useAppStore = create<AppState & { toasts: Toast[]; audioLevel: number } & AppActions>((set) => ({
  ...initialState,

  setAudioLevel: (level) => set({ audioLevel: level }),
  setViewportMode: (mode) => set({ viewportMode: mode }),
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  setTState: (state) => set({ tState: state }),
  setRadialOpen: (open) => set({ radialOpen: open }),
  setSelectedHub: (hub) => set({ selectedHub: hub }),
  setActiveResponseId: (id) => set({ activeResponseId: id }),

  addResponse: (response) =>
    set((s) => ({ responses: [...s.responses, response] })),

  clearResponses: () =>
    set({ responses: [], activeResponseId: null }),

  togglePanel: (panel) =>
    set((s) => ({
      panels: { ...s.panels, [panel]: !s.panels[panel] },
    })),

  closeAllPanels: () =>
    set({ panels: { detail: false, hub: false, timeline: false, audioSettings: false } }),

  setAudioPermission: (permission) =>
    set((s) => ({ audio: { ...s.audio, permission } })),

  setRecording: (recording) =>
    set((s) => ({ audio: { ...s.audio, recording } })),

  setPartialTranscript: (text) =>
    set((s) => ({ audio: { ...s.audio, partialTranscript: text } })),

  setFinalTranscript: (text) =>
    set((s) => ({ audio: { ...s.audio, finalTranscript: text } })),

  setSpeaking: (speaking) =>
    set((s) => ({ audio: { ...s.audio, speaking } })),

  setMuted: (muted) =>
    set((s) => ({ audio: { ...s.audio, muted } })),

  setInputValue: (value) =>
    set((s) => ({ input: { ...s.input, value } })),

  setSubmitting: (submitting) =>
    set((s) => ({ input: { ...s.input, submitting } })),

  showToast: (type, message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: `toast_${Date.now()}_${Math.random()}`, type, message }],
    })),

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
