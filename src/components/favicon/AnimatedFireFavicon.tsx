import React, { useEffect } from 'react';

const FRAME_COUNT = 12;
const ICON_SIZE = 64;

// Anchor points in normalized [0..1] space of the 64x64 character favicon
// positioned along the character's spiky hair crown, visor rim, and helmet contour
const FAVICON_FLAME_TONGUES = [
  { u: 0.16, v: 0.56, angle: -1.85, len: 0.28, width: 0.11, freq: 1, phase: 0.0 },
  { u: 0.14, v: 0.38, angle: -1.45, len: 0.32, width: 0.12, freq: 2, phase: 1.1 },
  { u: 0.22, v: 0.24, angle: -1.25, len: 0.34, width: 0.13, freq: 1, phase: 2.3 },
  { u: 0.36, v: 0.18, angle: -1.35, len: 0.30, width: 0.12, freq: 2, phase: 3.4 },
  { u: 0.52, v: 0.15, angle: -1.50, len: 0.28, width: 0.12, freq: 1, phase: 4.5 },
  { u: 0.68, v: 0.16, angle: -1.65, len: 0.26, width: 0.11, freq: 2, phase: 0.7 },
  { u: 0.82, v: 0.24, angle: -1.80, len: 0.25, width: 0.10, freq: 1, phase: 1.9 },
  { u: 0.30, v: 0.44, angle: -1.55, len: 0.22, width: 0.09, freq: 2, phase: 5.2 },
  { u: 0.48, v: 0.36, angle: -1.40, len: 0.24, width: 0.10, freq: 1, phase: 2.9 },
];

const FAVICON_EMBERS = [
  { u0: 0.12, v0: 0.46, vx: -0.06, vy: -0.28, r: 2.6, phaseOffset: 0.0, color: '#ffcc00' },
  { u0: 0.18, v0: 0.30, vx: -0.04, vy: -0.24, r: 2.8, phaseOffset: 0.33, color: '#ff5500' },
  { u0: 0.30, v0: 0.20, vx: 0.02, vy: -0.20, r: 2.5, phaseOffset: 0.66, color: '#ef0574' },
  { u0: 0.46, v0: 0.16, vx: -0.03, vy: -0.18, r: 2.6, phaseOffset: 0.18, color: '#ffcc00' },
  { u0: 0.64, v0: 0.18, vx: 0.04, vy: -0.18, r: 2.4, phaseOffset: 0.52, color: '#ff5500' },
  { u0: 0.22, v0: 0.64, vx: -0.08, vy: -0.26, r: 2.4, phaseOffset: 0.81, color: '#e6193c' },
];

