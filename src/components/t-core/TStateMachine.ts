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

export const T_VISUAL_CONFIG: Record<TState, TVisualConfig> = {
  idle: {
    glowColor: '#552583',
    glowIntensity: 0.3,
    scale: 1,
    rotationSpeed: 0.3,
    opacity: 1,
    borderColor: 'var(--color-ocre)',
    textColor: 'var(--color-ocre)',
  },
  hover: {
    glowColor: '#EA982F',
    glowIntensity: 0.6,
    scale: 1.08,
    rotationSpeed: 0,
    opacity: 1,
    borderColor: 'var(--color-ocre)',
    textColor: 'var(--color-ocre)',
  },
  listening: {
    glowColor: '#60a5fa',
    glowIntensity: 0.8,
    scale: 1.04,
    rotationSpeed: 1,
    opacity: 1,
    borderColor: '#60a5fa',
    textColor: '#60a5fa',
  },
  processing: {
    glowColor: '#f59e0b',
    glowIntensity: 0.7,
    scale: 1.02,
    rotationSpeed: 2,
    opacity: 1,
    borderColor: '#f59e0b',
    textColor: '#f59e0b',
  },
  responding: {
    glowColor: '#a78bfa',
    glowIntensity: 0.8,
    scale: 1.05,
    rotationSpeed: 0.8,
    opacity: 1,
    borderColor: '#a78bfa',
    textColor: '#a78bfa',
  },
  speaking: {
    glowColor: '#c084fc',
    glowIntensity: 0.9,
    scale: 1.06,
    rotationSpeed: 0.5,
    opacity: 1,
    borderColor: '#c084fc',
    textColor: '#c084fc',
  },
  stable: {
    glowColor: '#4ade80',
    glowIntensity: 0.4,
    scale: 1,
    rotationSpeed: 0.2,
    opacity: 1,
    borderColor: '#4ade80',
    textColor: '#4ade80',
  },
  uncertainty: {
    glowColor: '#94a3b8',
    glowIntensity: 0.3,
    scale: 0.97,
    rotationSpeed: 1.5,
    opacity: 0.85,
    borderColor: '#94a3b8',
    textColor: '#94a3b8',
  },
  error: {
    glowColor: '#f87171',
    glowIntensity: 0.6,
    scale: 0.95,
    rotationSpeed: 0,
    opacity: 0.8,
    borderColor: '#f87171',
    textColor: '#f87171',
  },
};
