import type { TState } from '@/types/app.types';

// Mapeamento de estilos visuais por estado (usado pelo TCore3D 2D placeholder)
export interface TVisualConfig {
  glowColor: string;
  glowIntensity: number; // 0–1
  scale: number;
  rotationSpeed: number; // multiplicador
  opacity: number;
  borderColor: string;
  textColor: string;
}

// Paleta: azul é a cor padrão; só responding/speaking trocam para roxo.
// Erro mantém vermelho por clareza (sinal forte de falha).
const BLUE = '#60a5fa';
const PURPLE_RESPONDING = '#a78bfa';
const PURPLE_SPEAKING = '#c084fc';
const RED_ERROR = '#f87171';

export const T_VISUAL_CONFIG: Record<TState, TVisualConfig> = {
  idle: {
    glowColor: BLUE,
    glowIntensity: 0.3,
    scale: 1,
    rotationSpeed: 0.3,
    opacity: 1,
    borderColor: BLUE,
    textColor: BLUE,
  },
  hover: {
    glowColor: BLUE,
    glowIntensity: 0.6,
    scale: 1.08,
    rotationSpeed: 0,
    opacity: 1,
    borderColor: BLUE,
    textColor: BLUE,
  },
  listening: {
    glowColor: BLUE,
    glowIntensity: 0.8,
    scale: 1.04,
    rotationSpeed: 1,
    opacity: 1,
    borderColor: BLUE,
    textColor: BLUE,
  },
  processing: {
    glowColor: BLUE,
    glowIntensity: 0.7,
    scale: 1.02,
    rotationSpeed: 2,
    opacity: 1,
    borderColor: BLUE,
    textColor: BLUE,
  },
  responding: {
    glowColor: PURPLE_RESPONDING,
    glowIntensity: 0.8,
    scale: 1.05,
    rotationSpeed: 0.8,
    opacity: 1,
    borderColor: PURPLE_RESPONDING,
    textColor: PURPLE_RESPONDING,
  },
  speaking: {
    glowColor: PURPLE_SPEAKING,
    glowIntensity: 0.9,
    scale: 1.06,
    rotationSpeed: 0.5,
    opacity: 1,
    borderColor: PURPLE_SPEAKING,
    textColor: PURPLE_SPEAKING,
  },
  stable: {
    glowColor: BLUE,
    glowIntensity: 0.4,
    scale: 1,
    rotationSpeed: 0.2,
    opacity: 1,
    borderColor: BLUE,
    textColor: BLUE,
  },
  uncertainty: {
    glowColor: BLUE,
    glowIntensity: 0.3,
    scale: 0.97,
    rotationSpeed: 1.5,
    opacity: 0.85,
    borderColor: BLUE,
    textColor: BLUE,
  },
  error: {
    glowColor: RED_ERROR,
    glowIntensity: 0.6,
    scale: 0.95,
    rotationSpeed: 0,
    opacity: 0.8,
    borderColor: RED_ERROR,
    textColor: RED_ERROR,
  },
};
