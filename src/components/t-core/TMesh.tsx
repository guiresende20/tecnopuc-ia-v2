'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Color, type Group, type Mesh, type MeshStandardMaterial } from 'three';
import type { TState } from '@/types/app.types';
import { T_VISUAL_CONFIG } from './TStateMachine';

const TILT_MAX = 0.1745;
const TILT_LERP = 0.07;

export const T_MODEL_URL = '/assets/t-3d/t-core.glb';

useGLTF.preload(T_MODEL_URL);

const BASE_SCALE = 26.4;

interface TMeshProps {
  state: TState;
}

export function TMesh({ state }: TMeshProps) {
  const ref = useRef<Group>(null);
  const { scene } = useGLTF(T_MODEL_URL);
  const config = T_VISUAL_CONFIG[state];
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const color = new Color(config.glowColor);
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = mesh.material as MeshStandardMaterial;
        if (mat.emissive) {
          mat.emissive.copy(color);
          mat.emissiveIntensity = config.glowIntensity * 0.7;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene, config.glowColor, config.glowIntensity]);

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', handler, { passive: true });
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const targetScale = config.scale * BASE_SCALE;
    const current = ref.current.scale.x;
    const next = current + (targetScale - current) * 0.15;
    ref.current.scale.setScalar(next);

    const targetRotX = pointerRef.current.y * TILT_MAX;
    const targetRotY = pointerRef.current.x * TILT_MAX;
    ref.current.rotation.x += (targetRotX - ref.current.rotation.x) * TILT_LERP;
    ref.current.rotation.y += (targetRotY - ref.current.rotation.y) * TILT_LERP;
  });

  return <primitive ref={ref} object={scene} />;
}
