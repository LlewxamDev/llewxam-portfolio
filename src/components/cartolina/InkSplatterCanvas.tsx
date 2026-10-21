import React, { useEffect, useRef } from 'react';
import { InkSplashRecord } from '../../types/experience';

const SPRITE_COLS = 6;
const SPRITE_ROWS = 4;
const TOTAL_FRAMES = 24;
const TILE_W = 320;
const TILE_H = 250;
const ANIM_DURATION_MS = 2000; // Exact 2.0 seconds: click -> ink drop & spread -> finished & baked!
const CANVAS_SCALE = 0.65; // 2.37x fewer pixels to composite with identical organic ink appearance

interface ActiveSplashAnimation {
  record: InkSplashRecord;
  startedAtMs: number;
  progress: number;
  rotation: number;
  flipX: number;
  flipY: number;
  scaleX: number;
  scaleY: number;
  paletteKey: string;
}

interface WipeTrailNode {
  x: number;
  y: number;
  angle: number;
}

interface DirtyBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function darkenHex(hex: string, factor: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 255) * factor));
  const g = Math.max(0, Math.floor(((num >> 8) & 255) * factor));
  const b = Math.max(0, Math.floor((num & 255) * factor));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

function buildSplashAnimation(record: InkSplashRecord): ActiveSplashAnimation {
  const rand = seededRandom(record.seed);
  const rotation = (rand() - 0.5) * Math.PI * 2;
  const flipX = rand() > 0.5 ? 1 : -1;
  const flipY = rand() > 0.5 ? 1 : -1;
  const scaleX = 0.94 + rand() * 0.24;
  const scaleY = 0.94 + rand() * 0.24;
  const paletteKey = `${record.pigmentHex}_${record.secondaryHex}`;

  return {
    record,
    startedAtMs: performance.now(),
    progress: 0,
    rotation,
    flipX,
    flipY,
    scaleX,
    scaleY,
    paletteKey,
  };
}

/**
 * Builds a pre-tinted offscreen sprite sheet from the real ink drop & spread video sheet.
 * IMPORTANT: Draws all 24 radial pigment gradients in 'source-over' FIRST, then masks
 * the entire sheet in a SINGLE 'destination-in' pass so no tile is ever erased!
 */
function createTintedSpriteSheet(
  baseImage: HTMLImageElement,
  pigmentHex: string,
  secondaryHex: string
): HTMLCanvasElement {
  const sheetW = SPRITE_COLS * TILE_W;
  const sheetH = SPRITE_ROWS * TILE_H;
  const off = document.createElement('canvas');
  off.width = sheetW;
  off.height = sheetH;
  const ctx = off.getContext('2d');
  if (!ctx) return off;

  const darkCore = darkenHex(pigmentHex, 0.26);
  const midCore = darkenHex(pigmentHex, 0.72);

  // 1. Fill all 24 tiles with their radial sumi-e + pigment gradients using 'source-over'
  ctx.globalCompositeOperation = 'source-over';
  for (let r = 0; r < SPRITE_ROWS; r++) {
    for (let c = 0; c < SPRITE_COLS; c++) {
      const tx = c * TILE_W;
      const ty = r * TILE_H;
      const cx = tx + TILE_W * 0.48;
      const cy = ty + TILE_H * 0.52;
      const grad = ctx.createRadialGradient(cx, cy, TILE_W * 0.04, cx, cy, TILE_W * 0.48);
      grad.addColorStop(0, darkCore);
      grad.addColorStop(0.52, midCore);
      grad.addColorStop(0.84, pigmentHex);
      grad.addColorStop(1, secondaryHex);
      ctx.fillStyle = grad;
      ctx.fillRect(tx, ty, TILE_W, TILE_H);
    }
  }

  // 2. Mask all 24 tiles in ONE single hardware pass using the alpha of ink-drop-spritesheet.png!
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(baseImage, 0, 0, sheetW, sheetH);
  ctx.globalCompositeOperation = 'source-over';

  return off;
}

