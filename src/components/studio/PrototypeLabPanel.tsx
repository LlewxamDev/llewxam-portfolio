import React, { useEffect, useState } from 'react';
import { Sliders, X, RotateCcw, Eye } from 'lucide-react';
import { experienceStore, ExperienceStoreState } from '../../state/experienceStore';

interface Props {
  storeState: ExperienceStoreState;
}

export const PrototypeLabPanel: React.FC<Props> = ({ storeState }) => {
  const [fps, setFps] = useState<number>(60);

  useEffect(() => {
    if (!storeState.studioOpen) return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [storeState.studioOpen]);

  const { shaderParams } = storeState;

  return (
    <aside
      className="prototype-studio-dock"
      aria-label="Estúdio Técnico de Protótipos e Calibração de Efeitos"
    >
      {!storeState.studioOpen ? (
        <button
          type="button"
          className="studio-toggle-pill"
          onClick={() => experienceStore.toggleStudio(true)}
          title="Abrir painel de protótipos técnicos e calibração de shaders"
        >
          <Sliders size={14} />
          <span>Estúdio Técnico · 7 Protótipos</span>
          <span className="studio-phase-tag">{storeState.phase}</span>
        </button>
      ) : (
        <div className="studio-inspector-drawer">
          <div className="studio-drawer-header">
            <div>
              <strong>ESTÚDIO TÉCNICO LLEW (FASE 3)</strong>
              <span className="studio-fps-badge">{fps} FPS</span>
            </div>
            <button
              type="button"
              className="studio-close-btn"
              onClick={() => experienceStore.toggleStudio(false)}
              aria-label="Fechar painel de estúdio"
            >
              <X size={16} />
            </button>
          </div>

          <div className="studio-telemetry-row">
            <span>
              Estado: <strong>{storeState.phase}</strong>
            </span>
            <span>
              Assinatura LLEW: <strong>{storeState.signatureStatus}</strong>
            </span>
            <span>
              Manchas: <strong>{storeState.inkSplashes.length}</strong>
            </span>
          </div>

          {/* Atalhos diretos para validar os 7 Protótipos Críticos (Seção 17 - Fase 3) */}
          <div className="studio-prototypes-grid">
            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CITY');
                experienceStore.setPhaseDirect('CITY_INTRO');
                experienceStore.setShaderParams({
                  cameraZoomOut: 0,
                  visorIntensity: 0,
                  waterDistortion: 0,
                  interfaceEmergence: 0,
                });
              }}
            >
              1. Cena Inicial (Cidade)
            </button>

            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CITY');
                experienceStore.setPhaseDirect('CHARACTER_REVEALED');
                experienceStore.setShaderParams({
                  cameraZoomOut: 1,
                  visorIntensity: 0,
                  waterDistortion: 0,
                  interfaceEmergence: 0,
                });
              }}
            >
              2. Revelar OC na Beirada
            </button>

            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CITY');
                experienceStore.setShaderParams({ cameraZoomOut: 1 });
                experienceStore.triggerVisorSequence();
              }}
            >
              3. Acender Visor + Água
            </button>

            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CARTOLINA_PROJECTS');
              }}
            >
              4. Cartolina & Flipbooks
            </button>

            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CARTOLINA_PROJECTS');
                experienceStore.startSignatureFormation();
              }}
            >
              5. Formar Assinatura LLEW
            </button>

            <button
              type="button"
              className="proto-jump-btn"
              onClick={() => {
                experienceStore.navigateToSpace('CARTOLINA_ABOUT');
              }}
            >
              6. Ala Sobre & Serviços
            </button>
          </div>

          {/* Sliders de Calibração em Tempo Real dos Parâmetros Gráficos */}
          <div className="studio-sliders-list">
            <label className="studio-slider-item">
              <span>
                Protótipo 1 · Recuo da Câmera (Zoom Out):{' '}
                <strong>{Math.round(shaderParams.cameraZoomOut * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shaderParams.cameraZoomOut}
                onChange={(e) =>
                  experienceStore.updateCameraZoomOut(parseFloat(e.target.value))
                }
              />
            </label>

            <label className="studio-slider-item">
              <span>
                Protótipo 2 · Emissão do Visor Vermelho:{' '}
                <strong>{Math.round(shaderParams.visorIntensity * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shaderParams.visorIntensity}
                onChange={(e) =>
                  experienceStore.setShaderParams({
                    visorIntensity: parseFloat(e.target.value),
                  })
                }
              />
            </label>

            <label className="studio-slider-item">
              <span>
                Protótipo 3 · Refração Aquosa / Blur Pictórico:{' '}
                <strong>{Math.round(shaderParams.waterDistortion * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shaderParams.waterDistortion}
                onChange={(e) =>
                  experienceStore.setShaderParams({
                    waterDistortion: parseFloat(e.target.value),
                  })
                }
              />
            </label>

            <label className="studio-slider-item">
              <span>
                Protótipo 4 · Coalescência das Cores em Interface:{' '}
                <strong>{Math.round(shaderParams.interfaceEmergence * 100)}%</strong>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={shaderParams.interfaceEmergence}
                onChange={(e) =>
                  experienceStore.setShaderParams({
                    interfaceEmergence: parseFloat(e.target.value),
                  })
                }
              />
            </label>

            <label className="studio-slider-item">
              <span>
                Intensidade do Parallax 2.5D:{' '}
                <strong>{shaderParams.parallaxStrength.toFixed(2)}x</strong>
              </span>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={shaderParams.parallaxStrength}
                onChange={(e) =>
                  experienceStore.setShaderParams({
                    parallaxStrength: parseFloat(e.target.value),
                  })
                }
              />
            </label>

            <label className="studio-slider-item">
              <span>
                Velocidade dos Pássaros no Céu:{' '}
                <strong>{shaderParams.birdSpeedMultiplier.toFixed(2)}x</strong>
              </span>
              <input
                type="range"
                min={0}
                max={2.5}
                step={0.05}
                value={shaderParams.birdSpeedMultiplier}
                onChange={(e) =>
                  experienceStore.setShaderParams({
                    birdSpeedMultiplier: parseFloat(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <div className="studio-bottom-actions">
            <button
              type="button"
              className="studio-aux-btn"
              onClick={() =>
                experienceStore.setShaderParams({
                  reducedMotion: !shaderParams.reducedMotion,
                })
              }
            >
              <Eye size={13} />
              <span>
                Movimento Reduzido: {shaderParams.reducedMotion ? 'ATIVO' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              className="studio-aux-btn reset-studio-btn"
              onClick={() => experienceStore.resetFullExperienceForStudioTest()}
              title="Reinicialização explícita de estúdio (inclui resetar a assinatura LLEW para novo teste)"
            >
              <RotateCcw size={13} />
              <span>Resetar Sessão (Teste)</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
