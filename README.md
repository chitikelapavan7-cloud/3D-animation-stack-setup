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

Compositions: `Demo3D` (stack demo, 16:9), `StyleCabin` and `StyleDock` (4 s cel-shaded cartoon style tests, 9:16),
and **`EiffelTower`** — the full 59.7 s short *“The Man Who Sold the Eiffel Tower”*, synced to the narrator's voiceover
(rendered video: `renders/EiffelTower.mp4`).

- `src/style/` — reusable cartoon style kit: character rig, toon materials + outlines, procedural textures, camera rig.
- `src/components/Captions.tsx` — captions (`cartoon` and `highlight` variants).
- `src/style/props.tsx` — prop library (Eiffel Tower, hats, money, signs, stamp, lamps, clock, lightbulb…).
- `src/compositions/eiffel/` — the Eiffel short: `cast.tsx`, `sets.tsx`, `shots.tsx` (17 shots), timeline in `EiffelTower.tsx`.
- `src/data/` — script phrases with voiceover timings + generated word captions (`eiffel-v1-*` = original take, used as the shots' script-time reference).
- `scripts/align-script.mjs` — aligns a known script to a voiceover (phrase timings → word captions).
- `scripts/make-audio.mjs` — generates the background music bed and sound effects.
- `public/` — fonts and audio (voiceover, music, sfx).
- `CLAUDE.md` — stack rules and style guide used when creating new animations.

WebGL uses the GPU (`angle`) when available and falls back to software (`swangle`) otherwise;
override with `REMOTION_GL=angle|swangle`.
