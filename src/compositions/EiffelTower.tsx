import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import { Captions } from "../components/Captions";
import captionsJson from "../data/eiffel-captions.json";
import "../style/fonts";
import * as S from "./eiffel/shots";
import envelope from "../data/eiffel-voice-envelope.json";
import { SceneTime } from "../style/time";
import { toScript, toVoice, VOICE_SECONDS } from "./eiffel/timeMap";

/** The video is exactly as long as the narration (public/audio/eiffel-voiceover.mp3). */
export const EIFFEL_FPS = 30;
export const EIFFEL_DURATION = Math.ceil(VOICE_SECONDS * EIFFEL_FPS);

type Transition = "cut" | "fade" | "slide" | "whip" | "iris" | "black";
const OVERLAP: Record<Transition, number> = { cut: 0, fade: 12, slide: 10, whip: 8, iris: 14, black: 18 };

/** Shot list in script time (see timeMap.ts); each line of the script gets its own shot. */
const SHOTS: { start: number; tr: Transition; C: React.FC<S.ShotProps> }[] = [
  { start: 0, tr: "cut", C: S.S1Intro }, // A man sold the Eiffel Tower…
  { start: 4.45, tr: "fade", C: S.S2Rust }, // 1925, rusting, costly, tear it down
  { start: 11.6, tr: "fade", C: S.S3Letterhead }, // fake government letterhead
  { start: 14.62, tr: "fade", C: S.S4Hotel }, // fancy hotel suite
  { start: 16.62, tr: "fade", C: S.S5Dealers }, // five scrap dealers
  { start: 19.7, tr: "fade", C: S.S6Meeting }, // "The city can't afford it"
  { start: 23.4, tr: "cut", C: S.S7Bid }, // seven thousand tons of iron
  { start: 25.55, tr: "cut", C: S.S8Riots }, // tell no one, or riots
  { start: 28.2, tr: "cut", C: S.S9Poisson }, // André Poisson wanted it badly
  { start: 32.0, tr: "cut", C: S.S10FeltOff }, // something felt off
  { start: 34.1, tr: "fade", C: S.S11Confess }, // underpaid official, little bribe
  { start: 39.2, tr: "cut", C: S.S12Realize }, // only a real official asks for a bribe
  { start: 43.1, tr: "cut", C: S.S13Paid }, // Poisson paid
  { start: 44.3, tr: "fade", C: S.S14Train }, // train out of Paris
  { start: 47.9, tr: "fade", C: S.S15Waited }, // waited for the police
  { start: 51.0, tr: "fade", C: S.S16Embarrassed }, // too embarrassed
  { start: 54.2, tr: "black", C: S.S17Return }, // a month later… sell it again
];

const ShotWrap: React.FC<{ from: number; tr: Transition; C: React.FC<S.ShotProps> }> = ({ from, tr, C }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ov = OVERLAP[tr];
  const t = toScript((from + f) / fps);
  const e = ov === 0 ? 1 : interpolate(f, [0, ov], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  let style: React.CSSProperties = {};
  let black = 0;
  if (tr === "fade") style = { opacity: e };
  if (tr === "slide") style = { transform: `translateX(${(1 - e) * 100}%)` };
  if (tr === "whip") style = { transform: `translateX(${(1 - e) * 100}%)`, filter: e < 1 ? `blur(${(1 - e) * 40}px)` : undefined };
  if (tr === "iris") style = { clipPath: `circle(${e * 120}% at 50% 45%)` };
  if (tr === "black") {
    const half = ov / 2;
    style = { opacity: f < half ? 0 : 1 };
    black = f < half ? f / half : 1 - (f - half) / half;
  }
  return (
    <>
      {tr === "black" && f < ov / 2 ? null : (
        <AbsoluteFill style={style}>
          <SceneTime.Provider value={{ t, voice: (envelope as number[])[from + f] ?? 0 }}>
            <C t={t} />
          </SceneTime.Provider>
        </AbsoluteFill>
      )}
      {black > 0 && <AbsoluteFill style={{ background: "black", opacity: black }} />}
    </>
  );
};

const SFX: { at: number; file: string; volume: number }[] = [
  { at: 0.42, file: "pop.wav", volume: 0.25 },
  ...[12.35, 12.9, 13.45, 14.0].map((at) => ({ at: at - 0.02, file: "stamp.wav", volume: 0.3 })),
  { at: 10.7, file: "thud.wav", volume: 0.3 },
  { at: 30.4, file: "pop.wav", volume: 0.2 },
  { at: 40.37, file: "ding.wav", volume: 0.22 },
  { at: 43.85, file: "kaching.wav", volume: 0.22 },
  { at: 44.35, file: "whistle.wav", volume: 0.14 },
  { at: 56.6, file: "pop.wav", volume: 0.25 },
];

export const EiffelTower: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const endFade = interpolate(frame, [durationInFrames - 8, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "black" }}>
      {SHOTS.map((s, i) => {
        const from = Math.round(toVoice(s.start) * fps);
        const next = SHOTS[i + 1];
        const until = next ? Math.round(toVoice(next.start) * fps) + OVERLAP[next.tr] : durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={until - from} name={s.C.name}>
            <ShotWrap from={from} tr={s.tr} C={s.C} />
          </Sequence>
        );
      })}

      <Captions captions={captionsJson as Caption[]} variant="cartoon" placement="bottom" scale={0.36} combineWithinMs={700} />
      <AbsoluteFill style={{ background: "black", opacity: endFade }} />

      {/* the user's voiceover, untouched: full volume, normal speed */}
      <Audio src={staticFile("audio/eiffel-voiceover.mp3")} />
      {/* background music kept low under the voice */}
      <Audio src={staticFile("audio/eiffel-music.wav")} volume={0.1} />
      {SFX.map((s, i) => (
        <Sequence key={`sfx${i}`} from={Math.round(toVoice(s.at) * fps)} durationInFrames={Math.round(2.5 * fps)}>
          <Audio src={staticFile(`audio/sfx/${s.file}`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
