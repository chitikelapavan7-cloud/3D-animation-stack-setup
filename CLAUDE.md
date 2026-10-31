# 3D Animation Project

## Required stack — always use this for 3D animations
Every 3D animation in this project MUST use this stack. Do not substitute other tools
(no Blender, Babylon.js, raw WebGL, p5.js, ffmpeg-only pipelines, or other video frameworks).

| Job | Tool |
|-----|------|
| 3D scenes, meshes, lights, cameras, materials | **Three.js** via `@react-three/fiber` (+ `@react-three/drei` helpers), embedded with `<ThreeCanvas>` from `@remotion/three` |
| Timeline, rendering to video, **captions**, **audio** | **Remotion** (`remotion`, `@remotion/cli`, `@remotion/captions`, `@remotion/media-utils`) |

## Rules
- Drive ALL motion from Remotion's `useCurrentFrame()` / `useVideoConfig()` (with `interpolate`, `spring`).
  Never use R3F `useFrame`, `THREE.Clock`, `Date.now()`, or `requestAnimationFrame` — renders must be deterministic per frame.
- Put the Three.js scene inside `<ThreeCanvas width={width} height={height}>`; overlay captions/text as normal React/HTML on top in an `<AbsoluteFill>`.
- Captions: use the `Caption` type from `@remotion/captions` (times in ms). Reuse `src/components/Captions.tsx`.
  Load `.srt` files with `parseSrt`. Highlighting is word-by-word via `createTikTokStyleCaptions`.
- Audio: `<Audio src={staticFile("file.mp3")} volume={...} />` from `remotion`; put files in `public/`.
  Use `<Sequence from={...}>` to place sounds on the timeline.
- Each new animation = a new file in `src/compositions/` + a `<Composition>` entry in `src/Root.tsx`.
- Use `src/compositions/Demo3D.tsx` as the reference template.

## Commands
- `npm run dev` — open Remotion Studio (live preview)
- `npx remotion render src/index.ts <CompositionId> out/<name>.mp4` — render a video
- `npx remotion still src/index.ts <CompositionId> out/frame.png --frame=60` — render one frame
- `npm run typecheck` — TypeScript check; run after edits

WebGL renderer is chosen automatically in `remotion.config.ts` (`angle` with a GPU, `swangle`
software rendering without one, e.g. cloud containers). Override with `REMOTION_GL=angle|swangle`.
After rendering, verify by extracting a frame with ffmpeg and looking at it.

## House art style (cartoon cel-shaded shorts) — `src/style/`
Reference look: big round white heads, tiny bean bodies, black stick limbs, thick black outlines,
cel-shaded 3D sets, punchy colors, vertical 9:16, 1–3 word captions. Templates: `src/compositions/StyleCabin.tsx`
(night interior, light change) and `src/compositions/StyleDock.tsx` (daytime exterior, two characters).
- `style/Character.tsx` — `<Character>` rig: `face` (eyes/brows/mouth/mustache/blush/sweat), `hat`, `outfit`
  (color + texture map + details), `armL/armR` hand offsets, `headRot`, `lean`, `bounce`. Brow tilt: + worried, − angry.
- `style/toon.tsx` — `ToonMat` (3-band cel shading), `Line` (outline; child of a mesh), `Box`, `Stick`.
  **Do not use drei `<Outlines>`: it does not render inside Remotion. Use `Line`.**
- `style/textures.ts` — seeded procedural textures: `planks`, `stripes`, `dots`, `speckled`, `glow`.
- `style/Camera.tsx` — `<CameraRig position target fov>` driven per frame.
- Always pass `flat` to `<ThreeCanvas>` (no tone mapping, so colors stay saturated).
- Captions: `<Captions captions={words([...])} variant="cartoon" />` (Montserrat 900, white, thick black stroke).
- Compositions: 1080×1920 @ 30fps.
