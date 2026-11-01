import { createContext, useContext } from "react";

/**
 * Per-shot timing shared with every character so they can animate on their own
 * (idle breathing, blinking, lip movement) without each shot wiring it up.
 * `t` = shot/script time in seconds, `voice` = narration loudness 0..1 at this frame (for lip movement).
 */
export const SceneTime = createContext<{ t: number; voice: number } | null>(null);
export const useSceneTime = () => useContext(SceneTime);

/** Deterministic idle-blink: ~every 2.6–4.2 s, offset per character seed. Returns an eye-open multiplier. */
export const idleBlink = (t: number, seed: number) => {
  const period = 2.6 + (seed % 7) * 0.23;
  const phase = (t + seed * 1.37) % period;
  if (phase < 0.05) return 0.45;
  if (phase < 0.1) return 0.07;
  if (phase < 0.15) return 0.45;
  return 1;
};

/** Distance-driven walk phase so feet never slide: one stride (two steps) ≈ 0.84 units. */
export const walkPhase = (distance: number) => (distance / 0.42) * Math.PI;
