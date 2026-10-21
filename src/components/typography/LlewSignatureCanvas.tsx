import React, { useEffect, useRef } from 'react';
import { experienceStore, ExperienceStoreState } from '../../state/experienceStore';

interface StrokeSegment {
  points: [number, number][];
  startWindow: number;
  endWindow: number;
  baseWidth: number;
  color: string;
}

const LLEW_CALLIGRAPHY_STROKES: StrokeSegment[] = [
  {
    points: [
      [150, 0],
      [148, 36],
      [145, 74],
    ],
    startWindow: 0.0,
    endWindow: 0.16,
    baseWidth: 4.5,
    color: '#3a0711',
  },
  {
    points: [
      [295, 0],
      [292, 40],
      [290, 74],
    ],
    startWindow: 0.05,
    endWindow: 0.22,
    baseWidth: 4.0,
    color: '#bc2035',
  },
  {
    points: [
      [435, 0],
      [437, 38],
      [434, 72],
    ],
    startWindow: 0.1,
    endWindow: 0.26,
    baseWidth: 4.2,
    color: '#1d889b',
  },
  {
    points: [
      [605, 0],
      [602, 35],
      [598, 70],
    ],
    startWindow: 0.14,
    endWindow: 0.3,
    baseWidth: 4.5,
    color: '#ef0574',
  },
  {
    points: [
      [145, 65],
      [140, 118],
      [136, 174],
      [195, 170],
      [226, 165],
    ],
    startWindow: 0.16,
    endWindow: 0.42,
    baseWidth: 13.5,
    color: '#1e0910',
  },
  {
    points: [
      [148, 70],
      [143, 125],
      [140, 170],
      [216, 166],
    ],
    startWindow: 0.22,
    endWindow: 0.46,
    baseWidth: 6.5,
    color: '#ef0574',
  },
  {
    points: [
      [290, 62],
      [284, 118],
      [280, 172],
      [340, 169],
      [372, 163],
    ],
    startWindow: 0.34,
    endWindow: 0.58,
    baseWidth: 13.0,
    color: '#1e0910',
  },
  {
    points: [
      [293, 68],
      [288, 125],
      [284, 168],
      [362, 164],
    ],
    startWindow: 0.38,
    endWindow: 0.62,
    baseWidth: 6.0,
    color: '#bc2035',
  },
  {
    points: [
      [434, 62],
      [428, 116],
      [425, 172],
    ],
    startWindow: 0.52,
    endWindow: 0.72,
    baseWidth: 13.0,
    color: '#1e0910',
  },
  {
    points: [
      [430, 66],
      [478, 62],
      [518, 58],
    ],
    startWindow: 0.6,
    endWindow: 0.76,
    baseWidth: 10.5,
    color: '#1d889b',
  },
  {
    points: [
      [428, 117],
      [472, 114],
      [506, 111],
    ],
    startWindow: 0.66,
    endWindow: 0.82,
    baseWidth: 9.8,
    color: '#ef0574',
  },
  {
    points: [
      [425, 170],
      [475, 168],
      [522, 162],
    ],
    startWindow: 0.72,
    endWindow: 0.86,
    baseWidth: 11.2,
    color: '#1e0910',
  },
  {
    points: [
      [575, 62],
      [592, 122],
      [608, 174],
      [638, 108],
      [666, 174],
      [698, 112],
      [718, 58],
    ],
    startWindow: 0.76,
    endWindow: 1.0,
    baseWidth: 13.0,
    color: '#1e0910',
  },
  {
    points: [
      [578, 66],
      [608, 170],
      [638, 112],
      [666, 170],
      [714, 62],
    ],
    startWindow: 0.82,
    endWindow: 1.0,
    baseWidth: 5.8,
    color: '#ef0574',
  },
];

const POST_FORMATION_DRIPS = [
  { x: 138, startY: 173, maxLen: 46, width: 3.6, color: '#2d090d' },
  { x: 212, startY: 167, maxLen: 28, width: 2.4, color: '#ef0574' },
  { x: 282, startY: 171, maxLen: 54, width: 3.8, color: '#1e0910' },
  { x: 426, startY: 171, maxLen: 42, width: 3.4, color: '#1d889b' },
  { x: 512, startY: 164, maxLen: 33, width: 2.8, color: '#ef0574' },
  { x: 608, startY: 173, maxLen: 58, width: 4.0, color: '#2d090d' },
  { x: 666, startY: 173, maxLen: 39, width: 3.2, color: '#bc2035' },
];