function drawVideoSplashOnContext(
  ctx: CanvasRenderingContext2D,
  anim: ActiveSplashAnimation,
  sheetCache: Map<string, HTMLCanvasElement>,
  baseImage: HTMLImageElement | null,
  canvasWidth: number,
  canvasHeight: number
): DirtyBox | null {
  if (!baseImage || !baseImage.complete || baseImage.naturalWidth === 0) return null;

  let tintedSheet = sheetCache.get(anim.paletteKey);
  if (!tintedSheet) {
    tintedSheet = createTintedSpriteSheet(
      baseImage,
      anim.record.pigmentHex,
      anim.record.secondaryHex
    );
    sheetCache.set(anim.paletteKey, tintedSheet);
  }

  const p = Math.max(0, Math.min(1, anim.progress));
  const frameProgress = 1 - Math.pow(1 - p, 1.35);
  const frameIdx = Math.min(
    TOTAL_FRAMES - 1,
    Math.floor(frameProgress * (TOTAL_FRAMES - 0.001))
  );

  const col = frameIdx % SPRITE_COLS;
  const row = Math.floor(frameIdx / SPRITE_COLS);
  const sx = col * TILE_W;
  const sy = row * TILE_H;

  const cx = anim.record.x * canvasWidth;
  const cy = anim.record.y * canvasHeight;

  const spreadScale = (0.92 + 0.12 * frameProgress) * CANVAS_SCALE;
  const drawW = anim.record.radius * 2.65 * anim.scaleX * spreadScale;
  const drawH = anim.record.radius * 2.15 * anim.scaleY * spreadScale;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.94;
  ctx.translate(cx, cy);
  ctx.rotate(anim.rotation);
  ctx.scale(anim.flipX, anim.flipY);

  ctx.drawImage(
    tintedSheet,
    sx,
    sy,
    TILE_W,
    TILE_H,
    -drawW * 0.5,
    -drawH * 0.5,
    drawW,
    drawH
  );

  ctx.restore();

  const maxSpan = Math.ceil(Math.max(drawW, drawH) * 0.75) + 8;
  return {
    x: Math.max(0, Math.floor(cx - maxSpan)),
    y: Math.max(0, Math.floor(cy - maxSpan)),
    w: maxSpan * 2,
    h: maxSpan * 2,
  };
}

function getClothWipePoint(u: number): { nx: number; ny: number; angle: number } {
  const clamped = Math.max(0, Math.min(1, u));
  const sweeps = 3.0;
  const phase = clamped * Math.PI * sweeps;
  const nx = 0.5 - 0.46 * Math.cos(phase);
  const ny = 0.08 + 0.84 * clamped + 0.04 * Math.sin(phase * 2.0);

  const vx = 0.46 * Math.PI * sweeps * Math.sin(phase);
  const vy = 0.84;
  const angle = Math.atan2(vy, vx) * 0.22;
  return { nx, ny, angle };
}

function drawAtelierClothWipeOverlay(
  ctx: CanvasRenderingContext2D,
  trail: WipeTrailNode[],
  clothX: number,
  clothY: number,
  clothAngle: number
): DirtyBox {
  ctx.save();

  let minX = clothX;
  let maxX = clothX;
  let minY = clothY;
  let maxY = clothY;

  if (trail.length > 1) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 50 * CANVAS_SCALE;
    ctx.strokeStyle = 'rgba(255, 252, 244, 0.36)';
    ctx.beginPath();
    for (let i = 0; i < trail.length; i++) {
      const n = trail[i];
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
      if (i === 0) ctx.moveTo(n.x, n.y);
      else ctx.lineTo(n.x, n.y);
    }
    ctx.stroke();

    ctx.lineWidth = 28 * CANVAS_SCALE;
    ctx.strokeStyle = 'rgba(29, 136, 155, 0.10)';
    ctx.stroke();
  }

  ctx.translate(clothX, clothY);
  ctx.rotate(clothAngle);

  const cw = 136 * CANVAS_SCALE;
  const ch = 82 * CANVAS_SCALE;

  ctx.fillStyle = 'rgba(25, 17, 14, 0.24)';
  ctx.beginPath();
  ctx.roundRect(-cw * 0.5 + 4, -ch * 0.5 + 5, cw, ch, 10);
  ctx.fill();

  ctx.fillStyle = '#f8eedc';
  ctx.strokeStyle = '#19110e';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.roundRect(-cw * 0.5, -ch * 0.5, cw, ch, 9);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fffdf8';
  ctx.beginPath();
  ctx.roundRect(-cw * 0.45, -ch * 0.42, cw * 0.9, ch * 0.36, 6);
  ctx.fill();

  ctx.strokeStyle = '#1d889b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-cw * 0.42, -ch * 0.26);
  ctx.lineTo(cw * 0.42, -ch * 0.26);
  ctx.stroke();

  ctx.strokeStyle = '#ef0574';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-cw * 0.42, ch * 0.26);
  ctx.lineTo(cw * 0.42, ch * 0.26);
  ctx.stroke();

  ctx.restore();

  const pad = Math.ceil(96 * CANVAS_SCALE);
  return {
    x: Math.max(0, Math.floor(minX - pad)),
    y: Math.max(0, Math.floor(minY - pad)),
    w: Math.ceil(maxX - minX + pad * 2),
    h: Math.ceil(maxY - minY + pad * 2),
  };
}

