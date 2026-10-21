import React, { useEffect, useState } from 'react';
import { CartolinaEnvironment } from './components/cartolina/CartolinaEnvironment';
import { CityCanvasScene } from './components/city/CityCanvasScene';
import { CustomFireInkCursor } from './components/cursor/CustomFireInkCursor';
import { AnimatedFireFavicon } from './components/favicon/AnimatedFireFavicon';
import { experienceStore, ExperienceStoreState } from './state/experienceStore';

export const App: React.FC = () => {
  const [storeState, setStoreState] = useState<ExperienceStoreState>(() =>
    experienceStore.getState()
  );

  useEffect(() => {
    return experienceStore.subscribe((next) => {
      setStoreState({ ...next });
    });
  }, []);

  const isCartolinaActive =
    storeState.activeSpace === 'CARTOLINA_PROJECTS' ||
    storeState.activeSpace === 'CARTOLINA_ABOUT';

  return (
    <div
      className={`llewxam-universe-viewport ${
        isCartolinaActive ? 'space-mode-cartolina' : 'space-mode-city'
      }`}
    >
      <AnimatedFireFavicon />
      <CustomFireInkCursor />
      <svg className="svg-art-defs" aria-hidden="true">
        <defs>
          <filter id="ink-edge-filter" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04"
              numOctaves="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2.6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="paper-deckle-edge" x="-4%" y="-4%" width="108%" height="108%">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.06"
              numOctaves="2"
              result="rough"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="rough"
              scale="3.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        className={`spatial-stage-track ${
          isCartolinaActive ? 'track-shifted-to-cartolina' : 'track-on-city'
        }`}
      >
        <div className="spatial-pane pane-city">
          <CityCanvasScene storeState={storeState} />
        </div>

        <div className="spatial-pane pane-cartolina">
          {isCartolinaActive && <CartolinaEnvironment storeState={storeState} />}
        </div>
      </div>
    </div>
  );
};
