# PROJETO LLEWXAM — Portfólio Artístico Interativo (`LLEW` / `LlewxamDev`)

Experiência pictórica interativa desenvolvida para **Evandro Silva Amorim (`LlewxamDev`)**, apresentando seus bots principais (**LWX Lab**, **mmrpdis**, **Soul List**), automações e engenharia web em uma arquitetura gráfica híbrida (**WebGL/GLSL 2.5D + Canvas 2D + React/TypeScript + SVG**).

---

## 1. Como Executar o Projeto

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` no navegador.
Para validar o build de produção e checagem de tipos TypeScript:

```bash
npm run build
```

---

## 2. Como Adicionar os Vídeos Reais e Prints dos Bots

### Opção A — Diretamente pela Interface (Sem editar código, para teste imediato)
- **Nos Flipbooks de Vídeo:** Clique no botão pontilhado **`Anexar Vídeo Real`** na barra de cada Flipbook para carregar um arquivo `.mp4` ou `.webm` do seu computador e testar o efeito de folheamento físico sincronizado na hora.
- **Nas Figurinhas Coladas (Stickers):** Clique em **`Colar Print`** no rodapé de qualquer figurinha para substituir pela captura de tela real (`.png` / `.jpg` / `.webp`).

### Opção B — Permanentemente nos Arquivos do Projeto
1. Coloque seus vídeos em `public/assets/videos/` (ex.: `public/assets/videos/lwx-lab.mp4`, `mmrpdis.mp4`, `soul-list.mp4`).
2. Coloque suas capturas de tela em `public/assets/stickers/`.
3. Edite `src/data/projectsData.ts` e preencha os campos `videoUrl` e `stickers[].imageUrl` de cada projeto (`lwx-lab`, `mmrpdis`, `soul-list`).

---

## 3. Estrutura Modular do Código (`src/`)

- `src/shaders/citySceneShaders.ts`: Shaders GLSL (Vertex & Fragment) responsáveis pela câmera 2.5D da Cidade Pintada, parallax por mapa de profundidade, acendimento e bloom do visor vermelho na máscara exata do elmo, refração aquosa (*Domain-Warped FBM*) e coalescência de pigmentos.
- `src/components/city/CityCanvasScene.tsx`: Coordenação WebGL + Canvas 2D de pássaros em trajetórias Bézier determinísticas, gesto de **Scroll Up** (`deltaY < 0`) para recuo da câmera, clique no OC na beirada do prédio e interface emergente.
- `src/components/cartolina/CartolinaEnvironment.tsx`: Superfície física da cartolina prensada a frio, navegação lateral contínua e composição artística dos projetos.
- `src/components/cartolina/InkSplatterCanvas.tsx`: Motor Canvas 2D que lança manchas radiais irregulares, respingos secundários e escorrimentos gravitacionais na posição exata do clique.
- `src/components/projects/FlipbookVideoPlayer.tsx`: Objeto físico de flipbook com espessura de folhas, folheamento sincronizado ao vídeo e controles integrados à cartolina.
- `src/components/projects/StickerImage.tsx`: Figurinhas recortadas e coladas à cartolina com fita adesiva, rotação orgânica e modal de ampliação nítida.
- `src/components/typography/LlewSignatureCanvas.tsx`: Formação caligráfica progressiva da assinatura **LLEW** com escorrimento residual pós-formação e persistência obrigatória durante a sessão da página.
- `src/state/experienceStore.ts`: Máquina de estados explícita (12 estados) e store de sessão em memória.
- `src/components/studio/PrototypeLabPanel.tsx`: Estúdio técnico para inspecionar e calibrar os 7 protótipos críticos em tempo real.
