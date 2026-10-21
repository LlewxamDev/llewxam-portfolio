import React, { useEffect, useRef, useState } from 'react';
import { Eraser, ExternalLink } from 'lucide-react';
import { PROJECTS_DATA } from '../../data/projectsData';
import { experienceStore, ExperienceStoreState } from '../../state/experienceStore';
import { AboutServicesSection } from '../about/AboutServicesSection';
import { FlipbookVideoPlayer } from '../projects/FlipbookVideoPlayer';
import { StickerImage } from '../projects/StickerImage';
import { LlewSignatureCanvas } from '../typography/LlewSignatureCanvas';
import { InkSplatterCanvas } from './InkSplatterCanvas';

const INK_SPLASH_PALETTE: [string, string][] = [
  ['#ef0574', '#1d889b'],
  ['#1d889b', '#bc2035'],
  ['#bc2035', '#e168ab'],
  ['#2494a5', '#ff9979'],
];

interface Props {
  storeState: ExperienceStoreState;
}

export const CartolinaEnvironment: React.FC<Props> = ({ storeState }) => {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [wipeTrigger, setWipeTrigger] = useState<number>(0);
  const [isWipingInk, setIsWipingInk] = useState<boolean>(false);

  // Guarantees that navigating to About Me or Back to Projects always starts at the very top of that section
  useEffect(() => {
    const viewport = document.querySelector('.llewxam-universe-viewport');
    if (viewport) {
      viewport.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, [storeState.activeSpace]);

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isWipingInk) return;
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('.flipbook-object-wrapper') ||
      target.closest('.sticker-cutout-card')
    ) {
      return;
    }

    const surface = surfaceRef.current;
    if (!surface) return;

    const rect = surface.getBoundingClientRect();
    const normX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
    const normY = Math.max(0.03, Math.min(0.97, (e.clientY - rect.top) / rect.height));

    const paletteIdx = storeState.inkSplashes.length % INK_SPLASH_PALETTE.length;
    const [primaryHex, secondaryHex] = INK_SPLASH_PALETTE[paletteIdx];

    experienceStore.addInkSplash({
      id: `splash-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      x: normX,
      y: normY,
      radius: 135 + (storeState.inkSplashes.length % 3) * 38,
      seed: Math.floor(Math.random() * 999999) + 1,
      pigmentHex: primaryHex,
      secondaryHex: secondaryHex,
      createdAt: Date.now(),
    });
  };

  const handleTriggerClothWipe = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (storeState.inkSplashes.length === 0 || isWipingInk) return;
    setIsWipingInk(true);
    setWipeTrigger((prev) => prev + 1);
  };

  const isAboutWing = storeState.activeSpace === 'CARTOLINA_ABOUT';
  const inkCount = storeState.inkSplashes.length;
  const hasInkOnSurface =
    inkCount > 0 || storeState.signatureStatus === 'COMPLETE';

  return (
    <main
      ref={surfaceRef}
      className="cartolina-physical-board"
      onClick={handleSurfaceClick}
      aria-label="Projects Portfolio — LLEW (LlewxamDev)"
    >
      <div
        className="cartolina-paper-grain-layer"
        style={{ backgroundImage: `url('/assets/reference/cartolina-surface.png')` }}
        aria-hidden="true"
      />
      <div className="cartolina-panel-grooves" aria-hidden="true" />

      <InkSplatterCanvas
        splashes={storeState.inkSplashes}
        reducedMotion={storeState.shaderParams.reducedMotion}
        wipeTrigger={wipeTrigger}
        onWipeComplete={() => {
          setIsWipingInk(false);
          experienceStore.clearInkSplashes();
        }}
      />

      {/* Top-right Atelier Eraser / Cleaning Cloth (only inside Cartolina) */}
      <button
        type="button"
        className={`cartolina-eraser-floating-btn ${
          inkCount > 0 ? 'has-ink-active' : 'eraser-idle'
        } ${isWipingInk ? 'is-wiping-now' : ''}`}
        onClick={handleTriggerClothWipe}
        disabled={inkCount === 0 || isWipingInk}
        aria-label="Wipe all ink from the cartolina board"
        title={inkCount > 0 ? 'Wipe ink off the board' : 'Board is clean'}
      >
        <span className="eraser-rubber-block" aria-hidden="true">
          <span className="eraser-sleeve-band" />
          <Eraser size={16} className="eraser-svg-icon" />
        </span>
        <span className="eraser-label-text">
          {isWipingInk ? 'Wiping...' : 'Wipe Ink'}
        </span>
        {inkCount > 0 && !isWipingInk && (
          <span className="eraser-ink-count-badge">{inkCount}</span>
        )}
      </button>

      <div className="cartolina-content-stage">
        {isAboutWing ? (
          <AboutServicesSection storeState={storeState} />
        ) : (
          <>
            <header className="cartolina-top-atelier-bar">
              <button
                type="button"
                className="cartolina-lateral-btn"
                onClick={() => experienceStore.navigateToSpace('CITY')}
              >
                ← Back to City Scene
              </button>

              <div className="cartolina-stack-summary-pills">
                <span className="stack-mini-pill">JavaScript / TypeScript</span>
                <span className="stack-mini-pill">Python</span>
                <span className="stack-mini-pill">Node.js · Discord.js · Baileys</span>
                <span className="stack-mini-pill">Rust</span>
              </div>

              <button
                type="button"
                className="cartolina-lateral-btn highlight-lateral-btn"
                onClick={() => experienceStore.navigateToSpace('CARTOLINA_ABOUT')}
              >
                About Me, Stack & Services →
              </button>
            </header>

            <section className="cartolina-title-composition">
              <p className="cartolina-super-kicker">
                EVANDRO SILVA AMORIM (@LLEWXAMDEV) · BOTS, AUTOMATIONS & SYSTEMS
              </p>
              <h1 className="ink-formed-main-heading">
                FEATURED PROJECTS
                <span className="heading-ink-drip drip-a" aria-hidden="true" />
                <span className="heading-ink-drip drip-b" aria-hidden="true" />
                <span className="heading-ink-drip drip-c" aria-hidden="true" />
              </h1>
              <p className="cartolina-intro-note">
                Production systems built for <strong>Discord</strong> and{' '}
                <strong>WhatsApp</strong> — specializing in commercial server automation, full-scale MMORPG engines, and high-performance execution across 1,400+ commands.
              </p>
            </section>

            <div className="cartolina-projects-collage">
              {PROJECTS_DATA.map((project, index) => {
                const isReversedLayout = index % 2 === 1;
                const flipState = storeState.flipbooks[project.id];

                return (
                  <article
                    key={project.id}
                    id={`project-${project.id}`}
                    className={`project-art-installation ${
                      isReversedLayout ? 'installation-reversed' : ''
                    } ${hasInkOnSurface ? 'ink-energized' : ''}`}
                    style={
                      {
                        '--proj-accent': project.compositionOffset.inkAccentHex,
                        '--proj-secondary': project.compositionOffset.secondaryPigmentHex,
                        '--proj-rot': `${project.compositionOffset.rotateDeg}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="installation-pigment-underlay" aria-hidden="true" />

                    <div className="installation-manuscript-column">
                      <div className="project-ink-header">
                        <span className="project-number-stamp">0{index + 1}</span>
                        <span className="project-platform-pill">{project.platform}</span>
                        <span className="project-category-ink">{project.categoryBadge}</span>
                      </div>

                      <h2 className="project-pictorial-title">
                        {project.title}
                        <span className="title-letter-drip" aria-hidden="true" />
                      </h2>
                      <p className="project-pictorial-subtitle">{project.subtitle}</p>

                      <p className="project-body-description">{project.description}</p>

                      <div className="project-architecture-callout">
                        <strong>Technical Architecture:</strong> {project.architectureNotes}
                      </div>

                      <ul className="project-tech-strokes" aria-label="Technologies used">
                        {project.techStack.map((tech) => (
                          <li key={tech} className="tech-stroke-tag">
                            {tech}
                          </li>
                        ))}
                      </ul>

                      <div className="project-external-links">
                        {project.externalLinks.map((lnk) =>
                          lnk.unavailable ? (
                            <span
                              key={lnk.label}
                              className="project-ink-link cursor-unavailable is-unavailable-link"
                              aria-disabled="true"
                              title="Unavailable — Public Release Coming Soon"
                            >
                              <span>{lnk.label}</span>
                              <ExternalLink size={14} />
                            </span>
                          ) : (
                            <a
                              key={lnk.label}
                              href={lnk.url}
                              target="_blank"
                              rel="noreferrer"
                              className="project-ink-link"
                            >
                              <span>{lnk.label}</span>
                              <ExternalLink size={14} />
                            </a>
                          )
                        )}
                      </div>

                      <div className="project-stickers-cluster">
                        {project.stickers.map((sticker) => (
                          <StickerImage
                            key={sticker.id}
                            sticker={sticker}
                            projectTitle={project.title}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="installation-flipbook-column">
                      <FlipbookVideoPlayer
                        project={project}
                        flipbookState={flipState}
                        reducedMotion={storeState.shaderParams.reducedMotion}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <LlewSignatureCanvas storeState={storeState} />

            <footer className="cartolina-bottom-navigation">
              <button
                type="button"
                className="lateral-cartolina-gateway dark-ink-gateway"
                onClick={() => experienceStore.navigateToSpace('CARTOLINA_ABOUT')}
              >
                <span className="gateway-content">
                  <span className="gateway-direction">PROFESSIONAL PROFILE & CONTACT</span>
                  <span className="gateway-main-label">
                    About Me, Core Stack & Services →
                  </span>
                </span>
              </button>
            </footer>
          </>
        )}
      </div>
    </main>
  );
};
