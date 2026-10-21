import React, { useEffect, useRef, useState } from 'react';
import { CITY_FRAGMENT_SHADER, CITY_VERTEX_SHADER } from '../../shaders/citySceneShaders';
import { experienceStore, ExperienceStoreState } from '../../state/experienceStore';

interface BirdAgent {
  id: number;
  p0: [number, number];
  p1: [number, number];
  p2: [number, number];
  p3: [number, number];
  duration: number;
  delay: number;
  flapSpeed: number;
  flapPhase: number;
  scale: number;
  depthChannel: 'R' | 'G' | 'B'; // R=Atrás de todos os prédios, G=Atrás das torres médias/frontais, B=Atrás dos prédios frontais e do OC
}

// Trajetórias calibradas para cruzar por trás das torres vermelhas da esquerda, do centro e da direita
const DETERMINISTIC_BIRDS: BirdAgent[] = [
  {
    id: 1,
    p0: [-0.04, 0.34],
    p1: [0.22, 0.22],
    p2: [0.55, 0.28],
    p3: [0.98, 0.16],
    duration: 18.0,
    delay: 0.0,
    flapSpeed: 6.4,
    flapPhase: 0.3,
    scale: 1.0,
    depthChannel: 'G',
  },
  {
    id: 2,
    p0: [-0.06, 0.38],
    p1: [0.20, 0.26],
    p2: [0.52, 0.31],
    p3: [0.96, 0.20],
    duration: 19.5,
    delay: 1.4,
    flapSpeed: 5.9,
    flapPhase: 1.9,
    scale: 0.85,
    depthChannel: 'G',
  },
  {
    id: 3,
    p0: [1.04, 0.29],
    p1: [0.74, 0.19],
    p2: [0.42, 0.25],
    p3: [-0.05, 0.15],
    duration: 21.0,
    delay: 3.2,
    flapSpeed: 5.3,
    flapPhase: 1.1,
    scale: 0.78,
    depthChannel: 'R',
  },
  {
    id: 4,
    p0: [0.02, 0.46],
    p1: [0.32, 0.36],
    p2: [0.64, 0.28],
    p3: [1.02, 0.22],
    duration: 17.5,
    delay: 5.5,
    flapSpeed: 6.8,
    flapPhase: 3.4,
    scale: 1.12,
    depthChannel: 'B',
  },
  {
    id: 5,
    p0: [0.98, 0.42],
    p1: [0.68, 0.35],
    p2: [0.38, 0.39],
    p3: [-0.04, 0.28],
    duration: 22.0,
    delay: 8.0,
    flapSpeed: 5.6,
    flapPhase: 4.5,
    scale: 0.72,
    depthChannel: 'R',
  },
  {
    id: 6,
    p0: [-0.05, 0.25],
    p1: [0.30, 0.16],
    p2: [0.62, 0.22],
    p3: [1.03, 0.12],
    duration: 20.0,
    delay: 11.2,
    flapSpeed: 6.1,
    flapPhase: 2.7,
    scale: 0.92,
    depthChannel: 'G',
  },
];

function cubicBezier(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0];
  const y = uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1];

  const dx =
    3 * uu * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * tt * (p3[0] - p2[0]);
  const dy =
    3 * uu * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * tt * (p3[1] - p2[1]);
  const angle = Math.atan2(dy, dx);

  return [x, y, angle];
}

// Converte clique na tela para o espaço 16:9 unificado da cidade (mesma matemática do shader)
function screenToUnifiedCanvasUV(
  screenX: number,
  screenY: number,
  zoomOut: number,
  screenAspect: number
): [number, number] {
  const targetAspect = 1376.0 / 768.0;
  let coverScaleX = 1.0;
  let coverScaleY = 1.0;
  if (screenAspect > targetAspect) {
    coverScaleY = targetAspect / screenAspect;
  } else {
    coverScaleX = screenAspect / targetAspect;
  }

  const fittedX = (screenX - 0.5) * coverScaleX * 0.90 + 0.5;
  const fittedY = (screenY - 0.5) * coverScaleY * 0.90 + 0.5;

  const t = Math.max(0, Math.min(1, zoomOut));
  const smoothZ = t * t * (3 - 2 * t);
  const camScale = 2.08 + (1.0 - 2.08) * smoothZ;
  const camFocusX = 0.27 + (0.5 - 0.27) * smoothZ;
  const camFocusY = 0.32 + (0.5 - 0.32) * smoothZ;

  const u = (fittedX - 0.5) / camScale + camFocusX;
  const v = (fittedY - 0.5) / camScale + camFocusY;
  return [u, v];
}

