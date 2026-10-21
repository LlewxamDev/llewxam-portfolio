import React from 'react';
import { ExternalLink, Github, Instagram, Linkedin, Sparkles, Terminal } from 'lucide-react';
import { CREATOR_PROFILE } from '../../data/projectsData';
import { experienceStore, ExperienceStoreState } from '../../state/experienceStore';
import { LlewSignatureCanvas } from '../typography/LlewSignatureCanvas';

interface Props {
  storeState: ExperienceStoreState;
}

export const AboutServicesSection: React.FC<Props> = ({ storeState }) => {
  return (
    <div className="cartolina-about-wing" aria-label="About Me, Core Stack, Services and Contact">
      <div className="cartolina-lateral-nav-bar">
        <button
          type="button"
          className="cartolina-lateral-btn"
          onClick={() => experienceStore.navigateToSpace('CARTOLINA_PROJECTS')}
        >
          ← Back to Projects (LWX Lab, mmrpdis, Soul List)
        </button>

        <button
          type="button"
          className="cartolina-lateral-btn secondary-lateral-btn"
          onClick={() => experienceStore.navigateToSpace('CITY')}
        >
          ← Back to City Scene
        </button>
      </div>

      <div className="about-hero-collage">
        <figure className="oc-study-polaroid">
          <div className="polaroid-tape-top" aria-hidden="true" />
          <video
            src="/assets/reference/myOcAfter.mp4"
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            className="oc-study-img"
            aria-label="Animated OC portrait by LLEW (@LlewxamDev)"
          />
          <figcaption className="oc-study-caption">
            LLEW · @LlewxamDev
          </figcaption>
        </figure>

        <div className="about-identity-manuscript">
          <span className="manuscript-kicker">{CREATOR_PROFILE.role.toUpperCase()}</span>
          <h2 className="manuscript-heading">
            {CREATOR_PROFILE.fullName}{' '}
            <span className="manuscript-alias">({CREATOR_PROFILE.alias} / {CREATOR_PROFILE.handle})</span>
          </h2>
          <p className="manuscript-edu">{CREATOR_PROFILE.education}</p>
          <p className="manuscript-manifesto">{CREATOR_PROFILE.manifesto}</p>

          <div className="manuscript-contact-stamps">
            <a
              href={CREATOR_PROFILE.links.github}
              target="_blank"
              rel="noreferrer"
              className="ink-contact-stamp primary-stamp"
            >
              <Github size={16} />
              <span>GitHub: @LlewxamDev</span>
              <ExternalLink size={13} />
            </a>
            <a
              href={CREATOR_PROFILE.links.linkedin}
              target="_blank"
              rel="noreferrer"
              className="ink-contact-stamp linkedin-stamp"
            >
              <Linkedin size={16} />
              <span>LinkedIn</span>
              <ExternalLink size={13} />
            </a>
            <a
              href={CREATOR_PROFILE.links.instagram}
              target="_blank"
              rel="noreferrer"
              className="ink-contact-stamp instagram-stamp"
            >
              <Instagram size={16} />
              <span>@llewxam_editor</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      <section className="about-stack-palette" aria-label="Core Tech Stack">
        <h3 className="section-ink-heading">
          <Terminal size={20} />
          <span>Core Stack & Technologies</span>
        </h3>
        <div className="stack-swatches-flow">
          {CREATOR_PROFILE.coreStack.map((item) => (
            <article
              key={item.name}
              className="stack-pigment-swatch"
              style={{ '--swatch-color': item.pigment } as React.CSSProperties}
            >
              <div className="swatch-brush-bar" aria-hidden="true" />
              <h4 className="swatch-title">{item.name}</h4>
              <p className="swatch-role">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-services-atelier" aria-label="Services and Solutions">
        <h3 className="section-ink-heading">
          <Sparkles size={20} />
          <span>Services & Solutions</span>
        </h3>
        <div className="services-composition-row">
          {CREATOR_PROFILE.services.map((srv, idx) => (
            <article
              key={srv.id}
              className={`service-manuscript-sheet sheet-rot-${idx % 3}`}
            >
              <h4 className="service-sheet-title">{srv.title}</h4>
              <p className="service-sheet-desc">{srv.description}</p>
              <ul className="service-deliverables">
                {srv.deliverables.map((del, i) => (
                  <li key={i}>{del}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="about-github-archive" aria-label="Public GitHub Repositories">
        <h3 className="section-ink-heading">
          <Github size={20} />
          <span>More Open-Source Projects (@LlewxamDev)</span>
        </h3>
        <div className="github-sketches-row">
          {CREATOR_PROFILE.openSourceHighlights.map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="github-sketch-note"
            >
              <div className="sketch-note-top">
                <strong>{repo.name}</strong>
                <span className="sketch-tech-tag">{repo.tech}</span>
              </div>
              <p>{repo.summary}</p>
            </a>
          ))}
        </div>
      </section>

      <LlewSignatureCanvas storeState={storeState} />
    </div>
  );
};
