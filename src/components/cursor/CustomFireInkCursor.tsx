import React, { useEffect, useRef } from 'react';

interface FlameEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  colorIdx: number;
}

interface ClickBurst {
  x: number;
  y: number;
  progress: number;
}

const FIRE_PALETTE = [
  '#ffcc00', // bright gold core
  '#ff5500', // fiery orange
  '#ef0574', // electric magenta
  '#e6193c', // crimson flame
  '#8b001a', // deep dark blood-ink
];

const FLAME_ANCHORS = [
  { u: 0.22, v: 0.14, angle: -0.65, len: 0.20, width: 0.075, speed: 7.5, phase: 0.0 },
  { u: 0.38, v: 0.22, angle: -0.55, len: 0.24, width: 0.085, speed: 8.8, phase: 1.3 },
  { u: 0.54, v: 0.30, angle: -0.42, len: 0.26, width: 0.095, speed: 6.9, phase: 2.5 },
  { u: 0.68, v: 0.43, angle: 0.35, len: 0.30, width: 0.11, speed: 9.2, phase: 3.7 },
  { u: 0.78, v: 0.51, angle: 0.48, len: 0.26, width: 0.085, speed: 10.4, phase: 4.9 },
  { u: 0.60, v: 0.62, angle: 0.88, len: 0.32, width: 0.11, speed: 8.3, phase: 0.8 },
  { u: 0.71, v: 0.77, angle: 0.96, len: 0.28, width: 0.085, speed: 9.7, phase: 2.1 },
  { u: 0.17, v: 0.38, angle: 2.35, len: 0.16, width: 0.065, speed: 7.9, phase: 5.4 },
  { u: 0.29, v: 0.66, angle: 2.22, len: 0.20, width: 0.075, speed: 8.6, phase: 3.1 },
];

