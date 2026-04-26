'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

export function StageBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext('2d', { alpha: false });
    if (!ctxOrNull) return;
    const ctx = ctxOrNull as CanvasRenderingContext2D;

    interface Node { x: number; y: number; vx: number; vy: number; r: number; _scale: number; _homeX: number; _homeY: number; }

    let W = 0, H = 0;
    let mouse = { x: -9999, y: -9999 };
    let ripples: { x: number; y: number; r: number; alpha: number }[] = [];
    let lastFrame = 0;
    const FPS = 40;
    let paused = false;
    let animId = 0;
    let fogCanvas: HTMLCanvasElement | null = null;
    let nodes: Node[] = [];

    const COUNT = 80;
    const MAX_DIST = 200;
    const MAX_DIST_SQ = MAX_DIST * MAX_DIST;
    const MOUSE_DIST = 220;
    const MOUSE_DIST_SQ = MOUSE_DIST * MOUSE_DIST;
    const MOUSE_PULL = 0.10;
    const SCALE_NEAR = 0.75;
    const SCALE_FAR = 1.8;
    const HOME_SPRING = 0.004;

    // Hue global oscilante (azul ↔ roxo) e multiplicador de velocidade.
    // speedTarget vai a 1.6 quando a IA está respondendo; speedSmooth segue suave.
    // PHASE_STEP é calibrado para ciclo de ~12s a 40fps; o multiplicador acelera
    // tanto a deriva dos nós quanto a oscilação da cor.
    let phase = 0;
    let speedTarget = 1;
    let speedSmooth = 1;
    let currentColor = '0,200,255';
    const COLOR_PERIOD_FRAMES = FPS * 12;
    const PHASE_STEP = (Math.PI * 2) / COLOR_PERIOD_FRAMES;
    const SPEED_BOOST = 1.6;
    const SPEED_EASE = 0.04;

    function buildFogCache() {
      fogCanvas = document.createElement('canvas');
      fogCanvas.width = W; fogCanvas.height = H;
      const fc = fogCanvas.getContext('2d')!;
      fc.fillStyle = '#08080e';
      fc.fillRect(0, 0, W, H);
      const fog1 = fc.createRadialGradient(W * .25, H * .45, 0, W * .25, H * .45, W * .45);
      fog1.addColorStop(0, 'rgba(0,120,200,0.07)'); fog1.addColorStop(1, 'rgba(0,0,0,0)');
      fc.fillStyle = fog1; fc.fillRect(0, 0, W, H);
      const fog2 = fc.createRadialGradient(W * .75, H * .5, 0, W * .75, H * .5, W * .4);
      fog2.addColorStop(0, 'rgba(100,40,200,0.07)'); fog2.addColorStop(1, 'rgba(0,0,0,0)');
      fc.fillStyle = fog2; fc.fillRect(0, 0, W, H);
    }

    // Grid-jitter: divide a tela em células e coloca 1 nó por célula
    // Garante cobertura uniforme em vez de aglomerados aleatórios
    function makeNodes(): Node[] {
      const cols = Math.ceil(Math.sqrt(COUNT * (W / H)));
      const rows = Math.ceil(COUNT / cols);
      const cellW = W / cols;
      const cellH = H / rows;
      const result: Node[] = [];
      for (let row = 0; row < rows && result.length < COUNT; row++) {
        for (let col = 0; col < cols && result.length < COUNT; col++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.06 + Math.random() * 0.08; // 0.06 – 0.14 px/frame
          const x = (col + 0.15 + Math.random() * 0.7) * cellW;
          const y = (row + 0.15 + Math.random() * 0.7) * cellH;
          result.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: Math.random() * 1.4 + 1.0,
            _scale: SCALE_FAR,
            _homeX: x,
            _homeY: y,
          });
        }
      }
      return result;
    }

    function resize() {
      W = (canvas as HTMLCanvasElement).width = window.innerWidth;
      H = (canvas as HTMLCanvasElement).height = window.innerHeight;
      buildFogCache();
      nodes = makeNodes();
    }

    function update() {
      // Speed easing + advance da fase de cor (mais rápido durante resposta)
      speedSmooth += (speedTarget - speedSmooth) * SPEED_EASE;
      phase += PHASE_STEP * speedSmooth;
      const hueT = (Math.sin(phase) + 1) * 0.5;
      const r = Math.round(hueT * 160);
      const g = Math.round((1 - hueT) * 200 + hueT * 60);
      currentColor = `${r},${g},255`;

      nodes.forEach(n => {
        const dx = mouse.x - n.x, dy = mouse.y - n.y;
        const dSq = dx * dx + dy * dy;
        const influence = dSq < MOUSE_DIST_SQ ? 1 - Math.sqrt(dSq) / MOUSE_DIST : 0;
        if (dSq < MOUSE_DIST_SQ && dSq > 1) {
          const d = Math.sqrt(dSq);
          const force = influence * MOUSE_PULL;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }
        // Mola de retorno: puxa o nó de volta à posição inicial.
        // Escala por (1 - influence) para não competir com a atração do mouse quando ele está perto.
        const returnStrength = HOME_SPRING * (1 - influence);
        n.vx += (n._homeX - n.x) * returnStrength;
        n.vy += (n._homeY - n.y) * returnStrength;
        const targetScale = SCALE_FAR - (SCALE_FAR - SCALE_NEAR) * influence;
        n._scale += (targetScale - n._scale) * 0.08;
        n.vx *= 0.94; n.vy *= 0.94;
        // Garante drift mínimo para o nó nunca parar completamente
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd < 0.04) {
          const s = 0.04 / (spd || 1);
          n.vx *= s; n.vy *= s;
        }
        // Multiplicador de velocidade entra só na integração de posição
        n.x += n.vx * speedSmooth;
        n.y += n.vy * speedSmooth;
        if (n.x < -50) n.x = W + 50;
        if (n.x > W + 50) n.x = -50;
        if (n.y < -50) n.y = H + 50;
        if (n.y > H + 50) n.y = -50;
      });
    }

    function draw() {
      if (fogCanvas) ctx.drawImage(fogCanvas, 0, 0);

      // Arestas — todas usam a hue global do frame
      ctx.lineWidth = 1.2;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < MAX_DIST_SQ) {
            const alpha = ((1 - Math.sqrt(dSq) / MAX_DIST) * 0.65).toFixed(2);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${currentColor},${alpha})`;
            ctx.stroke();
          }
        }
      }

      // Conexões com o mouse
      ctx.lineWidth = 0.7;
      nodes.forEach(n => {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < MOUSE_DIST_SQ) {
          const alpha = ((1 - Math.sqrt(dSq) / MOUSE_DIST) * 0.4).toFixed(2);
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${currentColor},${alpha})`;
          ctx.stroke();
        }
      });

      // Nós: shadowBlur produz o halo sem createRadialGradient por frame
      nodes.forEach(n => {
        ctx.shadowBlur = 12 * n._scale;
        ctx.shadowColor = `rgba(${currentColor},1)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * n._scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${currentColor},1)`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Ripples
      ripples = ripples.filter(rip => rip.alpha > 0.01);
      ripples.forEach(rip => {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, rip.r + i * 22, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${currentColor},${(rip.alpha * (1 - i * 0.3)).toFixed(2)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        rip.r += 3.5;
        rip.alpha *= 0.94;
      });

      // Vinheta suave nas bordas (reduzida para não esconder os nós)
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.1);
      vig.addColorStop(0, 'rgba(8,8,14,0)');
      vig.addColorStop(1, 'rgba(8,8,14,0.4)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    }

    function frame(ts: number) {
      animId = requestAnimationFrame(frame);
      if (paused) return;
      const interval = 1000 / FPS;
      if (ts - lastFrame < interval) return;
      lastFrame = ts;
      update();
      draw();
    }

    const onResize = () => resize();
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onClick = (e: MouseEvent) => ripples.push({ x: e.clientX, y: e.clientY, r: 0, alpha: 0.8 });
    const onVisibility = () => { paused = document.hidden; };

    // Subscribe ao tState pra acelerar a rede quando a IA responde (texto ou voz)
    const unsubStore = useAppStore.subscribe((state) => {
      const responding = state.tState === 'responding' || state.tState === 'speaking';
      speedTarget = responding ? SPEED_BOOST : 1.0;
    });
    // Aplica estado inicial caso já esteja respondendo
    {
      const s = useAppStore.getState();
      const responding = s.tState === 'responding' || s.tState === 'speaking';
      speedTarget = responding ? SPEED_BOOST : 1.0;
      speedSmooth = speedTarget;
    }

    resize(); // inicializa W, H, fogCanvas e nodes
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      unsubStore();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />
      {/* Scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          opacity: 0.5,
        }}
      />
      {/* Corner marks */}
      {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
        <div
          key={pos}
          aria-hidden="true"
          style={{
            position: 'fixed',
            width: 20, height: 20,
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.3,
            ...(pos === 'tl' ? { top: 12, left: 12, borderTop: '1.5px solid #0099ff', borderLeft: '1.5px solid #0099ff' } : {}),
            ...(pos === 'tr' ? { top: 12, right: 12, borderTop: '1.5px solid #0099ff', borderRight: '1.5px solid #0099ff' } : {}),
            ...(pos === 'bl' ? { bottom: 12, left: 12, borderBottom: '1.5px solid #0099ff', borderLeft: '1.5px solid #0099ff' } : {}),
            ...(pos === 'br' ? { bottom: 12, right: 12, borderBottom: '1.5px solid #0099ff', borderRight: '1.5px solid #0099ff' } : {}),
          }}
        />
      ))}
    </>
  );
}
