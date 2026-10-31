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
- Character life is automatic when a shot is wrapped in `SceneTime` (`style/time.ts`): breathing, head sway, staggered
  blinking. Use `talk` for lip movement from the narration loudness, `walk={walkPhase(distanceTravelled)}` (never
  frame-based — feet slide), and `holdL/holdR` for props carried in a hand. Arms bend at the elbow automatically.
- Lighting: `Stage` turns on soft shadows from the strongest directional light (toon meshes cast/receive) and adds a
  cool rim light; characters with legs get a contact shadow. Glows / ink lines never cast.
- Chairs face the same way as the character sitting in them (`rotationY` = the character's).
- Captions: `<Captions captions={words([...])} variant="cartoon" />` (Montserrat 900, white, thick black stroke).
- Compositions: 1080×1920 @ 30fps.

## Narrated videos (voiceover → synced animation) — see `src/compositions/EiffelTower.tsx`
1. Copy the voiceover to `public/audio/` unchanged. Composition length = `Math.ceil(audioSeconds * fps)`; never retime the voice.
2. Find phrase boundaries: `ffmpeg -i voice.wav -af silencedetect=noise=-38dB:d=0.12 -f null -` (and `-34dB:d=0.05` for commas).
   Map each script phrase to a speech segment in `src/data/<name>-phrases.json` as `[startSec, endSec, "text"]`.
3. `node scripts/align-script.mjs src/data/<name>-phrases.json src/data/<name>-captions.json` → word-level `Caption[]`.
4. Build a shot list `{ start, tr, C }` (one shot per narration beat); shots receive absolute time `t` (seconds) so
   actions are keyed to narration timestamps. Transitions: `cut | fade | slide | whip | iris | black`.
5. Music bed via `node scripts/make-audio.mjs <seconds>`; keep music at `volume={0.1}` and sfx ≤ 0.3 under the voice.
6. Review: bundle once (`npx remotion bundle src/index.ts --out-dir=.bundle`), render stills per shot at `--scale=0.25`,
   check framing, then `npx remotion render .bundle <Id> out/<name>.mp4 --concurrency=4`.
7. Re-recorded narration (same script): keep shots authored in script time and only realign the words —
   new `src/data/<name>-captions.json` + `VOICE_SECONDS` in `eiffel/timeMap.ts`, which maps every shot, overlay and
   sfx word-by-word (`toVoice` / `toScript`). Remove the old voice file entirely.
Captions for narrated shorts: `<Captions variant="cartoon" placement="bottom" scale={0.36} combineWithinMs={700} />` —
clean Montserrat 700 on a soft dark pill, lower area, max 2 lines, 10% side margins, never across a sentence end; frame close-ups so faces sit in the upper two-thirds (aim the camera a little below the face).
Prefer cut / fade (12 f) transitions; avoid whip-blur and camera shake.
Framing tips for 9:16: the frame is narrow (≈0.43 units wide per 1 unit of distance at fov 42), so stack characters
in depth / over-the-shoulder instead of side by side; keep cameras inside room walls and above/beside heads (hats occlude).
