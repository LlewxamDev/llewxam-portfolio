import {
  ActiveSpace,
  ExperiencePhase,
  FlipbookState,
  InkSplashRecord,
  ShaderParameters,
  SignatureStatus,
} from '../types/experience';

export interface ExperienceStoreState {
  // 1. Estado global da experiência
  phase: ExperiencePhase;
  // 2. Estado de navegação entre espaços
  activeSpace: ActiveSpace;
  // 3. Estado dos projetos e manchas de tinta na cartolina
  inkSplashes: InkSplashRecord[];
  projectsRevealedCount: number;
  inspectedStickerId: string | null;
  // 4. Estado de cada flipbook (garantindo reprodução única)
  flipbooks: Record<string, FlipbookState>;
  activePlayingFlipbookId: string | null;
  // 5. Estado das animações concluídas (Persistência obrigatória de sessão para LLEW)
  signatureStatus: SignatureStatus;
  signatureProgress: number; // 0..1
  signaturePostDripProgress: number; // 0..1 (escorrimento residual pós-formação)
  signatureSnapshotDataUrl: string | null;
  cityTransitionCompletedOnce: boolean;
  // 6. Estado temporário de efeitos e parâmetros de calibração
  isTransitionLocked: boolean;
  shaderParams: ShaderParameters;
  studioOpen: boolean;
}

type Listener = (state: ExperienceStoreState) => void;

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const initialState: ExperienceStoreState = {
  phase: 'CITY_INTRO',
  activeSpace: 'CITY',
  inkSplashes: [],
  projectsRevealedCount: 0,
  inspectedStickerId: null,
  flipbooks: {
    'lwx-lab': {
      projectId: 'lwx-lab',
      isPlaying: false,
      currentTime: 0,
      isMuted: true,
      currentFrame: 1,
    },
    mmrpdis: {
      projectId: 'mmrpdis',
      isPlaying: false,
      currentTime: 0,
      isMuted: true,
      currentFrame: 1,
    },
    'soul-list': {
      projectId: 'soul-list',
      isPlaying: false,
      currentTime: 0,
      isMuted: true,
      currentFrame: 1,
    },
  },
  activePlayingFlipbookId: null,
  signatureStatus: 'IDLE',
  signatureProgress: 0,
  signaturePostDripProgress: 0,
  signatureSnapshotDataUrl: null,
  cityTransitionCompletedOnce: false,
  isTransitionLocked: false,
  shaderParams: {
    cameraZoomOut: 0,
    visorIntensity: 0,
    waterDistortion: 0,
    interfaceEmergence: 0,
    parallaxStrength: prefersReducedMotion ? 0.25 : 1.0,
    birdSpeedMultiplier: prefersReducedMotion ? 0.3 : 1.0,
    inkViscosity: 0.82,
    reducedMotion: Boolean(prefersReducedMotion),
  },
  studioOpen: false,
};

// Armazenamento em memória na sessão atual da página (sem localStorage/banco de dados, conforme Seção 9.3)
let currentState: ExperienceStoreState = { ...initialState };
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(currentState);
  }
}

