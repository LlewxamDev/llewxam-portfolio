/**
 * Shaders GLSL — Cena 1: Cidade Pintada Multi-Planos Real + Vento Atmosférico + Color Grading Cinematográfico
 *
 * Arquitetura de Camadas (0% cortes, 100% sobreposição contínua):
 * - u_skyBackplateTex (Unit 0): Céu turquesa + pinceladas atmosféricas.
 * - u_farCityTex      (Unit 1): Horizonte metropolitano denso (RGBA com extensão até a base e perspectiva aérea).
 * - u_midCityTex      (Unit 2): Torres médias completas (RGBA estendido por trás dos telhados frontais).
 * - u_fgCityTex       (Unit 3): Prédios frontais e parapeito do OC (RGBA recortado nos 4 telhados reais).
 * - u_ocCutoutTex     (Unit 4): Personagem OC isolado (RGBA limpo).
 * - u_ocMaskTex       (Unit 5): R = lente exata do visor, G = máscara de vento do cachecol, B = proteção do elmo.
 * - u_birdsTex        (Unit 6): Pássaros determinísticos separados por profundidade (R=fundo, G=médio, B=frente).
 * - u_windowsSignalTex(Unit 7): R = janelas fundo, G = janelas médias, B = janelas frente, A = projeção "LLEW" no prédio esquerdo.
 */

