# 3D Animation Stack

3D cartoon animations built with **Three.js** (via React Three Fiber + `@remotion/three`) and
**Remotion** (timeline, captions, audio, rendering to video).

## Setup
```bash
npm install
```

## Use
```bash
npm run dev                                                  # Remotion Studio live preview
npx remotion render src/index.ts StyleCabin out/cabin.mp4    # render a composition
npm run typecheck
```

Compositions: `Demo3D` (stack demo, 16:9), `StyleCabin` and `StyleDock` (4 s cel-shaded cartoon style tests, 9:16).

- `src/style/` — reusable cartoon style kit: character rig, toon materials + outlines, procedural textures, camera rig.
- `src/components/Captions.tsx` — captions (`cartoon` and `highlight` variants).
- `public/` — fonts and audio.
- `CLAUDE.md` — stack rules and style guide used when creating new animations.

WebGL uses the GPU (`angle`) when available and falls back to software (`swangle`) otherwise;
override with `REMOTION_GL=angle|swangle`.
