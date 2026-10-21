export type ExperiencePhase =
  | 'CITY_INTRO'
  | 'CITY_REVEAL'
  | 'CHARACTER_REVEALED'
  | 'VISOR_ACTIVATION'
  | 'WATER_DISTORTION'
  | 'INTERFACE_EMERGENCE'
  | 'CARTOLINA_ENTRY'
  | 'CARTOLINA_READY'
  | 'INK_REVEAL'
  | 'PROJECTS_ACTIVE'
  | 'LLEW_FORMING'
  | 'LLEW_COMPLETE';

export type ActiveSpace = 'CITY' | 'CARTOLINA_PROJECTS' | 'CARTOLINA_ABOUT';

export type SignatureStatus = 'IDLE' | 'FORMING' | 'COMPLETE';

export interface InkSplashRecord {
  id: string;
  x: number; // Normalized 0..1 on the cartolina surface
  y: number; // Normalized 0..1 on the cartolina surface
  radius: number;
  seed: number;
  pigmentHex: string;
  secondaryHex: string;
  createdAt: number;
}

export interface FlipbookState {
  projectId: string;
  isPlaying: boolean;
  currentTime: number;
  isMuted: boolean;
  currentFrame: number;
}

export interface ProjectSticker {
  id: string;
  label: string;
  caption: string;
  imageUrl?: string; // Real screenshot path when provided
  rotationDeg: number;
  scale: number;
  tapePosition: 'top-left' | 'top-center' | 'corners' | 'pin';
  accentPigment: string;
  previewType: 'discord-sales' | 'mmorpg-battle' | 'whatsapp-baileys' | 'architecture';
  highlights: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  platform: 'Discord' | 'WhatsApp' | 'Web / Full-Stack';
  categoryBadge: string;
  description: string;
  architectureNotes: string;
  techStack: string[];
  videoUrl?: string; // Path for real video (.mp4 / .webm) when uploaded
  posterUrl?: string;
  isPlaceholderVideo: boolean;
  flipbookFps: number;
  flipbookTotalFrames: number;
  externalLinks: {
    label: string;
    url: string;
    unavailable?: boolean;
  }[];
  compositionOffset: {
    rotateDeg: number;
    marginTopPx: number;
    inkAccentHex: string;
    secondaryPigmentHex: string;
  };
  stickers: ProjectSticker[];
  demoTerminalLines: {
    command: string;
    response: string;
    accent: string;
  }[];
}

export interface ShaderParameters {
  cameraZoomOut: number; // 0 (CITY_INTRO close canyon) -> 1 (CHARACTER_REVEALED full composition)
  visorIntensity: number; // 0 -> 1 red visor glow & bloom
  waterDistortion: number; // 0 -> 1 wet watercolor refraction
  interfaceEmergence: number; // 0 -> 1 pigment coalescence into UI
  parallaxStrength: number;
  birdSpeedMultiplier: number;
  inkViscosity: number;
  reducedMotion: boolean;
}
