import type { Caption } from "@remotion/captions";
import v1 from "../../data/eiffel-v1-captions.json";
import current from "../../data/eiffel-captions.json";

/**
 * Shots in shots.tsx are authored in "script time": the word timings of the first voiceover
 * (src/data/eiffel-v1-captions.json). When the narration is re-recorded, only the word timings change, so
 * we map time word-by-word (piecewise-linear between matching word starts) instead of re-authoring shots.
 * Swapping in another take = new eiffel-captions.json (same script) + VOICE_SECONDS.
 */
export const VOICE_SECONDS = 59.688; // public/audio/eiffel-voiceover.mp3
const V1_SECONDS = 58.32;

const a = v1 as Caption[];
const b = current as Caption[];
if (a.length !== b.length) throw new Error("Script mismatch between v1 and current captions");

// anchor pairs [scriptTime, voiceTime]
const anchors: [number, number][] = [[0, 0]];
a.forEach((w, i) => anchors.push([w.startMs / 1000, b[i].startMs / 1000]));
anchors.push([a[a.length - 1].endMs / 1000, b[b.length - 1].endMs / 1000]);
anchors.push([V1_SECONDS, VOICE_SECONDS]);

const interp = (x: number, from: 0 | 1) => {
  const to = from === 0 ? 1 : 0;
  if (x <= anchors[0][from]) return anchors[0][to] + (x - anchors[0][from]);
  for (let i = 1; i < anchors.length; i++) {
    const [p, q] = [anchors[i - 1], anchors[i]];
    if (x <= q[from]) {
      const span = q[from] - p[from];
      return span <= 0 ? q[to] : p[to] + ((x - p[from]) / span) * (q[to] - p[to]);
    }
  }
  const last = anchors[anchors.length - 1];
  return last[to] + (x - last[from]);
};

/** script time → current-voiceover time */
export const toVoice = (scriptT: number) => interp(scriptT, 0);
/** current-voiceover time → script time (what shots receive as `t`) */
export const toScript = (voiceT: number) => interp(voiceT, 1);
