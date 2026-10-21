import React, { useState } from 'react';
import { Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { FlipbookState, ProjectItem } from '../../types/experience';

interface Props {
  project: ProjectItem;
  flipbookState?: FlipbookState;
  reducedMotion?: boolean;
}

export const FlipbookVideoPlayer: React.FC<Props> = ({ project }) => {
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  const isComingSoon = project.id === 'mmrpdis';

  return (
    <div
      className={`flipbook-object-wrapper ${isExpandedView ? 'flipbook-expanded-modal' : ''}`}
      aria-label={`Artwork frame for ${project.title}`}
    >
      <div className="flipbook-paper-stack">
        <div className="flipbook-sheet-underlay sheet-depth-4" aria-hidden="true" />
        <div className="flipbook-sheet-underlay sheet-depth-3" aria-hidden="true" />
        <div className="flipbook-sheet-underlay sheet-depth-2" aria-hidden="true" />
        <div className="flipbook-sheet-underlay sheet-depth-1" aria-hidden="true" />

        <div className="flipbook-spine-binding" aria-hidden="true">
          <span className="spine-staple" />
          <span className="spine-staple" />
          <span
            className="spine-ink-blot"
            style={{ background: project.compositionOffset.inkAccentHex }}
          />
        </div>

        <div className="flipbook-active-page flipbook-static-artwork-frame">
          <div className="flipbook-page-header">
            <span className="flipbook-stamp-id">
              {project.platform.toUpperCase()} · {project.title.toUpperCase()}
            </span>

            <div className="flipbook-header-right-actions">
              {isComingSoon && (
                <span className="flipbook-coming-soon-pill">
                  <Sparkles size={12} />
                  <span>PUBLIC RELEASE COMING SOON</span>
                </span>
              )}
              <button
                type="button"
                className="flipbook-frame-expand-btn"
                onClick={() => setIsExpandedView((prev) => !prev)}
                aria-label={isExpandedView ? 'Close expanded artwork' : 'Expand artwork'}
                title={isExpandedView ? 'Close expanded view' : 'Expand artwork'}
              >
                {isExpandedView ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </div>

          <div
            className="flipbook-viewport-area flipbook-artwork-viewport"
            onClick={() => setIsExpandedView((prev) => !prev)}
          >
            <img
              src={project.posterUrl}
              alt={`${project.title} cover artwork`}
              className="flipbook-framed-artwork-img"
              loading="lazy"
            />

            {/* Spine inner gutter shadow & subtle vignette frame */}
            <div className="flipbook-spine-gutter-shadow" aria-hidden="true" />
            <div className="flipbook-artwork-inner-border" aria-hidden="true" />

            {isComingSoon && (
              <div className="flipbook-coming-soon-corner-banner">
                <span>PUBLIC RELEASE COMING SOON</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