interface Props {
  storeState: ExperienceStoreState;
}

export const CityCanvasScene: React.FC<Props> = ({ storeState }) => {
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  const [isHoveringCharacter, setIsHoveringCharacter] = useState<boolean>(false);
  const [wrongScrollHint, setWrongScrollHint] = useState<boolean>(false);

  const targetZoomRef = useRef<number>(storeState.shaderParams.cameraZoomOut);
  const currentZoomRef = useRef<number>(storeState.shaderParams.cameraZoomOut);
  const pointerTargetRef = useRef<[number, number]>([0, 0]);
  const pointerCurrentRef = useRef<[number, number]>([0, 0]);
  const touchStartYRef = useRef<number | null>(null);
  const sequenceStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (Math.abs(storeState.shaderParams.cameraZoomOut - currentZoomRef.current) > 0.08) {
      targetZoomRef.current = storeState.shaderParams.cameraZoomOut;
    }
  }, [storeState.shaderParams.cameraZoomOut]);

  useEffect(() => {
    if (storeState.phase === 'VISOR_ACTIVATION') {
      sequenceStartTimeRef.current = performance.now();
    } else if (
      storeState.phase === 'CITY_INTRO' ||
      storeState.phase === 'CITY_REVEAL' ||
      storeState.phase === 'CHARACTER_REVEALED'
    ) {
      sequenceStartTimeRef.current = null;
    }
  }, [storeState.phase]);

  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    if (!glCanvas) return;

    const gl =
      glCanvas.getContext('webgl', { alpha: false, antialias: true, powerPreference: 'high-performance' }) ||
      (glCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      setWebglReady(false);
      setAssetsLoaded(true);
      return;
    }

    const compileShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, CITY_VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, CITY_FRAGMENT_SHADER);
    if (!vs || !fs) {
      setWebglReady(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      setWebglReady(false);
      return;
    }

    gl.useProgram(program);

    const quadVerts = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      skyBackplateTex: gl.getUniformLocation(program, 'u_skyBackplateTex'),
      farCityTex: gl.getUniformLocation(program, 'u_farCityTex'),
      midCityTex: gl.getUniformLocation(program, 'u_midCityTex'),
      fgCityTex: gl.getUniformLocation(program, 'u_fgCityTex'),
      ocCutoutTex: gl.getUniformLocation(program, 'u_ocCutoutTex'),
      ocMaskTex: gl.getUniformLocation(program, 'u_ocMaskTex'),
      birdsTex: gl.getUniformLocation(program, 'u_birdsTex'),
      windowsSignalTex: gl.getUniformLocation(program, 'u_windowsSignalTex'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      zoomOut: gl.getUniformLocation(program, 'u_zoomOut'),
      pointerOffset: gl.getUniformLocation(program, 'u_pointerOffset'),
      parallaxStrength: gl.getUniformLocation(program, 'u_parallaxStrength'),
      visorIntensity: gl.getUniformLocation(program, 'u_visorIntensity'),
      waterDistortion: gl.getUniformLocation(program, 'u_waterDistortion'),
      interfaceEmergence: gl.getUniformLocation(program, 'u_interfaceEmergence'),
    };

    const textures: WebGLTexture[] = [];
    const loadTexture = (url: string, unit: number, useNearest = false): Promise<void> => {
      return new Promise((resolve) => {
        const tex = gl.createTexture();
        if (tex) textures.push(tex);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          1,
          1,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          new Uint8Array([0, 0, 0, 0])
        );

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          const filter = useNearest ? gl.NEAREST : gl.LINEAR;
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = url;
      });
    };

    // Textura dinâmica enxuta para os pássaros entre as camadas de prédios (Unit 6 - 512x288 com texSubImage2D)
    const birdBufferCanvas = document.createElement('canvas');
    birdBufferCanvas.width = 512;
    birdBufferCanvas.height = 288;
    const birdCtx = birdBufferCanvas.getContext('2d');

    const birdsGlTex = gl.createTexture();
    if (birdsGlTex) textures.push(birdsGlTex);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, birdsGlTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, birdBufferCanvas);

    let isDisposed = false;
    Promise.all([
      loadTexture('/assets/layers/city-sky-inpainted.png?v=5', 0),
      loadTexture('/assets/layers/city-far-metropolis.png?v=5', 1),
      loadTexture('/assets/layers/city-mid-towers.png?v=5', 2),
      loadTexture('/assets/layers/city-fg-rooftops.png?v=5', 3),
      loadTexture('/assets/layers/oc-character-clean.png?v=5', 4),
      loadTexture('/assets/masks/oc-visor-scarf-mask.png?v=5', 5),
      loadTexture('/assets/masks/city-windows-signal.png?v=5', 7, true),
    ]).then(() => {
      if (!isDisposed) setAssetsLoaded(true);
    });

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (glCanvas.width !== w || glCanvas.height !== h) {
        glCanvas.width = w;
        glCanvas.height = h;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let frameCount = 0;
    let lastNotifiedZoomPct = Math.round(currentZoomRef.current * 100);
    const startTime = performance.now();

    const initialParams = experienceStore.getState().shaderParams;
    let liveVisor = initialParams.visorIntensity;
    let liveWater = initialParams.waterDistortion;
    let liveEmergence = initialParams.interfaceEmergence;

    let isLoopActive = true;

    const renderLoop = (now: number) => {
      if (isDisposed) return;
      const state = experienceStore.getState();

      if (state.activeSpace !== 'CITY') {
        isLoopActive = false;
        rafId = 0;
        return;
      }

      frameCount++;
      const elapsedSec = (now - startTime) * 0.001;
      const reduced = state.shaderParams.reducedMotion;

      const zoomDiff = targetZoomRef.current - currentZoomRef.current;
      if (Math.abs(zoomDiff) > 0.0005) {
        currentZoomRef.current += zoomDiff * (reduced ? 0.25 : 0.085);
        const currentPct = Math.round(currentZoomRef.current * 100);
        if (currentPct !== lastNotifiedZoomPct || Math.abs(zoomDiff) < 0.003) {
          lastNotifiedZoomPct = currentPct;
          experienceStore.updateCameraZoomOut(currentZoomRef.current);
        }
      } else {
        currentZoomRef.current = targetZoomRef.current;
      }

      pointerCurrentRef.current[0] +=
        (pointerTargetRef.current[0] - pointerCurrentRef.current[0]) * 0.07;
      pointerCurrentRef.current[1] +=
        (pointerTargetRef.current[1] - pointerCurrentRef.current[1]) * 0.07;

      if (sequenceStartTimeRef.current !== null) {
        const seqElapsed = (now - sequenceStartTimeRef.current) * 0.001;
        const speedFactor = reduced ? 2.0 : 1.0;
        const tSeq = seqElapsed * speedFactor;

        // 0.0s -> 0.65s: Visor e projetor "LLEW" acendem nítidos no prédio
        // 0.90s -> 2.10s: Onda de refração aquática pulsa e ZERA completamente (0.0) ao terminar!
        // 1.85s -> 2.45s: Interface emergente surge com 0% de peso residual de água
        liveVisor = Math.min(1.0, tSeq / 0.65);
        const waterPhase = Math.max(0.0, Math.min(1.0, (tSeq - 0.90) / 1.20));
        const waterPulse =
          waterPhase > 0.0 && waterPhase < 1.0
            ? Math.sin(waterPhase * Math.PI) * 0.82
            : 0.0;
        liveWater = reduced ? waterPulse * 0.35 : waterPulse;
        liveEmergence = Math.max(0.0, Math.min(1.0, (tSeq - 1.85) / 0.60));

        if (tSeq >= 0.90 && tSeq < 1.95 && state.phase !== 'WATER_DISTORTION') {
          experienceStore.setPhaseDirect('WATER_DISTORTION');
        } else if (tSeq >= 1.95 && state.phase !== 'INTERFACE_EMERGENCE') {
          experienceStore.setPhaseDirect('INTERFACE_EMERGENCE');
          experienceStore.setShaderParams({
            visorIntensity: 1.0,
            waterDistortion: 0.0,
            interfaceEmergence: 1.0,
          });
          experienceStore.unlockTransition();
        }

        if (tSeq >= 2.48) {
          liveVisor = 1.0;
          liveWater = 0.0;
          liveEmergence = 1.0;
          sequenceStartTimeRef.current = null;
        }
      } else {
        liveVisor = state.shaderParams.visorIntensity;
        liveWater = state.shaderParams.waterDistortion;
        liveEmergence = state.shaderParams.interfaceEmergence;
      }

      const activeParams = state.shaderParams;

      // Atualiza o buffer dos pássaros a 30fps com texSubImage2D (512x288 = 8x mais leve)
      if (birdCtx && frameCount % 2 === 1) {
        const bw = birdBufferCanvas.width;
        const bh = birdBufferCanvas.height;
        birdCtx.clearRect(0, 0, bw, bh);
        birdCtx.globalCompositeOperation = 'lighter';

        for (const bird of DETERMINISTIC_BIRDS) {
          const rawT =
            ((elapsedSec * activeParams.birdSpeedMultiplier + bird.delay) %
              bird.duration) /
            bird.duration;

          const [wx, wy, angle] = cubicBezier(
            rawT,
            bird.p0,
            bird.p1,
            bird.p2,
            bird.p3
          );

          const px = wx * bw;
          const py = wy * bh;
          const size = bird.scale * 4.8;
          const wingFlap = Math.sin(
            elapsedSec * bird.flapSpeed * activeParams.birdSpeedMultiplier +
              bird.flapPhase
          );

          const channelColor =
            bird.depthChannel === 'R'
              ? '#ff0000'
              : bird.depthChannel === 'G'
                ? '#00ff00'
                : '#0000ff';

          birdCtx.save();
          birdCtx.translate(px, py);
          birdCtx.rotate(angle * 0.35);
          birdCtx.strokeStyle = channelColor;
          birdCtx.fillStyle = channelColor;
          birdCtx.lineWidth = Math.max(1.2, size * 0.24);
          birdCtx.lineCap = 'round';
          birdCtx.lineJoin = 'round';

          birdCtx.beginPath();
          birdCtx.moveTo(-size * 1.35, -wingFlap * size * 0.75);
          birdCtx.quadraticCurveTo(-size * 0.5, -size * 0.45, 0, 0);
          birdCtx.quadraticCurveTo(
            size * 0.5,
            -size * 0.45,
            size * 1.35,
            -wingFlap * size * 0.75
          );
          birdCtx.stroke();

          birdCtx.beginPath();
          birdCtx.ellipse(0, 0, size * 0.32, size * 0.15, 0, 0, Math.PI * 2);
          birdCtx.fill();
          birdCtx.restore();
        }

        gl.activeTexture(gl.TEXTURE6);
        gl.bindTexture(gl.TEXTURE_2D, birdsGlTex);
        gl.texSubImage2D(
          gl.TEXTURE_2D,
          0,
          0,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          birdBufferCanvas
        );
      }

      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      gl.useProgram(program);

      gl.uniform1i(uniforms.skyBackplateTex, 0);
      gl.uniform1i(uniforms.farCityTex, 1);
      gl.uniform1i(uniforms.midCityTex, 2);
      gl.uniform1i(uniforms.fgCityTex, 3);
      gl.uniform1i(uniforms.ocCutoutTex, 4);
      gl.uniform1i(uniforms.ocMaskTex, 5);
      gl.uniform1i(uniforms.birdsTex, 6);
      gl.uniform1i(uniforms.windowsSignalTex, 7);
      gl.uniform2f(uniforms.resolution, glCanvas.width, glCanvas.height);
      gl.uniform1f(uniforms.time, reduced ? elapsedSec * 0.25 : elapsedSec);
      gl.uniform1f(uniforms.zoomOut, currentZoomRef.current);
      gl.uniform2f(
        uniforms.pointerOffset,
        pointerCurrentRef.current[0],
        pointerCurrentRef.current[1]
      );
      gl.uniform1f(uniforms.parallaxStrength, activeParams.parallaxStrength);
      gl.uniform1f(uniforms.visorIntensity, liveVisor);
      gl.uniform1f(uniforms.waterDistortion, liveWater);
      gl.uniform1f(uniforms.interfaceEmergence, liveEmergence);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafId = requestAnimationFrame(renderLoop);
    };

    const unsubSpaceWake = experienceStore.subscribe((next) => {
      if (next.activeSpace === 'CITY' && !isLoopActive && !isDisposed) {
        isLoopActive = true;
        rafId = requestAnimationFrame(renderLoop);
      }
    });

    rafId = requestAnimationFrame(renderLoop);

    return () => {
      isDisposed = true;
      unsubSpaceWake();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      for (const tex of textures) {
        gl.deleteTexture(tex);
      }
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      const state = experienceStore.getState();
      if (state.activeSpace !== 'CITY') return;
      if (
        state.phase === 'VISOR_ACTIVATION' ||
        state.phase === 'WATER_DISTORTION'
      ) {
        return;
      }

      e.preventDefault();

      if (e.deltaY < 0) {
        setWrongScrollHint(false);
        const step = Math.min(0.18, Math.abs(e.deltaY) * 0.0014);
        targetZoomRef.current = Math.min(1, targetZoomRef.current + step);
      } else if (e.deltaY > 0) {
        if (targetZoomRef.current <= 0.03) {
          setWrongScrollHint(true);
        } else if (!state.cityTransitionCompletedOnce) {
          const step = Math.min(0.14, Math.abs(e.deltaY) * 0.0011);
          targetZoomRef.current = Math.max(0, targetZoomRef.current - step);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = experienceStore.getState();
      if (state.activeSpace !== 'CITY') return;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'PageUp') {
        e.preventDefault();
        targetZoomRef.current = Math.min(1, targetZoomRef.current + 0.18);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (!state.cityTransitionCompletedOnce) {
          targetZoomRef.current = Math.max(0, targetZoomRef.current - 0.14);
        }
      } else if (
        (e.key === 'Enter' || e.key === ' ') &&
        currentZoomRef.current >= 0.85 &&
        state.phase === 'CHARACTER_REVEALED'
      ) {
        e.preventDefault();
        experienceStore.triggerVisorSequence();
      } else if (e.key === 'ArrowRight' && state.phase === 'INTERFACE_EMERGENCE') {
        e.preventDefault();
        experienceStore.navigateToSpace('CARTOLINA_PROJECTS');
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Verifica se o ponteiro está sobre o OC no espaço unificado 1376x768
  const checkIsPointerOnCharacter = (clientX: number, clientY: number): boolean => {
    if (currentZoomRef.current < 0.72) return false;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const sx = clientX / w;
    const sy = clientY / h;
    const [u, v] = screenToUnifiedCanvasUV(sx, sy, currentZoomRef.current, w / h);

    // Coordenadas reais do OC na tela unificada 1376x768 (x: 0.36..0.66, y: 0.12..0.88)
    return u >= 0.36 && u <= 0.66 && v >= 0.12 && v <= 0.88;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (e.clientX / w) * 2 - 1;
    const ny = (e.clientY / h) * 2 - 1;
    pointerTargetRef.current = [nx, ny];

    if (touchStartYRef.current !== null) {
      const deltaY = e.clientY - touchStartYRef.current;
      if (Math.abs(deltaY) > 6) {
        targetZoomRef.current = Math.max(
          0,
          Math.min(1, targetZoomRef.current + 0.025)
        );
        touchStartYRef.current = e.clientY;
      }
    }

    setIsHoveringCharacter(checkIsPointerOnCharacter(e.clientX, e.clientY));
  };

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const state = experienceStore.getState();
    if (state.phase === 'INTERFACE_EMERGENCE') return;

    if (checkIsPointerOnCharacter(e.clientX, e.clientY)) {
      experienceStore.triggerVisorSequence();
    }
  };

  const zoomPercent = Math.round(storeState.shaderParams.cameraZoomOut * 100);
  const isCharacterVisible = storeState.shaderParams.cameraZoomOut >= 0.82;
  const isEmergenceReady =
    storeState.phase === 'INTERFACE_EMERGENCE' ||
    storeState.shaderParams.interfaceEmergence >= 0.75;

  return (
    <section
      ref={containerRef}
      aria-label="Initial Scene: LLEW — Bot Engineering, Automations & Web"
      className={`city-scene-root ${isHoveringCharacter && isCharacterVisible && !isEmergenceReady ? 'cursor-visor-target' : ''}`}
      onPointerMove={handlePointerMove}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') {
          touchStartYRef.current = e.clientY;
        }
      }}
      onPointerUp={() => {
        touchStartYRef.current = null;
      }}
      onClick={handleSceneClick}
    >
      <canvas ref={glCanvasRef} className="city-webgl-canvas" />

      {!webglReady && (
        <div
          className="city-fallback-layer"
          style={{
            backgroundImage: `url('/assets/reference/oc-city-full.jpg')`,
            transform: `scale(${2.1 - storeState.shaderParams.cameraZoomOut * 1.1})`,
          }}
        />
      )}

      {storeState.shaderParams.cameraZoomOut < 0.85 &&
        storeState.phase !== 'VISOR_ACTIVATION' &&
        storeState.phase !== 'WATER_DISTORTION' &&
        storeState.phase !== 'INTERFACE_EMERGENCE' && (
          <div
            className={`painted-camera-cue ${wrongScrollHint ? 'cue-pulse-alert' : ''}`}
            role="region"
            aria-label="Camera control"
          >
            <div className="cue-brush-stroke">
              <span className="cue-ink-icon" aria-hidden="true">
                ↑
              </span>
              <span className="cue-text">
                {wrongScrollHint
                  ? 'Scroll UP (↑) on your mouse wheel to pull back the camera'
                  : 'Scroll UP (↑) to pull back the camera'}
              </span>
              <span className="cue-progress">{zoomPercent}%</span>
            </div>

            <button
              type="button"
              className="cue-accessible-btn"
              onClick={(e) => {
                e.stopPropagation();
                targetZoomRef.current = 1.0;
              }}
            >
              Reveal Character
            </button>
          </div>
        )}

      {isCharacterVisible &&
        storeState.phase === 'CHARACTER_REVEALED' &&
        storeState.shaderParams.visorIntensity < 0.1 && (
          <div className="character-ledge-prompt">
            <button
              type="button"
              className="visor-trigger-hotspot"
              onClick={(e) => {
                e.stopPropagation();
                experienceStore.triggerVisorSequence();
              }}
              aria-label="Click character to activate visor and enter portfolio"
            >
              <span className="visor-hotspot-ring" />
              <span className="visor-hotspot-label">
                Click character · Activate Visor
              </span>
            </button>
          </div>
        )}

      {isEmergenceReady && (
        <div className="emergent-painted-interface" role="region" aria-label="Evandro Silva Amorim - LLEW Introduction">
          <div className="emergent-pigment-panel">
            <p className="emergent-kicker">EVANDRO SILVA AMORIM · FULL-STACK & BOT ENGINEER</p>
            <h1 className="emergent-title">
              LLEW <span className="emergent-subtitle-inline">@LlewxamDev</span>
            </h1>
            <p className="emergent-manifesto">
              Developer of high-performance ecosystems for <strong>Discord</strong> and{' '}
              <strong>WhatsApp</strong> — creator of <strong>LWX Lab</strong> (sales & workflow automation for the LWX design server),{' '}
              <strong>mmrpdis</strong> (full-scale MMORPG with guilds, boss raids, and weapon crafting), and{' '}
              <strong>Soul List</strong> (<strong>1,400+ command</strong> WhatsApp bot powered by Baileys), engineered with{' '}
              <strong>JavaScript/TypeScript</strong>, <strong>Python</strong>, and <strong>Rust</strong>.
            </p>

            <div className="emergent-actions-row">
              <button
                type="button"
                className="lateral-cartolina-gateway"
                onClick={(e) => {
                  e.stopPropagation();
                  experienceStore.navigateToSpace('CARTOLINA_PROJECTS');
                }}
              >
                <span className="gateway-content">
                  <span className="gateway-direction">ENGINEERING PORTFOLIO</span>
                  <span className="gateway-main-label">
                    Explore Projects & Demos →
                  </span>
                </span>
              </button>

              <button
                type="button"
                className="lateral-secondary-gateway"
                onClick={(e) => {
                  e.stopPropagation();
                  experienceStore.navigateToSpace('CARTOLINA_ABOUT');
                }}
              >
                About Me, Stack & Services →
              </button>
            </div>
          </div>
        </div>
      )}

      {!assetsLoaded && (
        <div className="painted-loading-veil" aria-live="polite">
          <span>Loading LLEW Portfolio...</span>
        </div>
      )}
    </section>
  );
};