function renderFaviconFrame(
  ctx: CanvasRenderingContext2D,
  baseImg: HTMLImageElement,
  cycleAngle: number
) {
  const s = ICON_SIZE;
  ctx.clearRect(0, 0, s, s);

  // 1. Draw the base zoomed character portrait
  ctx.drawImage(baseImg, 0, 0, s, s);

  // 2. Outer Crimson/Magenta Fire-Ink Aura tongues around the character's head & hair
  ctx.save();
  for (let i = 0; i < FAVICON_FLAME_TONGUES.length; i++) {
    const f = FAVICON_FLAME_TONGUES[i];
    const ax = f.u * s;
    const ay = f.v * s;

    const w1 = Math.sin(cycleAngle * f.freq + f.phase);
    const w2 = Math.cos(cycleAngle * f.freq + f.phase * 1.4);
    const reach = f.len * s * (0.84 + 0.26 * w1);
    const dir = f.angle + w2 * 0.28;

    const tipX = ax + Math.cos(dir) * reach;
    const tipY = ay + Math.sin(dir) * reach;
    const halfW = f.width * s;
    const perpX = -Math.sin(dir) * halfW;
    const perpY = Math.cos(dir) * halfW;

    const ctrlX = (ax + tipX) * 0.5 + perpX * w1 * 0.85;
    const ctrlY = (ay + tipY) * 0.5 + perpY * w1 * 0.85;

    const outerGrad = ctx.createLinearGradient(ax, ay, tipX, tipY);
    outerGrad.addColorStop(0, 'rgba(139, 0, 26, 0.92)');
    outerGrad.addColorStop(0.45, 'rgba(230, 25, 60, 0.88)');
    outerGrad.addColorStop(0.82, 'rgba(239, 5, 116, 0.65)');
    outerGrad.addColorStop(1, 'rgba(239, 5, 116, 0)');

    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(ax - perpX, ay - perpY);
    ctx.quadraticCurveTo(ctrlX - perpX * 0.35, ctrlY - perpY * 0.35, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX + perpX * 0.35, ctrlY + perpY * 0.35, ax + perpX, ay + perpY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 3. Additive Glowing Fire Cores (Gold -> Orange -> Magenta) licking over the character's hair & helmet
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < FAVICON_FLAME_TONGUES.length; i++) {
    const f = FAVICON_FLAME_TONGUES[i];
    const ax = f.u * s;
    const ay = f.v * s;

    const w1 = Math.sin(cycleAngle * f.freq + f.phase + 0.4);
    const w2 = Math.sin(cycleAngle * 2 + f.phase * 1.9);
    const reach = f.len * s * 0.88 * (0.78 + 0.32 * w1);
    const dir = f.angle + w2 * 0.25;

    const tipX = ax + Math.cos(dir) * reach;
    const tipY = ay + Math.sin(dir) * reach;
    const halfW = f.width * s * 0.68;
    const perpX = -Math.sin(dir) * halfW;
    const perpY = Math.cos(dir) * halfW;

    const ctrlX = (ax + tipX) * 0.5 + perpX * w2 * 0.95;
    const ctrlY = (ay + tipY) * 0.5 + perpY * w2 * 0.95;

    const coreGrad = ctx.createLinearGradient(ax, ay, tipX, tipY);
    coreGrad.addColorStop(0, 'rgba(255, 204, 0, 0.88)');
    coreGrad.addColorStop(0.42, 'rgba(255, 85, 0, 0.78)');
    coreGrad.addColorStop(0.78, 'rgba(239, 5, 116, 0.48)');
    coreGrad.addColorStop(1, 'rgba(139, 0, 26, 0)');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.moveTo(ax - perpX, ay - perpY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
    ctx.quadraticCurveTo(ctrlX + perpX * 0.45, ctrlY + perpY * 0.45, ax + perpX, ay + perpY);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle visor fire-pulse reflection on the helmet lens
  const visorPulse = 0.5 + 0.5 * Math.sin(cycleAngle);
  const visorGrad = ctx.createRadialGradient(s * 0.34, s * 0.52, 1, s * 0.34, s * 0.52, s * 0.22);
  visorGrad.addColorStop(0, `rgba(255, 170, 30, ${(0.18 + 0.24 * visorPulse).toFixed(3)})`);
  visorGrad.addColorStop(0.6, `rgba(239, 5, 116, ${(0.12 + 0.16 * visorPulse).toFixed(3)})`);
  visorGrad.addColorStop(1, 'rgba(239, 5, 116, 0)');
  ctx.fillStyle = visorGrad;
  ctx.beginPath();
  ctx.arc(s * 0.34, s * 0.52, s * 0.22, 0, Math.PI * 2);
  ctx.fill();

  // 4. Rising Fire-Ink Embers (periodic 0..1 loop)
  const normCycle = cycleAngle / (Math.PI * 2);
  for (let i = 0; i < FAVICON_EMBERS.length; i++) {
    const e = FAVICON_EMBERS[i];
    const p = (normCycle + e.phaseOffset) % 1.0;
    const ex = (e.u0 + e.vx * p) * s + Math.sin(p * Math.PI * 2 + i) * 2.2;
    const ey = (e.v0 + e.vy * p) * s;
    const radius = e.r * (1 - p * 0.55);
    const alpha = Math.sin(p * Math.PI) * 0.95;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(ex, ey, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export const AnimatedFireFavicon: React.FC = () => {
  useEffect(() => {
    let intervalId: number | null = null;
    let initTimerId: number | null = null;
    let isDisposed = false;

    const startBakedFaviconAnimation = () => {
      if (isDisposed) return;

      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.src = '/favicon.png?v=2';

      baseImg.onload = () => {
        if (isDisposed) return;

        // Pre-bake all 12 frames ONCE on a tiny 64x64 offscreen canvas (~3ms total)
        // After baking, the canvas is discarded and runtime only swaps pre-encoded DataURLs!
        const offCanvas = document.createElement('canvas');
        offCanvas.width = ICON_SIZE;
        offCanvas.height = ICON_SIZE;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) return;

        const bakedFrames: string[] = [];
        for (let f = 0; f < FRAME_COUNT; f++) {
          const cycleAngle = (f / FRAME_COUNT) * Math.PI * 2;
          renderFaviconFrame(ctx, baseImg, cycleAngle);
          bakedFrames.push(offCanvas.toDataURL('image/png'));
        }

        // Locate or create the primary <link rel="icon"> tag
        const iconLinks = Array.from(
          document.querySelectorAll<HTMLLinkElement>(
            'link[rel="icon"], link[rel="shortcut icon"]'
          )
        );
        if (iconLinks.length === 0) {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.type = 'image/png';
          document.head.appendChild(newLink);
          iconLinks.push(newLink);
        }

        let currentFrame = 0;
        intervalId = window.setInterval(() => {
          if (document.hidden) return;
          currentFrame = (currentFrame + 1) % FRAME_COUNT;
          const dataUrl = bakedFrames[currentFrame];
          for (let i = 0; i < iconLinks.length; i++) {
            iconLinks[i].type = 'image/png';
            iconLinks[i].href = dataUrl;
          }
        }, 115);
      };
    };

    // Defer baking until 900ms after mount so initial page load is 100% unaffected
    initTimerId = window.setTimeout(startBakedFaviconAnimation, 900);

    return () => {
      isDisposed = true;
      if (initTimerId !== null) window.clearTimeout(initTimerId);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, []);

  return null;
};
