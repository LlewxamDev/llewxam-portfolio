import React, { useRef, useState } from 'react';
import { ImagePlus, ZoomIn, X } from 'lucide-react';
import { ProjectSticker } from '../../types/experience';

interface Props {
  sticker: ProjectSticker;
  projectTitle: string;
}

export const StickerImage: React.FC<Props> = ({ sticker, projectTitle }) => {
  const [customImgUrl, setCustomImgUrl] = useState<string | null>(
    sticker.imageUrl && sticker.imageUrl.trim().length > 0 ? sticker.imageUrl : null
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomImgUrl(URL.createObjectURL(file));
  };

  return (
    <>
      <figure
        className={`sticker-cutout-card tape-style-${sticker.tapePosition}`}
        style={{
          transform: `rotate(${sticker.rotationDeg}deg) scale(${sticker.scale})`,
          '--sticker-accent': sticker.accentPigment,
        } as React.CSSProperties}
      >
        <div className="sticker-adhesive-element" aria-hidden="true" />

        <div
          className="sticker-visual-surface"
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label={`Expand ${sticker.label} from ${projectTitle}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {customImgUrl ? (
            <img
              src={customImgUrl}
              alt={`${sticker.label} — ${sticker.caption}`}
              className="sticker-real-img"
            />
          ) : (
            <div className={`sticker-diagram-preview preview-${sticker.previewType}`}>
              <div className="sticker-diagram-top">
                <span
                  className="sticker-diagram-dot"
                  style={{ background: sticker.accentPigment }}
                />
                <span className="sticker-diagram-tag">{projectTitle}</span>
              </div>
              <strong className="sticker-diagram-title">{sticker.label}</strong>
              <ul className="sticker-highlights-list">
                {sticker.highlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <span className="sticker-zoom-badge" title="Expand preview">
            <ZoomIn size={13} />
          </span>
        </div>

        <figcaption className="sticker-caption-footer">
          <span className="sticker-caption-text">{sticker.caption}</span>
          <button
            type="button"
            className="sticker-replace-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title="Attach screenshot (.png/.jpg)"
          >
            <ImagePlus size={12} />
            <span>Screenshot</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </figcaption>
      </figure>

      {isLightboxOpen && (
        <div
          className="sticker-lightbox-backdrop"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded preview of ${sticker.label}`}
        >
          <div
            className="sticker-lightbox-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sticker-lightbox-close"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
            <h4 className="sticker-lightbox-title">
              {projectTitle} — {sticker.label}
            </h4>
            {customImgUrl ? (
              <img
                src={customImgUrl}
                alt={sticker.caption}
                className="sticker-lightbox-full-img"
              />
            ) : (
              <div className="sticker-lightbox-placeholder-detail">
                <p>{sticker.caption}</p>
                <ul>
                  {sticker.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