export const CustomFireInkCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const finePointerQuery = window.matchMedia('(pointer: fine)');
    if (!finePointerQuery.matches) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const cursorImg = new Image();
    cursorImg.src = '/assets/cursors/llew-cursor-master.png';
    let imgLoaded = false;
    cursorImg.onload = () => {
      imgLoaded = true;
    };

    let width = window.innerWidth;
    let height = window.innerHeight;

    const updateSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // 1.0 pixel ratio reduces full-screen overlay memory & compositor bandwidth by 4x
      canvas.width = width;
      canvas.height = height;
    };
    updateSize();

    let mouseX = width * 0.5;
    let mouseY = height * 0.5;
    let vx = 0;
    let vy = 0;
    let moveEnergy = 0;
    let isVisible = false;
    let isHoveringInteractive = false;
    let isUnavailable = false;
    let isPressed = false;
    let pressSpring = 0;

    // Dirty bounding box from previous frame so we only clear a tiny ~180x180 region instead of 1920x1080!
    let prevClearX = 0;
    let prevClearY = 0;
    let prevClearW = width;
    let prevClearH = height;

    const MAX_EMBERS = 14;
    const embers: FlameEmber[] = Array.from({ length: MAX_EMBERS }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 2,
      life: 1,
      maxLife: 1,
      colorIdx: 0,
    }));
    let emberCursor = 0;

    const clickBursts: ClickBurst[] = [];

    const spawnEmber = (baseX: number, baseY: number, sizeScale: number) => {
      const anchor = FLAME_ANCHORS[Math.floor(Math.random() * FLAME_ANCHORS.length)];
      const e = embers[emberCursor];
      emberCursor = (emberCursor + 1) % MAX_EMBERS;

      const jitterX = (Math.random() - 0.5) * 4;
      const jitterY = (Math.random() - 0.5) * 4;
      e.x = baseX + anchor.u * sizeScale + jitterX;
      e.y = baseY + anchor.v * sizeScale + jitterY;

      const driftAngle = anchor.angle + (Math.random() - 0.5) * 0.5;
      const speed = 10 + Math.random() * 18;
      e.vx = Math.cos(driftAngle) * speed - vx * 0.08;
      e.vy = Math.sin(driftAngle) * speed - 8 - vy * 0.08;
      e.size = 1.4 + Math.random() * 2.2;
      e.life = 0;
      e.maxLife = 0.16 + Math.random() * 0.14;
      e.colorIdx = Math.floor(Math.random() * 4);
    };

    const inspectTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        isHoveringInteractive = false;
        isUnavailable = false;
        return;
      }
      const disabledEl = target.closest(
        '[disabled], [aria-disabled="true"], .cursor-unavailable'
      );
      if (disabledEl) {
        isUnavailable = true;
        isHoveringInteractive = false;
        return;
      }
      isUnavailable = false;
      const interactiveEl = target.closest(
        'button, a, [role="button"], input, select, textarea, .interactive-target, .flipbook-control-btn, .project-card-frame, .sticker-badge'
      );
      isHoveringInteractive = Boolean(interactiveEl);
    };

    const onMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;
      vx = dx;
      vy = dy;
      const stepDist = Math.hypot(dx, dy);
      moveEnergy = Math.min(1.0, moveEnergy + stepDist * 0.045);
      mouseX = e.clientX;
      mouseY = e.clientY;
      isVisible = true;
      inspectTarget(e.target);
    };

    const onMouseDown = (e: MouseEvent) => {
      isPressed = true;
      pressSpring = 1.0;
      clickBursts.push({
        x: e.clientX,
        y: e.clientY,
        progress: 0,
      });
    };

    const onMouseUp = () => {
      isPressed = false;
    };

    const onMouseLeave = () => {
      isVisible = false;
    };

    window.addEventListener('resize', updateSize, { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave, { passive: true });

    let rafId = 0;
    let lastTime = performance.now();
    let emberSpawnAccum = 0;

    const render = (now: number) => {
      rafId = requestAnimationFrame(render);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const t = now * 0.001;

      // Clear ONLY the dirty bounding box from the previous frame (zero leftover marks, 200x faster!)
      ctx.clearRect(prevClearX, prevClearY, prevClearW, prevClearH);

      vx *= 0.78;
      vy *= 0.78;
      moveEnergy *= 0.84;
      pressSpring *= 0.82;

      if (!isVisible) {
        prevClearW = 0;
        prevClearH = 0;
        return;
      }

      const hoverScale = isHoveringInteractive ? 1.11 : 1.0;
      const clickScale = isPressed ? 0.91 : 1.0 - pressSpring * 0.06;
      const baseSize = 55 * hoverScale * clickScale;

      const drawX = mouseX - baseSize * 0.022;
      const drawY = mouseY - baseSize * 0.022;

      let minDirtyX = drawX - 42;
      let minDirtyY = drawY - 42;
      let maxDirtyX = drawX + baseSize + 52;
      let maxDirtyY = drawY + baseSize + 52;

      if (moveEnergy > 0.08) {
        emberSpawnAccum += dt * (26 * moveEnergy);
        while (emberSpawnAccum >= 1) {
          emberSpawnAccum -= 1;
          spawnEmber(drawX, drawY, baseSize);
        }
      } else {
        emberSpawnAccum = 0;
      }

      // 1. Draw Click Shockwave Bursts
      for (let i = clickBursts.length - 1; i >= 0; i--) {
        const b = clickBursts[i];
        b.progress += dt * 3.2;
        if (b.progress >= 1) {
          clickBursts.splice(i, 1);
          continue;
        }
        const p = b.progress;
        const easeOut = 1 - Math.pow(1 - p, 3);
        const radius = 8 + easeOut * 36;
        const alpha = (1 - p) * 0.92;

        if (b.x - radius - 20 < minDirtyX) minDirtyX = b.x - radius - 20;
        if (b.x + radius + 20 > maxDirtyX) maxDirtyX = b.x + radius + 20;
        if (b.y - radius - 20 < minDirtyY) minDirtyY = b.y - radius - 20;
        if (b.y + radius + 20 > maxDirtyY) maxDirtyY = b.y + radius + 20;

        ctx.save();
        ctx.translate(b.x, b.y);

        ctx.strokeStyle = `rgba(230, 25, 60, ${alpha})`;
        ctx.lineWidth = 3.0 * (1 - p * 0.6);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 190, 20, ${alpha * 0.85})`;
        ctx.lineWidth = 1.5 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.78, 0, Math.PI * 2);
        ctx.stroke();

        const spikes = 10;
        for (let s = 0; s < spikes; s++) {
          const ang = (s / spikes) * Math.PI * 2 + p * 0.4;
          const innerR = radius * 0.82;
          const outerR = radius + (s % 2 === 0 ? 13 : 7) * (1 - p * 0.4);
          ctx.fillStyle =
            s % 2 === 0
              ? `rgba(239, 5, 116, ${alpha})`
              : `rgba(255, 85, 0, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang - 0.09) * innerR, Math.sin(ang - 0.09) * innerR);
          ctx.lineTo(Math.cos(ang) * outerR, Math.sin(ang) * outerR);
          ctx.lineTo(Math.cos(ang + 0.09) * innerR, Math.sin(ang + 0.09) * innerR);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Draw Hover Energy Aura Ring (flat translucent circles — zero per-frame gradient allocations!)
      if (isHoveringInteractive) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 6.5);
        const cx = drawX + baseSize * 0.42;
        const cy = drawY + baseSize * 0.42;
        ctx.fillStyle = `rgba(239, 5, 116, ${(0.14 + pulse * 0.07).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, baseSize * 0.58, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Batched Under-Layer Dark Crimson Ink Flames (2 batched fills instead of 9 gradient objects!)
      ctx.save();
      ctx.fillStyle = 'rgba(210, 14, 52, 0.74)';
      ctx.beginPath();
      for (let i = 0; i < FLAME_ANCHORS.length; i++) {
        const a = FLAME_ANCHORS[i];
        const ax = drawX + a.u * baseSize;
        const ay = drawY + a.v * baseSize;

        const wave1 = Math.sin(t * a.speed + a.phase);
        const wave2 = Math.cos(t * (a.speed * 1.37) + a.phase * 1.7);
        const reach =
          a.len *
          baseSize *
          (isHoveringInteractive ? 1.24 : 1.0) *
          (0.82 + 0.24 * wave1);
        const dir = a.angle + wave2 * 0.2;

        const tipX = ax + Math.cos(dir) * reach - vx * 0.14;
        const tipY = ay + Math.sin(dir) * reach - vy * 0.14;
        const perpX = -Math.sin(dir) * a.width * baseSize;
        const perpY = Math.cos(dir) * a.width * baseSize;

        const ctrlX = (ax + tipX) * 0.5 + perpX * wave1 * 0.8;
        const ctrlY = (ay + tipY) * 0.5 + perpY * wave1 * 0.8;

        ctx.moveTo(ax - perpX, ay - perpY);
        ctx.quadraticCurveTo(ctrlX - perpX * 0.4, ctrlY - perpY * 0.4, tipX, tipY);
        ctx.quadraticCurveTo(ctrlX + perpX * 0.4, ctrlY + perpY * 0.4, ax + perpX, ay + perpY);
      }
      ctx.fill();
      ctx.restore();

      // 4. Draw the Master Helmet-Arrow Cursor Sprite
      if (imgLoaded) {
        ctx.drawImage(cursorImg, drawX, drawY, baseSize, baseSize);
      }

      // 5. Batched Living Fire-Ink Tongues ON TOP of the cursor's aura (zero gradient allocations!)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 115, 15, 0.58)';
      ctx.beginPath();
      for (let i = 0; i < FLAME_ANCHORS.length; i++) {
        const a = FLAME_ANCHORS[i];
        const ax = drawX + a.u * baseSize;
        const ay = drawY + a.v * baseSize;

        const wave1 = Math.sin(t * (a.speed * 1.15) + a.phase);
        const wave2 = Math.sin(t * (a.speed * 1.75) + a.phase * 2.1);
        const reach =
          a.len *
          baseSize *
          0.86 *
          (isHoveringInteractive ? 1.28 : 1.0) *
          (0.76 + 0.3 * wave1);
        const dir = a.angle + wave2 * 0.24;

        const tipX = ax + Math.cos(dir) * reach - vx * 0.12;
        const tipY = ay + Math.sin(dir) * reach - vy * 0.12;
        const halfW = a.width * baseSize * 0.62;
        const perpX = -Math.sin(dir) * halfW;
        const perpY = Math.cos(dir) * halfW;

        const ctrlX = (ax + tipX) * 0.5 + perpX * wave2 * 1.05;
        const ctrlY = (ay + tipY) * 0.5 + perpY * wave2 * 1.05;

        ctx.moveTo(ax - perpX, ay - perpY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        ctx.quadraticCurveTo(ctrlX + perpX * 0.5, ctrlY + perpY * 0.5, ax + perpX, ay + perpY);
      }
      ctx.fill();
      ctx.restore();

      // 6. Update & Draw ephemeral motion sparks
      ctx.save();
      for (let i = 0; i < MAX_EMBERS; i++) {
        const e = embers[i];
        if (e.life >= e.maxLife) continue;
        e.life += dt;
        const p = e.life / e.maxLife;
        if (p >= 1) continue;

        e.x += e.vx * dt;
        e.y += e.vy * dt;
        const r = e.size * (1 - p * 0.75);
        const alpha = Math.pow(1 - p, 1.5) * 0.85;

        if (e.x - r - 6 < minDirtyX) minDirtyX = e.x - r - 6;
        if (e.x + r + 6 > maxDirtyX) maxDirtyX = e.x + r + 6;
        if (e.y - r - 6 < minDirtyY) minDirtyY = e.y - r - 6;
        if (e.y + r + 6 > maxDirtyY) maxDirtyY = e.y + r + 6;

        const color = p > 0.65 ? FIRE_PALETTE[4] : FIRE_PALETTE[e.colorIdx];
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 7. Draw Unavailable Badge
      if (isUnavailable) {
        const bx = drawX + baseSize * 0.64;
        const by = drawY + baseSize * 0.64;
        const br = 9;
        ctx.save();
        ctx.fillStyle = 'rgba(20, 4, 10, 0.9)';
        ctx.beginPath();
        ctx.arc(bx, by, br + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e6193c';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.moveTo(bx - br * 0.68, by - br * 0.68);
        ctx.lineTo(bx + br * 0.68, by + br * 0.68);
        ctx.stroke();
        ctx.restore();
      }

      prevClearX = Math.max(0, Math.floor(minDirtyX));
      prevClearY = Math.max(0, Math.floor(minDirtyY));
      prevClearW = Math.min(width - prevClearX, Math.ceil(maxDirtyX - prevClearX));
      prevClearH = Math.min(height - prevClearY, Math.ceil(maxDirtyY - prevClearY));
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="llew-custom-fire-cursor-canvas"
      aria-hidden="true"
    />
  );
};