export const CITY_VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const CITY_FRAGMENT_SHADER = `
  precision highp float;

  varying vec2 v_uv;

  uniform sampler2D u_skyBackplateTex;
  uniform sampler2D u_farCityTex;
  uniform sampler2D u_midCityTex;
  uniform sampler2D u_fgCityTex;
  uniform sampler2D u_ocCutoutTex;
  uniform sampler2D u_ocMaskTex;
  uniform sampler2D u_birdsTex;
  uniform sampler2D u_windowsSignalTex;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_zoomOut;          // 0.0 (enquadramento inicial) -> 1.0 (revelação completa)
  uniform vec2 u_pointerOffset;     // [-1.0, 1.0] parallax do mouse
  uniform float u_parallaxStrength; // multiplicador de parallax
  uniform float u_visorIntensity;   // 0.0 -> 1.0 ativação do visor e projetor "LLEW"
  uniform float u_waterDistortion;  // 0.0 -> 1.0 transição de refração aquática
  uniform float u_interfaceEmergence;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec2 screenToCanvasUV(vec2 screenUV, float zoomOut) {
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    float targetAspect = 1376.0 / 768.0;

    vec2 coverScale = vec2(1.0);
    if (aspect > targetAspect) {
      coverScale.y = targetAspect / aspect;
    } else {
      coverScale.x = aspect / targetAspect;
    }

    // Overscan de 10% garante margem em todas as direções durante o parallax
    vec2 fittedUV = (screenUV - 0.5) * coverScale * 0.90 + 0.5;

    float smoothZ = smoothstep(0.0, 1.0, zoomOut);
    float camScale = mix(2.08, 1.0, smoothZ);
    vec2 camFocus = mix(vec2(0.27, 0.32), vec2(0.50, 0.50), smoothZ);

    return (fittedUV - 0.5) / camScale + camFocus;
  }

  // Aplica iluminação pictórica nas células reais de janela, preservando 100% dos traços de nanquim do prédio
  vec3 applyWindowGlow(vec3 bldgRGB, float seedVal, float time, float inkThresh, float strength) {
    if (seedVal < 0.06) return bldgRGB;

    float seedId = floor(seedVal * 31.875 + 0.5);
    float h1 = fract(sin(seedId * 19.731) * 43758.5453);
    float h2 = fract(cos(seedId * 47.219) * 29183.1739);
    float h3 = fract(sin(seedId * 91.413) * 15731.9182);

    float speed = 0.24 + 0.36 * h1;
    float phase = h2 * 6.283185 + seedId * 3.71;

    float wave = sin(time * speed + phase) + 0.38 * cos(time * speed * 1.67 - phase * 0.65);
    float isLit = smoothstep(0.62, 0.82, wave);
    if (isLit <= 0.001) return bldgRGB;

    float bldgLuma = dot(bldgRGB, vec3(0.299, 0.587, 0.114));
    float inkMask = smoothstep(inkThresh, inkThresh + 0.15, bldgLuma);

    float flicker = 0.93 + 0.07 * sin(time * (2.8 + h3 * 2.0) + seedId);
    float glow = isLit * inkMask * flicker * strength;

    vec3 warmGold = vec3(1.0, 0.80, 0.40);
    vec3 coralAmber = vec3(1.0, 0.58, 0.32);
    vec3 crimsonPeach = vec3(1.0, 0.42, 0.56);

    vec3 winColor = mix(warmGold, coralAmber, smoothstep(0.2, 0.75, h2));
    winColor = mix(winColor, crimsonPeach, smoothstep(0.70, 0.95, h3) * 0.50);

    vec3 blended = mix(bldgRGB, winColor, glow * 0.72) + winColor * glow * 0.20;
    return clamp(blended, 0.0, 1.0);
  }

  // Amostragem suavizada apenas para o canal A (projeção "LLEW")
  float sampleSmoothSignalAlpha(vec2 uv) {
    vec2 px = vec2(1.0 / 1376.0, 1.0 / 768.0) * 0.75;
    float c = texture2D(u_windowsSignalTex, uv).a * 0.40;
    c += texture2D(u_windowsSignalTex, uv + vec2(px.x, 0.0)).a * 0.15;
    c += texture2D(u_windowsSignalTex, uv - vec2(px.x, 0.0)).a * 0.15;
    c += texture2D(u_windowsSignalTex, uv + vec2(0.0, px.y)).a * 0.15;
    c += texture2D(u_windowsSignalTex, uv - vec2(0.0, px.y)).a * 0.15;
    return c;
  }

  // Correntes de vento pintadas (slipstreams) + partículas/pétalas levadas pelo vento entre os prédios
  vec3 computeWindCurrents(vec2 uv, float time, float depthScale, vec3 streamTint) {
    // Coordenadas inclinadas acompanhando a direção do vento nos telhados (direita -> esquerda/cima)
    vec2 wUV = vec2(uv.x * 1.45 + uv.y * 0.38, uv.y * 2.6 - uv.x * 0.18) * depthScale;
    float flowX = wUV.x + time * (0.48 + 0.12 * depthScale);

    // Fitas de vento senoidais suaves (zero texturas extras, 100% analítico e leve)
    float waveA = sin(flowX * 3.2 + sin(wUV.y * 2.4 - time * 0.7) * 1.6);
    float ribbonA = smoothstep(0.92, 0.995, cos(wUV.y * 5.5 + waveA * 1.35 - time * 0.4));

    float waveB = cos(flowX * 4.7 - cos(wUV.y * 3.8 + time * 0.9) * 1.3);
    float ribbonB = smoothstep(0.94, 0.998, sin(wUV.y * 8.2 + waveB * 1.15 + time * 0.65));

    // Envelope longitudinal para que as rajadas apareçam como traços de pincel alongados no ar
    float gustMaskA = smoothstep(0.15, 0.75, sin(flowX * 1.8 - wUV.y * 1.2 + time * 0.5));
    float gustMaskB = smoothstep(0.25, 0.85, cos(flowX * 2.3 + wUV.y * 1.7 - time * 0.8));

    float streaks = ribbonA * gustMaskA * 0.55 + ribbonB * gustMaskB * 0.45;

    // Pequenas partículas/folhas de tinta levadas pelo vento (células determinísticas rápidas)
    vec2 pGrid = vec2(uv.x * 22.0 + time * 2.6, uv.y * 14.0 + sin(uv.x * 5.0 + time) * 0.8);
    vec2 cellId = floor(pGrid);
    vec2 cellF = fract(pGrid) - 0.5;
    float h = hash(cellId + depthScale * 17.0);
    float spark = 0.0;
    if (h > 0.84) {
      vec2 jitter = vec2(fract(h * 13.7) - 0.5, fract(h * 29.3) - 0.5) * 0.45;
      vec2 d = cellF - jitter;
      // Alonga a partícula na direção do vento
      float dist = length(vec2(d.x * 0.55, d.y * 1.85));
      spark = smoothstep(0.14, 0.02, dist) * (0.5 + 0.5 * sin(time * 4.0 + h * 20.0));
    }

    vec3 sparkCol = mix(streamTint, vec3(1.0, 0.78, 0.52), 0.55);
    return streamTint * streaks * 0.26 + sparkCol * spark * 0.34;
  }

  // Feixe volumétrico estilo "Bat-Sinal" saindo da lente do visor até o prédio esquerdo
  vec3 computeVisorProjectorBeam(vec2 midUV, vec2 ocUV, float time, float visorGlow) {
    if (visorGlow <= 0.001) return vec3(0.0);

    vec2 pSrc = vec2(0.453, 0.289);
    vec2 pDst = vec2(0.149, 0.346);

    vec2 dir = pDst - pSrc;
    float len = length(dir);
    vec2 uDir = dir / max(len, 0.0001);
    vec2 uPerp = vec2(-uDir.y, uDir.x);

    vec2 rel = midUV - pSrc;
    float along = dot(rel, uDir) / max(len, 0.0001);
    if (along < -0.02 || along > 1.06) return vec3(0.0);

    float across = dot(rel, uPerp);
    float halfWidth = mix(0.014, 0.062, clamp(along, 0.0, 1.0));
    float radial = abs(across) / max(halfWidth, 0.0001);
    if (radial > 1.15) return vec3(0.0);

    float coneProfile = smoothstep(1.15, 0.12, radial);
    float coreProfile = smoothstep(0.65, 0.0, radial);
    float longFade = smoothstep(-0.01, 0.06, along) * (1.0 - smoothstep(0.92, 1.05, along));

    float dust = 0.5 + 0.28 * sin(midUV.x * 58.0 + time * 1.4) * cos(midUV.y * 44.0 - time * 0.9);
    float scan = 0.88 + 0.12 * sin(along * 42.0 - time * 6.5);

    vec3 outerBeamCol = vec3(1.0, 0.18, 0.44);
    vec3 innerBeamCol = vec3(1.0, 0.82, 0.56);

    vec3 beam = (outerBeamCol * coneProfile * 0.38 + innerBeamCol * coreProfile * 0.34)
                * (0.78 + 0.42 * dust) * scan * longFade * visorGlow;

    return beam;
  }

  // Color Grading Cinematográfico da Cena 1: preserva 100% do estilo pintado à mão enquanto
  // aprofunda sombras em azul-petróleo/índigo, realça carmesim/turquesa e aquece as luzes douradas
  vec3 applyCinematicCityGrade(vec3 col, vec2 screenUV) {
    // 1. Balanço de exposição e recuperação de riqueza tonal nos meios-tons
    col = clamp(col, 0.0, 1.0);
    float luma = dot(col, vec3(0.299, 0.587, 0.114));

    // 2. Vibrance inteligente (intensifica os pigmentos de aquarela sem estourar áreas já saturadas)
    float maxC = max(col.r, max(col.g, col.b));
    float minC = min(col.r, min(col.g, col.b));
    float sat = maxC - minC;
    float vibranceBoost = (1.0 - sat) * 0.28;
    col = mix(vec3(luma), col, 1.16 + vibranceBoost);

    // 3. Split-Toning de 3 vias (Sombras = Teal/Índigo Profundo, Meios-tons = Carmesim/Turquesa, Altas-luzes = Âmbar/Ouro)
    float shadowWeight = (1.0 - smoothstep(0.0, 0.42, luma));
    float midWeight = smoothstep(0.12, 0.50, luma) * (1.0 - smoothstep(0.50, 0.88, luma));
    float highWeight = smoothstep(0.52, 0.96, luma);

    vec3 shadowTint = vec3(0.04, 0.13, 0.19);
    vec3 midTint = vec3(1.04, 0.97, 1.02);
    vec3 highTint = vec3(1.06, 0.96, 0.86);

    col = mix(col, col * 0.72 + shadowTint * 0.45, shadowWeight * 0.34);
    col *= mix(vec3(1.0), midTint, midWeight * 0.45);
    col = mix(col, col * highTint, highWeight * 0.50);

    // 4. Curva S Fílmica suave (nanquim escuro profundo + luzes vivas)
    vec3 sCurve = col * col * (3.0 - 2.0 * col);
    col = mix(col, sCurve, 0.26);

    // 5. Luz atmosférica direcional (brilho ciano-turquesa no topo do céu + calor carmesim no cânion)
    float skyCrown = smoothstep(0.55, 0.0, screenUV.y);
    col += vec3(0.02, 0.09, 0.12) * skyCrown * (0.4 + 0.6 * luma);

    // 6. Vinheta pictórica sutil nas bordas para focar o olhar na profundidade do cânion
    vec2 vVec = (screenUV - 0.5) * vec2(1.22, 1.05);
    float vig = smoothstep(0.38, 0.92, length(vVec));
    col = mix(col, col * vec3(0.74, 0.70, 0.80), vig * 0.26);

    return clamp(col, 0.0, 1.0);
  }

  vec4 sampleLayeredCityAndCharacter(vec2 screenUV, float zoomOut, vec2 pointer, float time) {
    float smoothZ = smoothstep(0.0, 1.0, zoomOut);
    vec2 baseUV = screenToCanvasUV(screenUV, zoomOut);

    // Vetor de parallax do mouse e dolly da câmera com separação clara entre planos
    vec2 pVec = pointer * 0.030 * u_parallaxStrength * (0.48 + 0.52 * smoothZ);
    vec2 dollyVec = (1.0 - smoothZ) * vec2(0.032, 0.038);

    float bottomDamp = 1.0 - smoothstep(0.84, 0.98, baseUV.y) * 0.65;
    vec2 pVecDamped = vec2(pVec.x, pVec.y * bottomDamp);

    // =========================================================================
    // CAMADA 0: Céu Turquesa & Correntes de Vento de Alta Altitude (Parallax 0.12)
    // =========================================================================
    vec2 skyUV = clamp(baseUV + pVecDamped * 0.12 - dollyVec * 0.14, 0.003, 0.997);
    float skyMask = 1.0 - smoothstep(0.18, 0.64, skyUV.y);
    float skyFlow = 0.5 + 0.35 * sin(skyUV.x * 7.5 + time * 0.32) * cos(skyUV.y * 5.2 - time * 0.22);
    vec2 windShift = vec2(
      skyFlow - 0.5,
      0.35 * cos(skyUV.x * 9.0 - time * 0.26)
    ) * 0.0042 * skyMask;
    vec3 color = texture2D(u_skyBackplateTex, clamp(skyUV + windShift, 0.003, 0.997)).rgb;

    float skyGlow = 0.05 * sin(time * 0.75 + skyUV.x * 4.2 + skyFlow * 2.8) * skyMask;
    color += vec3(0.05, 0.18, 0.22) * skyGlow;

    // Pássaros de Fundo (Canal R) — voam atrás de TODOS os prédios
    vec2 birdFarUV = clamp(baseUV + pVecDamped * 0.20 - dollyVec * 0.22, 0.003, 0.997);
    float birdFar = texture2D(u_birdsTex, birdFarUV).r;
    color = mix(color, vec3(0.09, 0.04, 0.08), clamp(birdFar * 0.85, 0.0, 1.0));

    // =========================================================================
    // CAMADA 1: Horizonte Metropolitano Denso (Parallax 0.26) + Perspectiva Aérea
    // =========================================================================
    vec2 farUV = clamp(baseUV + pVecDamped * 0.26 - dollyVec * 0.28, 0.003, 0.997);
    vec4 farSample = texture2D(u_farCityTex, farUV);
    float farWinSeed = texture2D(u_windowsSignalTex, farUV).r;
    vec3 farCol = applyWindowGlow(farSample.rgb, farWinSeed, time, 0.15, 0.72);
    // Neblina atmosférica azul-petróleo no horizonte para deixar 100% claro que está longe
    float farHorizonMist = smoothstep(0.22, 0.78, farUV.y) * 0.28;
    farCol = mix(farCol, vec3(0.12, 0.34, 0.44), farHorizonMist);
    color = mix(color, farCol, farSample.a);

    // Vento atmosférico distante + véu de neblina entre o Horizonte (FAR) e as Torres Médias (MID)
    color += computeWindCurrents(farUV, time * 0.85, 1.0, vec3(0.32, 0.82, 0.92)) * (1.0 - smoothstep(0.68, 0.92, farUV.y));

    // Pássaros Médios (Canal G) — voam na frente da metrópole de fundo e ATRÁS das torres médias
    vec2 birdMidUV = clamp(baseUV + pVecDamped * 0.42 - dollyVec * 0.44, 0.003, 0.997);
    float birdMid = texture2D(u_birdsTex, birdMidUV).g;
    color = mix(color, vec3(0.08, 0.03, 0.06), clamp(birdMid * 0.92, 0.0, 1.0));

    // =========================================================================
    // CAMADA 2: Torres Médias (Parallax 0.56) + Janelas Médias + Projeção "LLEW"
    // =========================================================================
    vec2 midUV = clamp(baseUV + pVecDamped * 0.56 - dollyVec * 0.58, 0.003, 0.997);
    vec4 midSample = texture2D(u_midCityTex, midUV);
    float midWinSeed = texture2D(u_windowsSignalTex, midUV).g;
    vec3 midCol = applyWindowGlow(midSample.rgb, midWinSeed, time, 0.23, 0.90);

    // Projeção do Símbolo "LLEW" (estilo Bat-Sinal) na fachada da torre alta da esquerda
    if (u_visorIntensity > 0.001 && midSample.a > 0.1) {
      float sigVal = sampleSmoothSignalAlpha(midUV);
      if (sigVal > 0.02) {
        float midLuma = dot(midSample.rgb, vec3(0.299, 0.587, 0.114));
        float inkGridKeep = smoothstep(0.14, 0.30, midLuma);

        float inOval = smoothstep(0.10, 0.34, sigVal);
        float inShadowRim = smoothstep(0.12, 0.0, abs(sigVal - 0.52)) * step(0.36, sigVal);
        float inLetters = smoothstep(0.66, 0.88, sigVal);

        float pulse = 0.94 + 0.06 * sin(time * 7.5);
        float vInt = u_visorIntensity * pulse;

        vec3 spotlightCol = vec3(1.0, 0.36, 0.54) * (0.62 + 0.38 * inkGridKeep);
        midCol = mix(midCol, midCol * 0.62 + spotlightCol * 0.88, inOval * 0.72 * vInt);
        midCol = mix(midCol, vec3(0.12, 0.02, 0.06), inShadowRim * 0.78 * u_visorIntensity);

        vec3 letterCoreCol = mix(vec3(1.0, 0.55, 0.70), vec3(1.0, 0.96, 0.76), smoothstep(0.74, 0.96, sigVal));
        letterCoreCol *= (0.76 + 0.24 * inkGridKeep);
        midCol = mix(midCol, letterCoreCol, inLetters * 0.96 * vInt);
      }
    }

    color = mix(color, midCol, midSample.a);

    // Correntes de vento e pétalas/brasas cruzando o cânion médio (entre MID e FG)
    color += computeWindCurrents(midUV + vec2(0.17, 0.09), time * 1.15, 1.35, vec3(0.96, 0.52, 0.66));

    // Pássaros Frontais (Canal B) — voam atrás dos prédios do primeiro plano e do OC
    vec2 birdFgUV = clamp(baseUV + pVecDamped * 0.72 - dollyVec * 0.74, 0.003, 0.997);
    float birdFg = texture2D(u_birdsTex, birdFgUV).b;
    color = mix(color, vec3(0.06, 0.02, 0.05), clamp(birdFg * 0.95, 0.0, 1.0));

    // =========================================================================
    // CAMADA 3: Prédios Frontais e Parapeito (Parallax 0.88) + Contraste de Primeiro Plano
    // =========================================================================
    vec2 fgUV = clamp(baseUV + pVecDamped * 0.88 - dollyVec * 0.88, 0.003, 0.997);
    vec4 fgSample = texture2D(u_fgCityTex, fgUV);
    float fgWinSeed = texture2D(u_windowsSignalTex, fgUV).b;
    vec3 fgCol = applyWindowGlow(fgSample.rgb, fgWinSeed, time, 0.18, 0.82);
    // Realce de contraste nos telhados do primeiro plano para destacar a proximidade com o OC
    fgCol = clamp(fgCol * 1.04 - 0.015, 0.0, 1.0);
    color = mix(color, fgCol, fgSample.a);

    // Rajadas finas de vento passando em frente aos telhados (primeiro plano)
    color += computeWindCurrents(fgUV + vec2(0.41, 0.23), time * 1.45, 1.75, vec3(0.55, 0.90, 0.96)) * 0.65;

    // =========================================================================
    // FEIXE VOLUMÉTRICO DO PROJETOR (Do visor até o prédio esquerdo)
    // =========================================================================
    vec2 ocBaseUV = clamp(baseUV + pVecDamped * 0.90 - dollyVec * 0.90, 0.003, 0.997);
    color += computeVisorProjectorBeam(midUV, ocBaseUV, time, u_visorIntensity);

    // =========================================================================
    // CAMADA 4: Personagem OC + Vento Expressivo no Cachecol + Lente Exata do Visor
    // =========================================================================
    vec3 ocMasks = texture2D(u_ocMaskTex, ocBaseUV).rgb;
    float scarfMask = ocMasks.g;
    float faceProtect = ocMasks.b;
    float netScarfWind = scarfMask * (1.0 - faceProtect);

    float wave1 = sin(ocBaseUV.x * 28.0 - time * 4.5 + ocBaseUV.y * 15.0);
    float wave2 = cos(ocBaseUV.y * 36.0 - time * 3.4 - ocBaseUV.x * 21.0);
    float gust = 0.85 + 0.35 * sin(time * 1.9);
    vec2 scarfDisp = vec2(wave1 * 0.0072, wave2 * 0.0058) * gust * netScarfWind;

    vec2 ocFinalUV = clamp(ocBaseUV + scarfDisp, 0.003, 0.997);
    vec4 ocSample = texture2D(u_ocCutoutTex, ocFinalUV);
    float exactVisorLens = texture2D(u_ocMaskTex, ocFinalUV).r;

    float ocReveal = smoothstep(0.08, 0.42, smoothZ);
    float ocAlpha = ocSample.a * ocReveal;
    vec3 ocColor = ocSample.rgb;

    if (u_visorIntensity > 0.001 && exactVisorLens > 0.01) {
      float vPulse = 0.92 + 0.08 * sin(time * 8.0);
      float scanLine = 0.85 + 0.15 * sin(ocFinalUV.y * 520.0 - time * 10.0);
      float topGleam = smoothstep(0.302, 0.270, ocFinalUV.y) * smoothstep(0.448, 0.476, ocFinalUV.x);

      vec3 visorRuby = vec3(1.0, 0.12, 0.38);
      vec3 visorHotCore = vec3(1.0, 0.86, 0.72);
      vec3 litLens = mix(visorRuby, visorHotCore, 0.38 + 0.45 * topGleam) * scanLine * vPulse;

      ocColor = mix(ocColor, litLens, clamp(exactVisorLens * u_visorIntensity * 0.95, 0.0, 1.0));
      ocColor += visorRuby * exactVisorLens * u_visorIntensity * 0.35;
    }

    color = mix(color, ocColor, ocAlpha);

    return vec4(color, 1.0);
  }

  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);

    float wDist = u_waterDistortion;
    vec2 waterOffset = vec2(0.0);
    float waveCrest = 0.0;

    if (wDist > 0.001) {
      vec2 visorScreenCenter = vec2(0.46, 0.29);
      vec2 toVisor = uv - visorScreenCenter;
      float dist = length(toVisor * vec2(1.78, 1.0));

      float ripple1 = sin(dist * 34.0 - u_time * 6.2) * exp(-dist * 2.2);
      float swirl = sin(uv.x * 18.0 + u_time * 2.1) * cos(uv.y * 16.0 - u_time * 1.8);
      float ripple2 = cos(dist * 50.0 - u_time * 4.5 + swirl * 1.8) * exp(-dist * 1.6);

      float envelope = sin(wDist * 3.14159265) * 0.88;
      waterOffset = (
        normalize(toVisor + vec2(0.0001)) * (ripple1 * 0.015 + ripple2 * 0.008) +
        vec2(swirl * 0.007, -swirl * 0.005)
      ) * envelope;
      waveCrest = clamp((ripple1 + ripple2) * 0.5 + 0.5, 0.0, 1.0) * envelope;
    }

    vec2 finalScreenUV = clamp(uv + waterOffset, 0.001, 0.999);
    vec4 baseSample = sampleLayeredCityAndCharacter(finalScreenUV, u_zoomOut, u_pointerOffset, u_time);
    vec3 color = applyCinematicCityGrade(baseSample.rgb, finalScreenUV);

    if (wDist > 0.005) {
      float caustic = smoothstep(0.60, 0.92, waveCrest);
      color += vec3(0.12, 0.32, 0.40) * caustic * 0.28;
      color.r += waveCrest * 0.06 * wDist;
      color.b -= waveCrest * 0.04 * wDist;
    }

    if (u_interfaceEmergence > 0.001) {
      float vignette = smoothstep(0.18, 0.92, length((uv - 0.5) * vec2(1.3, 1.0)));
      color = mix(color, color * vec3(0.78, 0.72, 0.82), u_interfaceEmergence * vignette * 0.30);
    }

    float grain = (hash(uv * u_resolution + fract(u_time) * 100.0) - 0.5) * 0.014;
    color += grain;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;