interface Props {
  splashes: InkSplashRecord[];
  reducedMotion: boolean;
  wipeTrigger?: number;
  onWipeComplete?: () => void;
}

export const InkSplatterCanvas: React.FC<Props> = ({
  splashes,
  reducedMotion,
  wipeTrigger = 0,
  onWipeComplete,
}) => {
  const bakedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const tintedSheetsRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const activeAnimsRef = useRef<Map<string, ActiveSplashAnimation>>(new Map());
  const bakedAnimsRef = useRef<ActiveSplashAnimation[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const prevDirtyBoxesRef = useRef<DirtyBox[]>([]);
  const wakeLoopRef = useRef<(() => void) | null>(null);

  const isWipingRef = useRef<boolean>(false);
  const wipeProgressRef = useRef<number>(0);
  const wipeTrailRef = useRef<WipeTrailNode[]>([]);
  const prevClothPtRef = useRef<{ x: number; y: number } | null>(null);
  const onWipeCompleteRef = useRef<(() => void) | undefined>(onWipeComplete);
  onWipeCompleteRef.current = onWipeComplete;

  useEffect(() => {
    const bakedCanvas = bakedCanvasRef.current;
    const activeCanvas = activeCanvasRef.current;
    if (!bakedCanvas || !activeCanvas) return;

    let rafId = 0;
    let isRunning = false;

    const rebakeAllCompleted = () => {
      const bCtx = bakedCanvas.getContext('2d');
      if (!bCtx) return;
      bCtx.clearRect(0, 0, bakedCanvas.width, bakedCanvas.height);
      for (const completed of bakedAnimsRef.current) {
        drawVideoSplashOnContext(
          bCtx,
          completed,
          tintedSheetsRef.current,
          spriteImageRef.current,
          bakedCanvas.width,
          bakedCanvas.height
        );
      }
    };

    const img = new Image();
    img.src = '/assets/ink/ink-drop-spritesheet.png?v=3';
    img.onload = () => {
      spriteImageRef.current = img;
      // Reset any active splash timers that waited for image load so they play full 2s animation
      const now = performance.now();
      activeAnimsRef.current.forEach((anim) => {
        anim.startedAtMs = now;
      });
      rebakeAllCompleted();
      wakeLoopRef.current?.();
    };

    const updateSize = () => {
      const parent = bakedCanvas.parentElement;
      if (!parent) return;
      const w = Math.max(1, Math.floor(parent.clientWidth * CANVAS_SCALE));
      const h = Math.max(
        1,
        Math.floor(Math.max(parent.scrollHeight, parent.clientHeight) * CANVAS_SCALE)
      );
      if (bakedCanvas.width !== w || bakedCanvas.height !== h) {
        bakedCanvas.width = w;
        bakedCanvas.height = h;
        activeCanvas.width = w;
        activeCanvas.height = h;
        rebakeAllCompleted();
      }
    };

    const renderFrame = (nowMs: number) => {
      const aCtx = activeCanvas.getContext('2d');
      const bCtx = bakedCanvas.getContext('2d');

      if (aCtx && bCtx) {
        const w = activeCanvas.width;
        const h = activeCanvas.height;

        // 1. Clear ONLY the previous frame's dirty rectangles on activeCanvas (60x faster than full-canvas clear!)
        for (const box of prevDirtyBoxesRef.current) {
          aCtx.clearRect(box.x, box.y, box.w, box.h);
        }
        prevDirtyBoxesRef.current = [];

        if (!isWipingRef.current) {
          if (spriteImageRef.current) {
            activeAnimsRef.current.forEach((anim, id) => {
              const elapsed = Math.max(0, nowMs - anim.startedAtMs);
              anim.progress = Math.min(1, elapsed / ANIM_DURATION_MS);

              if (anim.progress >= 1) {
                drawVideoSplashOnContext(
                  bCtx,
                  anim,
                  tintedSheetsRef.current,
                  spriteImageRef.current,
                  w,
                  h
                );
                bakedAnimsRef.current.push(anim);
                activeAnimsRef.current.delete(id);
              } else {
                const box = drawVideoSplashOnContext(
                  aCtx,
                  anim,
                  tintedSheetsRef.current,
                  spriteImageRef.current,
                  w,
                  h
                );
                if (box) prevDirtyBoxesRef.current.push(box);
              }
            });
          }
        } else {
          if (activeAnimsRef.current.size > 0) {
            activeAnimsRef.current.forEach((anim) => {
              anim.progress = 1;
              drawVideoSplashOnContext(
                bCtx,
                anim,
                tintedSheetsRef.current,
                spriteImageRef.current,
                w,
                h
              );
            });
            activeAnimsRef.current.clear();
          }

          const prevU = wipeProgressRef.current;
          const nextU = Math.min(1, prevU + 0.032);
          wipeProgressRef.current = nextU;

          const viewportEl = document.querySelector('.llewxam-universe-viewport');
          const scrollTop = (viewportEl ? viewportEl.scrollTop : window.scrollY) * CANVAS_SCALE;
          const viewH = (window.innerHeight || 800) * CANVAS_SCALE;

          const pt = getClothWipePoint(nextU);
          const currX = pt.nx * w;
          const currY = scrollTop + pt.ny * viewH;
          const prevPt = prevClothPtRef.current ?? { x: currX, y: currY };
          prevClothPtRef.current = { x: currX, y: currY };

          // Ultra-fast hardware clearRect swatches along the cloth path (zero blend/stroke overhead!)
          const swatchW = w * 0.44;
          const swatchH = viewH * 0.34;
          for (let s = 0; s <= 3; s++) {
            const t = s / 3;
            const sx = prevPt.x + (currX - prevPt.x) * t;
            const sy = prevPt.y + (currY - prevPt.y) * t;
            bCtx.clearRect(sx - swatchW * 0.5, sy - swatchH * 0.5, swatchW, swatchH);
          }

          // Progressive full-width clear behind the cloth sweep
          const clearTopY = Math.floor(scrollTop + Math.max(0, (nextU - 0.16) * viewH));
          if (clearTopY > 0) {
            bCtx.clearRect(0, 0, w, clearTopY);
          }
          if (nextU > 0.25) {
            const bottomStart = Math.floor(scrollTop + viewH);
            if (bottomStart < h) {
              bCtx.clearRect(0, bottomStart, w, h - bottomStart);
            }
          }

          wipeTrailRef.current.push({
            x: currX,
            y: currY,
            angle: pt.angle,
          });
          if (wipeTrailRef.current.length > 6) {
            wipeTrailRef.current.shift();
          }

          const clothBox = drawAtelierClothWipeOverlay(
            aCtx,
            wipeTrailRef.current,
            currX,
            currY,
            pt.angle
          );
          prevDirtyBoxesRef.current.push(clothBox);

          if (nextU >= 1) {
            isWipingRef.current = false;
            wipeProgressRef.current = 0;
            wipeTrailRef.current = [];
            prevClothPtRef.current = null;
            bCtx.clearRect(0, 0, w, h);
            aCtx.clearRect(0, 0, w, h);
            prevDirtyBoxesRef.current = [];
            bakedAnimsRef.current = [];
            seenIdsRef.current.clear();
            onWipeCompleteRef.current?.();
          }
        }
      }

      if (activeAnimsRef.current.size > 0 || isWipingRef.current) {
        rafId = requestAnimationFrame(renderFrame);
      } else {
        isRunning = false;
        rafId = 0;
      }
    };

    const wakeLoop = () => {
      if (!isRunning && (activeAnimsRef.current.size > 0 || isWipingRef.current)) {
        isRunning = true;
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    wakeLoopRef.current = wakeLoop;
    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      isRunning = false;
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  useEffect(() => {
    if (wipeTrigger <= 0) return;

    if (reducedMotion) {
      activeAnimsRef.current.clear();
      bakedAnimsRef.current = [];
      seenIdsRef.current.clear();
      prevDirtyBoxesRef.current = [];
      const bakedCanvas = bakedCanvasRef.current;
      const activeCanvas = activeCanvasRef.current;
      bakedCanvas?.getContext('2d')?.clearRect(0, 0, bakedCanvas.width, bakedCanvas.height);
      activeCanvas?.getContext('2d')?.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      onWipeCompleteRef.current?.();
      return;
    }

    isWipingRef.current = true;
    wipeProgressRef.current = 0;
    wipeTrailRef.current = [];
    prevClothPtRef.current = null;
    wakeLoopRef.current?.();
  }, [wipeTrigger, reducedMotion]);

  useEffect(() => {
    const bakedCanvas = bakedCanvasRef.current;
    const activeCanvas = activeCanvasRef.current;

    if (splashes.length === 0 && !isWipingRef.current) {
      activeAnimsRef.current.clear();
      bakedAnimsRef.current = [];
      seenIdsRef.current.clear();
      prevDirtyBoxesRef.current = [];
      bakedCanvas?.getContext('2d')?.clearRect(0, 0, bakedCanvas.width, bakedCanvas.height);
      activeCanvas?.getContext('2d')?.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
      return;
    }

    // Ensure canvas dimensions match current scrollHeight before drawing
    if (bakedCanvas && activeCanvas && bakedCanvas.parentElement) {
      const parent = bakedCanvas.parentElement;
      const w = Math.max(1, Math.floor(parent.clientWidth * CANVAS_SCALE));
      const h = Math.max(
        1,
        Math.floor(Math.max(parent.scrollHeight, parent.clientHeight) * CANVAS_SCALE)
      );
      if (bakedCanvas.width !== w || bakedCanvas.height !== h) {
        bakedCanvas.width = w;
        bakedCanvas.height = h;
        activeCanvas.width = w;
        activeCanvas.height = h;
        const bCtx = bakedCanvas.getContext('2d');
        if (bCtx) {
          for (const completed of bakedAnimsRef.current) {
            drawVideoSplashOnContext(
              bCtx,
              completed,
              tintedSheetsRef.current,
              spriteImageRef.current,
              w,
              h
            );
          }
        }
      }
    }

    for (const splash of splashes) {
      if (!seenIdsRef.current.has(splash.id)) {
        seenIdsRef.current.add(splash.id);
        const anim = buildSplashAnimation(splash);
        const ageMs = Date.now() - splash.createdAt;

        if (reducedMotion || ageMs > ANIM_DURATION_MS) {
          anim.progress = 1;
          bakedAnimsRef.current.push(anim);
          if (bakedCanvas && bakedCanvas.width > 0) {
            const bCtx = bakedCanvas.getContext('2d');
            if (bCtx) {
              drawVideoSplashOnContext(
                bCtx,
                anim,
                tintedSheetsRef.current,
                spriteImageRef.current,
                bakedCanvas.width,
                bakedCanvas.height
              );
            }
          }
        } else {
          activeAnimsRef.current.set(splash.id, anim);
        }
      }
    }

    if (activeAnimsRef.current.size > 0) {
      wakeLoopRef.current?.();
    }
  }, [splashes, reducedMotion]);

  const sharedCanvasStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 2,
  };

  return (
    <>
      <canvas ref={bakedCanvasRef} aria-hidden="true" style={sharedCanvasStyle} />
      <canvas ref={activeCanvasRef} aria-hidden="true" style={sharedCanvasStyle} />
    </>
  );
};