export const experienceStore = {
  getState(): ExperienceStoreState {
    return currentState;
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setShaderParams(partial: Partial<ShaderParameters>) {
    currentState = {
      ...currentState,
      shaderParams: {
        ...currentState.shaderParams,
        ...partial,
      },
    };
    emit();
  },

  /**
   * Atualiza o progresso do recuo da câmera (0 = CITY_INTRO -> 1 = CHARACTER_REVEALED)
   */
  updateCameraZoomOut(nextZoom: number) {
    const clamped = Math.max(0, Math.min(1, nextZoom));
    let nextPhase = currentState.phase;

    if (
      currentState.phase === 'CITY_INTRO' ||
      currentState.phase === 'CITY_REVEAL' ||
      currentState.phase === 'CHARACTER_REVEALED'
    ) {
      if (clamped <= 0.04) {
        nextPhase = 'CITY_INTRO';
      } else if (clamped < 0.88) {
        nextPhase = 'CITY_REVEAL';
      } else {
        nextPhase = 'CHARACTER_REVEALED';
      }
    }

    currentState = {
      ...currentState,
      phase: nextPhase,
      shaderParams: {
        ...currentState.shaderParams,
        cameraZoomOut: clamped,
      },
    };
    emit();
  },

  /**
   * Inicia a sequência de ativação do visor vermelho -> distorção aquosa -> emergência da interface.
   * Impede que cliques repetidos reiniciem descontroladamente o efeito.
   */
  triggerVisorSequence() {
    if (currentState.isTransitionLocked) return;
    if (
      currentState.phase === 'VISOR_ACTIVATION' ||
      currentState.phase === 'WATER_DISTORTION' ||
      currentState.phase === 'INTERFACE_EMERGENCE'
    ) {
      return;
    }

    currentState = {
      ...currentState,
      phase: 'VISOR_ACTIVATION',
      isTransitionLocked: true,
      shaderParams: {
        ...currentState.shaderParams,
        cameraZoomOut: 1,
      },
    };
    emit();
  },

  setPhaseDirect(phase: ExperiencePhase) {
    // Se a assinatura LLEW já foi concluída nesta sessão, nunca regredimos seu estado
    const preserveComplete = currentState.signatureStatus === 'COMPLETE';
    currentState = {
      ...currentState,
      phase: preserveComplete && phase === 'LLEW_FORMING' ? 'LLEW_COMPLETE' : phase,
    };
    emit();
  },

  unlockTransition() {
    currentState = {
      ...currentState,
      isTransitionLocked: false,
      cityTransitionCompletedOnce: true,
    };
    emit();
  },

  /**
   * Navegação lateral entre os espaços (Cidade <-> Cartolina Projetos <-> Cartolina Sobre & Serviços)
   * Preserva integralmente o estado da assinatura LLEW e das manchas de tinta já lançadas.
   */
  navigateToSpace(space: ActiveSpace) {
    // Pausa vídeos ativos quando o usuário sai da área de projetos
    const updatedFlipbooks = { ...currentState.flipbooks };
    if (space !== 'CARTOLINA_PROJECTS') {
      for (const key of Object.keys(updatedFlipbooks)) {
        updatedFlipbooks[key] = { ...updatedFlipbooks[key], isPlaying: false };
      }
    }

    let nextPhase = currentState.phase;
    if (space === 'CARTOLINA_PROJECTS' || space === 'CARTOLINA_ABOUT') {
      if (currentState.signatureStatus === 'COMPLETE') {
        nextPhase = 'LLEW_COMPLETE';
      } else if (currentState.inkSplashes.length > 0) {
        nextPhase = 'PROJECTS_ACTIVE';
      } else {
        nextPhase = 'CARTOLINA_READY';
      }
    } else if (space === 'CITY') {
      nextPhase = currentState.cityTransitionCompletedOnce
        ? 'INTERFACE_EMERGENCE'
        : 'CHARACTER_REVEALED';
    }

    currentState = {
      ...currentState,
      activeSpace: space,
      phase: nextPhase,
      flipbooks: updatedFlipbooks,
      activePlayingFlipbookId: space === 'CARTOLINA_PROJECTS' ? currentState.activePlayingFlipbookId : null,
      isTransitionLocked: false,
    };
    emit();

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const viewport = document.querySelector('.llewxam-universe-viewport');
        if (viewport) {
          viewport.scrollTo({ top: 0, behavior: 'smooth' });
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  },

  /**
   * Registra um novo lançamento de tinta na cartolina na posição exata do clique
   */
  addInkSplash(splash: InkSplashRecord) {
    const nextSplashes = [...currentState.inkSplashes, splash];
    const nextRevealed = Math.min(3, currentState.projectsRevealedCount + 1);

    let nextPhase: ExperiencePhase = 'INK_REVEAL';
    if (currentState.signatureStatus === 'COMPLETE') {
      nextPhase = 'LLEW_COMPLETE';
    } else if (nextRevealed >= 1) {
      nextPhase = 'PROJECTS_ACTIVE';
    }

    currentState = {
      ...currentState,
      inkSplashes: nextSplashes,
      projectsRevealedCount: nextRevealed,
      phase: nextPhase,
    };
    emit();
  },

  /**
   * Limpa todas as manchas de tinta da cartolina após a animação do paninho/borracha
   */
  clearInkSplashes() {
    currentState = {
      ...currentState,
      inkSplashes: [],
      phase:
        currentState.signatureStatus === 'COMPLETE'
          ? 'LLEW_COMPLETE'
          : 'CARTOLINA_READY',
    };
    emit();
  },

  /**
   * Controla a formação e persistência obrigatória da assinatura LLEW na sessão
   */
  startSignatureFormation() {
    if (currentState.signatureStatus === 'COMPLETE' || currentState.signatureStatus === 'FORMING') {
      return;
    }
    currentState = {
      ...currentState,
      signatureStatus: 'FORMING',
      phase: 'LLEW_FORMING',
    };
    emit();
  },

  updateSignatureProgress(progress: number, postDripProgress: number, snapshotDataUrl?: string) {
    if (currentState.signatureStatus === 'COMPLETE') {
      return;
    }

    const isDone = progress >= 1 && postDripProgress >= 1;
    currentState = {
      ...currentState,
      signatureProgress: Math.min(1, progress),
      signaturePostDripProgress: Math.min(1, postDripProgress),
      signatureStatus: isDone ? 'COMPLETE' : 'FORMING',
      phase: isDone ? 'LLEW_COMPLETE' : 'LLEW_FORMING',
      signatureSnapshotDataUrl: snapshotDataUrl ?? currentState.signatureSnapshotDataUrl,
    };
    emit();
  },

  /**
   * Gerencia a reprodução dos Flipbooks garantindo que apenas 1 vídeo toque por vez
   */
  setFlipbookPlayback(projectId: string, partial: Partial<FlipbookState>) {
    const nextFlipbooks = { ...currentState.flipbooks };
    const wantPlay = partial.isPlaying === true;

    if (wantPlay) {
      for (const id of Object.keys(nextFlipbooks)) {
        if (id !== projectId) {
          nextFlipbooks[id] = { ...nextFlipbooks[id], isPlaying: false };
        }
      }
    }

    nextFlipbooks[projectId] = {
      ...nextFlipbooks[projectId],
      ...partial,
    };

    currentState = {
      ...currentState,
      flipbooks: nextFlipbooks,
      activePlayingFlipbookId: wantPlay
        ? projectId
        : currentState.activePlayingFlipbookId === projectId && partial.isPlaying === false
          ? null
          : currentState.activePlayingFlipbookId,
    };
    emit();
  },

  setInspectedSticker(stickerId: string | null) {
    currentState = {
      ...currentState,
      inspectedStickerId: stickerId,
    };
    emit();
  },

  toggleStudio(open?: boolean) {
    currentState = {
      ...currentState,
      studioOpen: open !== undefined ? open : !currentState.studioOpen,
    };
    emit();
  },

  /**
   * Função explícita de reinicialização no painel de estúdio para testes técnicos
   */
  resetFullExperienceForStudioTest() {
    currentState = {
      ...initialState,
      studioOpen: currentState.studioOpen,
    };
    emit();
  },
};
