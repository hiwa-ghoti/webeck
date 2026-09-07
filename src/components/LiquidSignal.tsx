'use client';

import { useEffect, useRef } from 'react';

type TrailPoint = { x: number; y: number; life: number; speed: number; hue: number };
type Pulse = { x: number; y: number; radius: number; life: number; hue: number };

export default function LiquidSignal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const points: TrailPoint[] = [];
    const pulses: Pulse[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let last = { x: innerWidth / 2, y: innerHeight / 2, time: performance.now() };
    let drift = 0;

    const resize = () => {
      const ratio = Math.min(devicePixelRatio, 1.6);
      width = innerWidth;
      height = innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const move = (event: PointerEvent) => {
      const now = performance.now();
      const distance = Math.hypot(event.clientX - last.x, event.clientY - last.y);
      const speed = Math.min(distance / Math.max(now - last.time, 8), 2.4);
      const hue = 185 + speed * 88;
      points.push({ x: event.clientX, y: event.clientY, life: 1, speed, hue });
      if (speed > 1.05 && pulses.length < 7) {
        pulses.push({ x: event.clientX, y: event.clientY, radius: 4, life: .9, hue });
      }
      if (points.length > (reduced ? 14 : 52)) points.splice(0, points.length - (reduced ? 14 : 52));
      last = { x: event.clientX, y: event.clientY, time: now };
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      drift += reduced ? .001 : .004;
      context.globalCompositeOperation = 'lighter';

      const cx = width * .5 + Math.sin(drift * .7) * width * .12;
      const cy = height * .5 + Math.cos(drift) * height * .09;
      const aura = context.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * .62);
      aura.addColorStop(0, 'rgba(27, 224, 255, .055)');
      aura.addColorStop(.42, 'rgba(87, 65, 255, .025)');
      aura.addColorStop(1, 'rgba(4, 6, 16, 0)');
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      for (const pulse of pulses) {
        pulse.radius += 3.8;
        pulse.life -= .022;
        context.beginPath();
        context.arc(pulse.x, pulse.y, pulse.radius, 0, Math.PI * 2);
        context.strokeStyle = `hsla(${pulse.hue}, 95%, 67%, ${Math.max(0, pulse.life) * .24})`;
        context.lineWidth = 1.2 + pulse.life * 2.4;
        context.stroke();
      }

      if (points.length > 1) {
        for (let offset = -1; offset <= 1; offset++) {
          context.beginPath();
          const first = points[0];
          context.moveTo(first.x + offset * 4, first.y);
          for (let index = 1; index < points.length - 1; index++) {
            const current = points[index];
            const next = points[index + 1];
            const wobble = Math.sin(index * 1.7 + drift * 22) * current.speed * 3;
            context.quadraticCurveTo(current.x + offset * 4, current.y + wobble, (current.x + next.x) / 2 + offset * 4, (current.y + next.y) / 2);
          }
          const newest = points[points.length - 1];
          const splitHue = offset === 0 ? newest.hue : offset < 0 ? 185 : 318;
          context.strokeStyle = `hsla(${splitHue}, 100%, 68%, ${newest.life * (offset === 0 ? .48 : .17)})`;
          context.lineWidth = 1.2 + newest.speed * (offset === 0 ? 5 : 2.5);
          context.shadowColor = `hsla(${splitHue}, 100%, 60%, .8)`;
          context.shadowBlur = 10 + newest.speed * 16;
          context.stroke();
        }
      }

      context.shadowBlur = 0;
      context.globalCompositeOperation = 'source-over';
      for (const point of points) point.life -= reduced ? .045 : .018;
      while (points[0]?.life <= 0) points.shift();
      while (pulses[0]?.life <= 0) pulses.shift();
      frame = requestAnimationFrame(draw);
    };

    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', move, { passive: true });
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('resize', resize);
      removeEventListener('pointermove', move);
      removeEventListener('pointerdown', move);
    };
  }, []);

  return <canvas ref={canvasRef} className="liquid-signal" aria-hidden="true" />;
}