function drawSignatureFrame(
  ctx: CanvasRenderingContext2D,
  formationProg: number,
  postDripProg: number
) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of LLEW_CALLIGRAPHY_STROKES) {
    if (formationProg <= stroke.startWindow) continue;
    const localP = Math.min(
      1,
      (formationProg - stroke.startWindow) /
        Math.max(0.01, stroke.endWindow - stroke.startWindow)
    );

    const pts = stroke.points;
    const totalSegments = pts.length - 1;
    const exactSeg = localP * totalSegments;
    const fullSegs = Math.floor(exactSeg);
    const partialSeg = exactSeg - fullSegs;

    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);

    for (let i = 1; i <= fullSegs; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }

    if (fullSegs < totalSegments && partialSeg > 0) {
      const pA = pts[fullSegs];
      const pB = pts[fullSegs + 1];
      const curX = pA[0] + (pB[0] - pA[0]) * partialSeg;
      const curY = pA[1] + (pB[1] - pA[1]) * partialSeg;
      ctx.lineTo(curX, curY);
    }

    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.baseWidth;
    ctx.stroke();
  }

  if (formationProg >= 0.96 && postDripProg > 0.001) {
    const easeDrip = 1 - Math.pow(1 - Math.min(1, postDripProg), 2.6);

    for (const drip of POST_FORMATION_DRIPS) {
      const len = drip.maxLen * easeDrip;
      ctx.beginPath();
      ctx.moveTo(drip.x, drip.startY);
      ctx.lineTo(drip.x, drip.startY + len);
      ctx.strokeStyle = drip.color;
      ctx.lineWidth = drip.width;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(drip.x, drip.startY + len, drip.width * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = drip.color;
      ctx.fill();
    }
  }

  ctx.restore();
}

interface Props {
  storeState: ExperienceStoreState;
}

export const LlewSignatureCanvas: React.FC<Props> = ({ storeState }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (storeState.signatureStatus === 'COMPLETE') {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        drawSignatureFrame(ctx, 1, 1);
      }
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const current = experienceStore.getState();
            if (current.signatureStatus === 'IDLE') {
              experienceStore.startSignatureFormation();
            }
          }
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [storeState.signatureStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (storeState.signatureStatus === 'COMPLETE') {
      drawSignatureFrame(ctx, 1, 1);
      return;
    }

    if (storeState.signatureStatus !== 'FORMING') {
      drawSignatureFrame(
        ctx,
        storeState.signatureProgress,
        storeState.signaturePostDripProgress
      );
      return;
    }

    let rafId = 0;
    let formP = storeState.signatureProgress;
    let dripP = storeState.signaturePostDripProgress;
    const speedMult = storeState.shaderParams.reducedMotion ? 3.5 : 1.0;

    const step = () => {
      if (formP < 1) {
        formP = Math.min(1, formP + 0.011 * speedMult);
      } else if (dripP < 1) {
        dripP = Math.min(1, dripP + 0.016 * speedMult);
      }

      drawSignatureFrame(ctx, formP, dripP);

      if (formP >= 1 && dripP >= 1) {
        experienceStore.updateSignatureProgress(1, 1, canvas.toDataURL());
        return;
      } else {
        experienceStore.updateSignatureProgress(formP, dripP);
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [storeState.signatureStatus, storeState.shaderParams.reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="llew-signature-monument"
      aria-label="LLEW — Evandro Silva Amorim (@LlewxamDev)"
    >
      <div className="signature-drip-bridge" aria-hidden="true">
        <span className="drip-thread thread-1" />
        <span className="drip-thread thread-2" />
        <span className="drip-thread thread-3" />
        <span className="drip-thread thread-4" />
      </div>

      <canvas
        ref={canvasRef}
        width={860}
        height={250}
        className="llew-signature-canvas"
      />

      <div className="signature-status-caption">
        <span className="signature-caption-badge">
          LLEW · EVANDRO SILVA AMORIM (@LLEWXAMDEV)
        </span>
      </div>
    </div>
  );
};
