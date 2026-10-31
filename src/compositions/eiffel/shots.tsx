import { AbsoluteFill, Easing, interpolate, spring } from "remotion";
import { CameraRig } from "../../style/Camera";
import { HEAD_R, SHOULDER_L, SHOULDER_R } from "../../style/Character";
import { CAPTION_FONT } from "../../style/fonts";
import {
  CashStack,
  Chair,
  Cloud,
  Coin,
  EiffelTower,
  Envelope,
  Glow,
  Lightbulb,
  Paper,
  Sign,
  Stamp,
  Suitcase,
  textTex,
} from "../../style/props";
import { Line, Stick, ToonMat } from "../../style/toon";
import { rng } from "../../style/textures";
import { Dealer, Lustig, Parisian, Poisson } from "./cast";
import { HotelFacade, OfficeSet, ParisSet, ScrapyardSet, SEATS, SKY_DAY, SKY_GRAY, SKY_SUNSET, Stage, SuiteSet, TrainSet } from "./sets";

type V3 = [number, number, number];
export type ShotProps = { t: number };

const FPS = 30;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = Easing.inOut(Easing.cubic);

/** 0→1 between a and b (seconds), eased. */
const ramp = (t: number, a: number, b: number, easing = smooth) => interpolate(t, [a, b], [0, 1], { ...clamp, easing });
/** Keyframed scalar. */
const kf = (t: number, times: number[], values: number[]) => interpolate(t, times, values, { ...clamp, easing: smooth });
/** Keyframed vector. */
const kf3 = (t: number, times: number[], values: V3[]): V3 => [0, 1, 2].map((i) => kf(t, times, values.map((v) => v[i]))) as V3;
/** Springy pop-in starting at time `at`. */
const pop = (t: number, at: number, damping = 10) => (t < at ? 0 : spring({ frame: (t - at) * FPS, fps: FPS, config: { damping, stiffness: 180 } }));
/** Blink: eyes nearly closed for 0.1 s after each time. */
const blink = (t: number, times: number[]) => (times.some((b) => t >= b && t < b + 0.1) ? 0.08 : 1);
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** Shake offset that decays after `at`. */
const shake = (t: number, at: number, amp = 0.05, dur = 0.5) => (t < at || t > at + dur ? 0 : Math.sin(t * 70) * amp * (1 - (t - at) / dur));

/** Convert a world-space point into an arm offset for a character at `pos` rotated `ry`. */
const armTo = (world: V3, pos: V3, ry: number, side: "L" | "R"): V3 => {
  const dx = world[0] - pos[0];
  const dz = world[2] - pos[2];
  const c = Math.cos(-ry);
  const s = Math.sin(-ry);
  const bx = dx * c + dz * s;
  const bz = -dx * s + dz * c;
  const sh = side === "L" ? SHOULDER_L : SHOULDER_R;
  return [bx - sh[0], world[1] - pos[1] - sh[1], bz - sh[2]];
};

const Overlay: React.FC<{ text: string; sub?: string; opacity: number; top?: string; size?: number }> = ({ text, sub, opacity, top = "13%", size = 78 }) => (
  <AbsoluteFill style={{ alignItems: "center", paddingTop: top, opacity }}>
    <div
      style={{
        fontFamily: CAPTION_FONT,
        fontWeight: 900,
        fontSize: size,
        color: "#ffd84d",
        WebkitTextStroke: `${size * 0.16}px #111`,
        paintOrder: "stroke fill",
        letterSpacing: 1,
        textAlign: "center",
        lineHeight: 1.05,
        transform: `scale(${0.85 + 0.15 * opacity})`,
      }}
    >
      {text}
      {sub && <div style={{ fontSize: size * 0.5, color: "white", WebkitTextStroke: `${size * 0.1}px #111` }}>{sub}</div>}
    </div>
  </AbsoluteFill>
);

/* =================================================================== 1. A man sold the Eiffel Tower (0 – 4.45) */
export const S1Intro: React.FC<ShotProps> = ({ t }) => {
  const sold = pop(t, 0.42, 8);
  const point = ramp(t, 0.3, 0.7) * (1 - ramp(t, 1.6, 2.0));
  const shh = ramp(t, 2.85, 3.1);
  return (
    <Stage sky={SKY_DAY}>
      <CameraRig
        position={kf3(t, [0, 1.8, 4.6], [[0, 13, 9], [0.4, 1.95, 6.4], [0.2, 1.8, 5.2]])}
        target={kf3(t, [0, 1.8, 4.6], [[0, 17, -16], [0.05, 1.45, 1.5], [0.0, 1.5, 1.6]])}
        fov={42}
      />
      <ParisSet t={t} />
      <Lustig
        position={[-0.45, 0, 1.75]}
        rotationY={0.3}
        face={{
          mouth: shh > 0.5 ? "flat" : t < 1.6 ? "grin" : "smirk",
          eyeOpenL: t > 2.3 && t < 2.75 ? 0.08 : blink(t, [1.2, 3.9]),
          eyeOpenR: blink(t, [1.2, 3.9]),
          lookX: t < 1.6 ? 0.2 : 0.05,
          browL: 0.3,
          browR: 0.7,
        }}
        headRot={[0, 0.05, t > 2.3 && t < 2.75 ? -0.12 : 0]}
        armR={lerp3([0.18, -0.32, 0.12], [0.3, 0.5, -0.15], point)}
        armL={lerp3([-0.2, -0.32, 0.12], [0.25, 0.42, 0.47], shh)}
      />
      <Sign
        tex={textTex("sold", [{ text: "SOLD!", size: 130, color: "#c0182c" }], { bg: "#f7f0dc", border: "#c0182c" })}
        position={[0.75, 0, 1.55]}
        rotation={[0, -0.25, (1 - sold) * 0.4]}
        scale={Math.max(0.001, sold)}
      />
    </Stage>
  );
};

/* =================================================================== 2. 1925: rusting, costly, tear it down (4.45 – 11.6) */
export const S2Rust: React.FC<ShotProps> = ({ t }) => {
  const r = rng(5);
  const flakes = Array.from({ length: 30 }, () => ({ x: (r() - 0.5) * 6, z: -16 + (r() - 0.5) * 4, o: r() * 14, s: 0.08 + r() * 0.1 }));
  const coins = Array.from({ length: 9 }, () => ({ x: 0.7 + r() * 1.6, d: r() * 0.5, spin: r() * 6 }));
  const swing = interpolate(t, [9.95, 10.75, 11.6], [1.25, -0.25, 0.1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const pivot: V3 = [1.2, 10, -3.2];
  const ball: V3 = [pivot[0] + Math.sin(swing) * 8, pivot[1] - Math.cos(swing) * 8, pivot[2]];
  const hit = shake(t, 10.7, 0.06, 0.6);
  const shout = 0.6 + 0.4 * Math.abs(Math.sin(t * 9));
  const date = ramp(t, 5.05, 5.35) * (1 - ramp(t, 7.3, 7.6));
  return (
    <Stage sky={SKY_GRAY} overlay={<Overlay text="1925" sub="PARIS" opacity={date} />}>
      <CameraRig
        position={kf3(t, [4.45, 8.2, 8.95, 11.6], [[4, 1.0, 7], [2.0, 0.9, 5.5], [0.05, 1.75, 5.2], [0.0, 1.65 + hit, 4.2]])}
        target={kf3(t, [4.45, 8.2, 8.95, 11.6], [[0, 9, -16], [0, 7, -16], [0, 1.6, 0.6], [0, 1.6 + hit, 0.6]])}
        fov={42}
      />
      <ParisSet rusty t={t} />
      {flakes.map((f, i) => {
        const y = 18 - ((t * 2.2 + f.o) % 18);
        return (
          <mesh key={i} position={[f.x * (1 - y / 22), y, f.z]} rotation={[t * 3 + i, t * 2, 0]}>
            <boxGeometry args={[f.s, f.s, 0.02]} />
            <meshBasicMaterial color={i % 2 ? "#b5562a" : "#7a3a1a"} />
          </mesh>
        );
      })}
      {t > 7.55 &&
        t < 9.2 &&
        coins.map((c, i) => {
          const k = (t - 7.55 - c.d) / 1.1;
          if (k < 0) return null;
          return <Coin key={i} position={[c.x, 5.8 - k * k * 6.5, 2]} rotation={[t * c.spin, 0, t * 3]} scale={1.6} />;
        })}
      {/* angry Parisians */}
      <Parisian
        variant={0}
        position={[-0.95, 0, 0.75]}
        rotationY={0.35}
        face={{ mouth: "laugh", mouthOpen: shout * 0.7, browTiltL: -0.3, browTiltR: -0.3, lookX: 0.3 }}
        armL={[-0.05, 0.5, 0.15]}
        armR={[0.05, 0.5, 0.15]}
        props={
          <Sign
            tex={textTex("abas", [{ text: "À BAS", size: 80, color: "#c0182c" }, { text: "LA TOUR!", size: 80, color: "#1d2a3a" }], { bg: "#f7f0dc" })}
            post={0.6}
            w={1.0}
            h={0.55}
            position={[0, 1.0, 0.18]}
            scale={1}
          />
        }
      />
      <Parisian
        variant={1}
        position={[0.05, 0, 1.1]}
        rotationY={-0.1}
        face={{ mouth: "o", mouthOpen: shout, browTiltL: -0.35, browTiltR: -0.35, lookY: 0.4 }}
        headRot={[-0.25, 0, 0]}
        armR={[0.05, 0.55, -0.25]}
      />
      <Parisian
        variant={2}
        position={[0.95, 0, 0.7]}
        rotationY={-0.4}
        face={{ mouth: "laugh", mouthOpen: 1 - shout * 0.5, browTiltL: -0.3, browTiltR: -0.3, lookX: -0.3 }}
        armR={[0.1, 0.42 + Math.sin(t * 18) * 0.06, 0.25]}
        bounce={Math.abs(Math.sin(t * 9)) * 0.03}
      />
      {/* wrecking ball */}
      {t > 9.9 && (
        <>
          <Stick a={pivot} b={ball} r={0.05} color="#333" />
          <mesh position={ball}>
            <sphereGeometry args={[0.9, 28, 20]} />
            <ToonMat color="#3a3d44" />
            <Line t={0.04} />
          </mesh>
        </>
      )}
    </Stage>
  );
};

/* =================================================================== 3. Fake government letterhead (11.6 – 14.62) */
const HITS = [12.35, 12.9, 13.45, 14.0];
export const S3Letterhead: React.FC<ShotProps> = ({ t }) => {
  const f = Math.min(1, ...HITS.map((h) => interpolate(t, [h - 0.2, h, h + 0.22], [1, 0, 1], clamp)));
  const stampY = 0.9 + 0.3 * f;
  const stamped = HITS.filter((h) => t >= h).length;
  const lastHit = HITS[Math.max(0, stamped - 1)];
  const pos: V3 = [0, 0.22, 0];
  const stampAt: V3 = [0.15, stampY, 0.55];
  const look = ramp(t, 13.95, 14.25);
  return (
    <Stage sky="#120e1a">
      <CameraRig
        position={kf3(t, [11.6, 13.2, 14.62], [[0.38, 1.6, 1.45], [0.25, 1.85, 2.8], [0.05, 1.9, 3.4]])}
        target={kf3(t, [11.6, 13.2, 14.62], [[0.15, 0.95, 0.5], [0.1, 1.35, 0.3], [0, 1.5, 0]])}
        fov={42}
      />
      <OfficeSet day={false} />
      <Lustig
        position={pos}
        legs={false}
        lean={0.12 * (1 - look)}
        face={{
          lookY: interpolate(look, [0, 1], [-0.8, 0]),
          lookX: interpolate(look, [0, 1], [0.1, 0.1]),
          browTiltL: -0.2 * (1 - look),
          browTiltR: -0.2 * (1 - look),
          browR: look * 0.8,
          mouth: "smirk",
        }}
        headRot={[0.25 * (1 - look), 0, 0]}
        armR={armTo([stampAt[0], stampAt[1] + 0.27, stampAt[2]], pos, 0, "R")}
        armL={[0.0, -0.22, 0.5]}
      />
      {/* paper stack grows with every stamp */}
      <mesh position={[0.15, 0.9 + stamped * 0.004, 0.55]}>
        <boxGeometry args={[0.38, 0.01 + stamped * 0.008, 0.5]} />
        <meshToonMaterial color="#f7f0dc" />
      </mesh>
      <Paper position={[0.15, 0.91 + stamped * 0.008, 0.55]} seal={stamped > 0 ? pop(t, lastHit, 8) : 0} />
      <Paper position={[-0.35, 0.905, 0.62]} rotation={[0, 0.4, 0]} seal={1} />
      <Stamp position={stampAt} />
    </Stage>
  );
};

/* =================================================================== 4. Fancy hotel suite (14.62 – 16.62) */
export const S4Hotel: React.FC<ShotProps> = ({ t }) => {
  const k = ramp(t, 14.62, 15.9, Easing.linear);
  const pos: V3 = [interpolate(k, [0, 1], [-1.5, -0.3]), 0, interpolate(k, [0, 1], [1.6, 1.25])];
  const turn = ramp(t, 15.85, 16.15);
  const ry = interpolate(turn, [0, 1], [1.72, 0.35]);
  const tip = ramp(t, 16.05, 16.3);
  return (
    <Stage sky={SKY_DAY}>
      <CameraRig
        position={kf3(t, [14.62, 16.62], [[1.4, 0.55, 6.6], [0.7, 1.35, 4.9]])}
        target={kf3(t, [14.62, 16.62], [[-0.6, 3.0, -1], [-0.3, 1.55, 0.9]])}
        fov={42}
      />
      <HotelFacade />
      <Lustig
        position={pos}
        rotationY={ry}
        walk={turn < 0.5 ? t * FPS * 0.42 : undefined}
        face={{ mouth: "smirk", lookX: turn * 0.2, browR: 0.6, eyeOpenL: blink(t, [15.2]), eyeOpenR: blink(t, [15.2]) }}
        armL={[-0.05, -0.38, 0.06]}
        armR={lerp3([0.2, -0.32, 0.12 + Math.sin(t * FPS * 0.42) * 0.12 * (1 - turn)], [-0.08, 0.86, 0.15], tip)}
        props={<Suitcase position={[-0.3, 0.33, 0.06]} rotation={[0, Math.PI / 2, 0]} scale={0.8} />}
      />
    </Stage>
  );
};

/* =================================================================== 5. Five scrap dealers invited (16.62 – 19.7) */
export const S5Dealers: React.FC<ShotProps> = ({ t }) => {
  const door = ramp(t, 16.62, 17.0);
  const ends: V3[] = [
    [-1.15, 0, 1.9],
    [-0.35, 0, 2.3],
    [0.45, 0, 2.0],
    [-1.6, 0, 2.9],
    [0.25, 0, 3.05],
  ];
  const card = (
    <group position={[0.38, 1.0, 0.42]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={0.7}>
      <Paper seal={1} />
    </group>
  );
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [16.62, 19.7], [[0.35, 1.9, -1.4], [0.0, 1.75, -0.6]])}
        target={kf3(t, [16.62, 19.7], [[-1.2, 1.4, 4], [-0.45, 1.35, 2.2]])}
        fov={42}
      />
      <SuiteSet doorOpen={door} table={false} chairs={false} />
      {ends.map((end, i) => {
        const startT = 16.75 + i * 0.42;
        if (t < startT) return null;
        const k = ramp(t, startT, startT + 1.7, Easing.out(Easing.quad));
        const start: V3 = [-1.6, 0, 5.4];
        const p = lerp3(start, end, k);
        const ry = Math.PI + Math.atan2(end[0] - start[0], -(end[2] - start[2])) * (1 - k);
        const walking = k < 0.98;
        const face = { lookY: 0.15, mouth: "smile" as const, eyeOpenL: blink(t, [18.2 + i * 0.3]), eyeOpenR: blink(t, [18.2 + i * 0.3]) };
        const common = {
          position: p,
          rotationY: walking ? ry : Math.PI,
          walk: walking ? t * FPS * 0.42 + i : undefined,
          armR: [0.13, 0.02, 0.4] as V3,
          props: card,
          face,
        };
        return i === 4 ? <Poisson key={i} {...common} /> : <Dealer key={i} variant={i} {...common} />;
      })}
    </Stage>
  );
};

/* =================================================================== seated meeting helpers */
const seatPos = (s: readonly [number, number, number]): V3 => [s[0], 0, s[1]];
const LUSTIG_POS: V3 = [0, 0, -0.95];

type MeetingOpts = {
  t: number;
  dealerFace?: Parameters<typeof Dealer>[0]["face"];
  dealerLean?: number;
  hideNear?: boolean;
  hideRightEnd?: boolean;
  poisson?: React.ReactNode;
};
const SeatedDealers: React.FC<MeetingOpts> = ({ t, dealerFace, dealerLean = 0, hideNear, hideRightEnd, poisson }) => (
  <>
    <Dealer variant={0} position={seatPos(SEATS.leftEnd)} rotationY={SEATS.leftEnd[2]} legs={false} lean={dealerLean} face={{ eyeOpenL: blink(t, [20.4, 24.1]), eyeOpenR: blink(t, [20.4, 24.1]), ...dealerFace }} armL={[0.05, -0.18, 0.42]} armR={[-0.05, -0.18, 0.42]} />
    {!hideRightEnd && (
      <Dealer variant={1} position={seatPos(SEATS.rightEnd)} rotationY={SEATS.rightEnd[2]} legs={false} lean={dealerLean} face={{ eyeOpenL: blink(t, [21.0, 26.1]), eyeOpenR: blink(t, [21.0, 26.1]), ...dealerFace }} armL={[0.05, -0.18, 0.42]} armR={[-0.05, -0.18, 0.42]} />
    )}
    <Dealer variant={3} position={seatPos(SEATS.farL)} rotationY={SEATS.farL[2]} legs={false} lean={dealerLean} face={{ eyeOpenL: blink(t, [22.0, 27.0]), eyeOpenR: blink(t, [22.0, 27.0]), ...dealerFace }} armL={[0.05, -0.18, 0.42]} armR={[-0.05, -0.18, 0.42]} />
    {!hideNear && (
      <>
        <Dealer variant={2} position={seatPos(SEATS.nearL)} rotationY={SEATS.nearL[2]} legs={false} lean={dealerLean} face={dealerFace} armL={[0.05, -0.18, 0.42]} armR={[-0.05, -0.18, 0.42]} />
        {poisson ?? (
          <Poisson position={seatPos(SEATS.nearR)} rotationY={SEATS.nearR[2]} legs={false} lean={dealerLean} face={dealerFace} armL={[0.05, -0.18, 0.42]} armR={[-0.05, -0.18, 0.42]} />
        )}
      </>
    )}
  </>
);

/* =================================================================== 6. Secret meeting: "The city can't afford it" (19.7 – 23.4) */
export const S6Meeting: React.FC<ShotProps> = ({ t }) => {
  const whisper = ramp(t, 19.9, 20.25) * (1 - ramp(t, 22.3, 22.6));
  const lean = ramp(t, 21.5, 21.9) * (1 - ramp(t, 22.6, 23.0));
  const finger = ramp(t, 22.6, 22.85);
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [19.7, 23.4], [[0, 2.15, 3.6], [0, 1.95, 2.9]])}
        target={kf3(t, [19.7, 23.4], [[-0.2, 1.45, -0.9], [-0.1, 1.55, -0.9]])}
        fov={42}
      />
      <SuiteSet />
      <Lustig
        position={LUSTIG_POS}
        lean={whisper * 0.12}
        face={{
          lookX: whisper > 0.5 && t < 21.4 ? Math.sin(t * 7) * 0.6 : 0,
          eyeOpenL: 1 - whisper * 0.35,
          eyeOpenR: 1 - whisper * 0.35,
          mouth: finger > 0.5 ? "grin" : whisper > 0.5 ? "o" : "smirk",
          mouthOpen: 0.4,
          browL: finger * 0.8,
          browR: finger * 0.8 + 0.2,
        }}
        armR={lerp3(lerp3([0.18, -0.3, 0.15], [-0.17, 0.42, 0.45], whisper), [0.06, 0.62, 0.18], finger)}
        armL={[-0.05, -0.15, 0.45]}
      />
      <SeatedDealers t={t} dealerLean={lean * 0.25} dealerFace={{ lookY: 0.15, eyeScale: 1 + lean * 0.2, mouth: lean > 0.5 ? "o" : "flat", mouthOpen: 0.4 }} />
    </Stage>
  );
};

/* =================================================================== 7. "Seven thousand tons of iron" (23.4 – 25.55) */
export const S7Bid: React.FC<ShotProps> = ({ t }) => {
  const spread = ramp(t, 23.45, 23.8);
  const sparkle = 0.6 + 0.4 * Math.sin(t * 10);
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [23.4, 25.55], [[0.95, 1.12, 1.75], [0.3, 1.2, 1.35]])}
        target={kf3(t, [23.4, 25.55], [[0, 1.3, -0.5], [0, 1.35, -0.6]])}
        fov={42}
      />
      <SuiteSet />
      <EiffelTower position={[0, 0.88, 0]} scale={0.075} rotationY={t * 0.4} />
      <Glow color="rgba(255,220,120,0.6)" size={1.2 * sparkle} position={[0, 1.3, 0.2]} />
      <Lustig
        position={LUSTIG_POS}
        face={{ mouth: "grin", browL: 0.8, browR: 1, eyeScale: 1.1, lookY: -0.2 }}
        armL={lerp3([-0.18, -0.3, 0.15], [-0.32, 0.08, 0.38], spread)}
        armR={lerp3([0.18, -0.3, 0.15], [0.32, 0.08, 0.38], spread)}
      />
      <SeatedDealers t={t} hideNear dealerFace={{ heartEyes: 0, eyeScale: 1.25, mouth: "o", mouthOpen: 0.5, lookX: 0.2 }} />
    </Stage>
  );
};

/* =================================================================== 8. "Tell no one, or there'll be riots" (25.55 – 28.2) */
export const S8Riots: React.FC<ShotProps> = ({ t }) => {
  const shh = ramp(t, 25.6, 25.85);
  const pan = ramp(t, 26.6, 26.95, Easing.inOut(Easing.quad));
  const fear = ramp(t, 26.9, 27.2);
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={lerp3([0.05, 1.75, 0.85], [-0.55, 1.62, 0.75], pan)}
        target={lerp3([0, 1.5, -0.95], [-1.95, 1.48, -0.05], pan)}
        fov={42}
      />
      <SuiteSet />
      <Lustig
        position={LUSTIG_POS}
        lean={0.12}
        face={{ mouth: "flat", eyeOpenL: 0.6, eyeOpenR: 0.6, browTiltL: -0.25, browTiltR: -0.25, lookX: Math.sin(t * 5) * 0.3 }}
        armR={lerp3([0.18, -0.3, 0.15], [-0.25, 0.4, 0.47], shh)}
      />
      <SeatedDealers
        t={t}
        hideNear
        dealerLean={-fear * 0.1}
        dealerFace={{ eyeScale: 1 + fear * 0.35, browTiltL: fear * 0.35, browTiltR: fear * 0.35, browL: fear, browR: fear, mouth: fear > 0.5 ? "o" : "flat", mouthOpen: 0.5 + fear * 0.4, sweat: fear }}
      />
    </Stage>
  );
};

/* =================================================================== 9. André Poisson wanted it badly (28.2 – 32.0) */
const POISSON_SEAT = seatPos(SEATS.nearR);
export const S9Poisson: React.FC<ShotProps> = ({ t }) => {
  const love = pop(t, 30.4, 9);
  const name = ramp(t, 29.2, 29.45) * (1 - ramp(t, 31.6, 31.9));
  return (
    <Stage sky="#2a1a14" overlay={<Overlay text="ANDRÉ POISSON" sub="scrap dealer" opacity={name} top="14%" size={84} />}>
      <CameraRig
        position={kf3(t, [28.2, 32.0], [[0.55, 1.78, -0.7], [0.82, 1.62, 0.0]])}
        target={kf3(t, [28.2, 32.0], [[0.8, 1.45, 1.05], [0.85, 1.52, 1.05]])}
        fov={42}
      />
      <SuiteSet />
      <SeatedDealers
        t={t}
        hideRightEnd
        poisson={
          <Poisson
            position={POISSON_SEAT}
            rotationY={Math.PI}
            legs={false}
            bounce={love * Math.abs(Math.sin(t * 10)) * 0.04}
            face={{
              heartEyes: love * 1.1,
              mouth: love > 0.3 ? "laugh" : "smile",
              mouthOpen: 0.7,
              blush: love > 0.3,
              browL: 0.5,
              browR: 0.5,
              eyeOpenL: blink(t, [29.6]),
              eyeOpenR: blink(t, [29.6]),
            }}
            armL={lerp3([0.05, -0.18, 0.42], [0.18, 0.08, 0.4], love)}
            armR={lerp3([-0.05, -0.18, 0.42], [-0.18, 0.08, 0.4], love)}
          />
        }
      />
    </Stage>
  );
};

/* =================================================================== 10. But something felt off (32.0 – 34.1) */
export const S10FeltOff: React.FC<ShotProps> = ({ t }) => {
  const sus = ramp(t, 32.25, 32.6);
  const hearts = 1 - ramp(t, 32.0, 32.25);
  return (
    <Stage sky="#1a1010" vignette={0.6}>
      <CameraRig
        position={kf3(t, [32.0, 34.1], [[0.85, 1.75, -1.05], [0.85, 1.7, -0.8]])}
        target={[0.85, 1.52, 1.05]}
        roll={kf(t, [32.0, 33.0], [0, 0.13])}
        fov={42}
      />
      <SuiteSet dim={0.7} />
      <Poisson
        position={POISSON_SEAT}
        rotationY={Math.PI}
        legs={false}
        face={{
          heartEyes: hearts > 0.05 ? hearts * 1.1 : 0,
          eyeOpenL: 1 - sus * 0.1,
          eyeOpenR: 1 - sus * 0.6,
          browL: sus * 0.8,
          browR: -sus * 0.4,
          browTiltL: -0.1 * sus,
          browTiltR: 0.3 * sus,
          mouth: sus > 0.5 ? "flat" : "smile",
          lookX: -sus * 0.35,
          sweat: ramp(t, 33.3, 33.5),
        }}
        headRot={[0, 0, sus * 0.08]}
        armL={[0.05, -0.18, 0.42]}
        armR={lerp3([-0.05, -0.18, 0.42], [-0.18, 0.35, 0.4], sus)}
      />
    </Stage>
  );
};

/* =================================================================== 11. Lustig leans in and confesses (34.1 – 39.2) */
export const S11Confess: React.FC<ShotProps> = ({ t }) => {
  const lean = ramp(t, 34.4, 34.9);
  const sad = ramp(t, 36.2, 36.45) * (1 - ramp(t, 37.85, 38.05));
  const bribe = ramp(t, 37.9, 38.15);
  const rub = Math.sin(t * 38) * 0.025 * bribe;
  const shock = ramp(t, 38.75, 38.95);
  const lPos: V3 = [0.55, 0, -0.85];
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [34.1, 39.2], [[2.1, 1.8, 2.5], [1.95, 1.75, 2.2]])}
        target={kf3(t, [34.1, 39.2], [[0.55, 1.45, -0.8], [0.55, 1.5, -0.8]])}
        fov={42}
      />
      <SuiteSet />
      <Lustig
        position={lPos}
        rotationY={0.25}
        lean={lean * 0.15}
        face={{
          mouth: bribe > 0.5 ? "smirk" : sad > 0.5 ? "flat" : "smirk",
          browTiltL: sad * 0.35 - bribe * 0.05,
          browTiltR: sad * 0.35 + bribe * 0.15,
          browL: sad * 0.5,
          browR: sad * 0.5 + bribe * 0.8,
          lookY: -sad * 0.5,
          lookX: bribe * -0.4,
          eyeOpenL: 1 - bribe * 0.3,
          eyeOpenR: 1 - bribe * 0.45,
        }}
        armL={lerp3([-0.18, -0.3, 0.15], [-0.25, -0.12, 0.38], sad)}
        armR={lerp3(lerp3([0.18, -0.3, 0.15], [0.25, -0.12, 0.38], sad), [0.0 + rub, 0.05, 0.52], bribe)}
        bounce={sad * Math.max(0, Math.sin((t - 36.2) * 6)) * 0.03}
      />
      <Poisson
        position={POISSON_SEAT}
        rotationY={Math.PI - 0.25}
        legs={false}
        face={{
          eyeOpenL: 0.9,
          eyeOpenR: 0.55 + shock * 0.45,
          eyeScale: 1 + shock * 0.3,
          browL: 0.6 + shock * 0.4,
          browR: -0.2 + shock * 1.2,
          browTiltR: 0.25 * (1 - shock),
          mouth: shock > 0.5 ? "o" : "flat",
          mouthOpen: 0.6,
          lookX: 0.25,
        }}
        armL={[0.05, -0.18, 0.42]}
        armR={[-0.05, -0.18, 0.42]}
      />
      <SeatedDealers t={t} hideNear hideRightEnd />
    </Stage>
  );
};

/* =================================================================== 12. Only a real official would ask for a bribe (39.2 – 43.1) */
export const S12Realize: React.FC<ShotProps> = ({ t }) => {
  const think = ramp(t, 39.3, 39.6) * (1 - ramp(t, 40.3, 40.5));
  const bulb = pop(t, 40.37, 8);
  const happy = ramp(t, 41.1, 41.3);
  const nod = t > 41.2 && t < 42.9 ? Math.sin((t - 41.2) * 9) * 0.12 : 0;
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [39.2, 43.1], [[0.85, 2.05, -1.45], [0.85, 2.0, -1.1]])}
        target={[0.85, 1.95, 1.05]}
        fov={42}
      />
      <SuiteSet />
      <Poisson
        position={POISSON_SEAT}
        rotationY={Math.PI}
        legs={false}
        headRot={[nod, 0, 0]}
        face={{
          lookY: think * 0.5,
          lookX: think * 0.3,
          mouth: happy > 0.5 ? "laugh" : bulb > 0.3 ? "o" : "flat",
          mouthOpen: 0.6,
          eyeScale: 1 + bulb * 0.25 * (1 - happy),
          happyEyes: happy > 0.5,
          browL: 0.3 + bulb * 0.6,
          browR: 0.3 + bulb * 0.6,
          blush: happy > 0.5,
        }}
        armL={[0.05, -0.18, 0.42]}
        armR={lerp3([-0.05, -0.18, 0.42], [-0.2, 0.33, 0.43], think)}
        props={bulb > 0.001 ? <Lightbulb position={[0, 1.5 + HEAD_R + 0.55, 0]} scale={bulb} /> : null}
      />
    </Stage>
  );
};

/* =================================================================== 13. Poisson paid (43.1 – 44.3) */
export const S13Paid: React.FC<ShotProps> = ({ t }) => {
  const slide = ramp(t, 43.3, 43.85);
  const grab = ramp(t, 43.85, 44.25);
  const env: V3 = lerp3(lerp3([0.75, 0.9, 0.45], [0.35, 0.9, -0.35], slide), [0.35, 1.2, -0.6], grab);
  const lPos: V3 = [0.25, 0, -0.95];
  const pArm = slide < 1 ? armTo([env[0] + 0.05, env[1] + 0.05, env[2] + 0.1], POISSON_SEAT, Math.PI, "R") : lerp3(armTo([0.35, 0.95, -0.25], POISSON_SEAT, Math.PI, "R"), [-0.05, -0.18, 0.42], grab);
  const lArm = slide > 0.85 ? armTo([env[0], env[1] + 0.05, env[2] - 0.05], lPos, 0, "R") : ([0.18, -0.3, 0.15] as V3);
  return (
    <Stage sky="#2a1a14">
      <CameraRig
        position={kf3(t, [43.1, 44.3], [[2.8, 2.3, 0.6], [2.6, 2.25, 0.4]])}
        target={[0.45, 1.3, -0.3]}
        fov={42}
      />
      <SuiteSet />
      <Lustig
        position={lPos}
        face={{ mouth: "grin", happyEyes: grab > 0.4, lookY: -0.5, browL: 0.7, browR: 0.9 }}
        armR={lArm}
      />
      <Poisson position={POISSON_SEAT} rotationY={Math.PI} legs={false} face={{ mouth: "smile", lookY: -0.4 }} armR={pArm} armL={[0.05, -0.18, 0.42]} />
      <Envelope position={env} rotation={[0, 0.3, 0]} />
      <CashStack position={[0.95, 0.88, 0.25]} n={2} />
    </Stage>
  );
};

/* =================================================================== 14. Train out of Paris (44.3 – 47.9) */
export const S14Train: React.FC<ShotProps> = ({ t }) => {
  const hug = ramp(t, 46.85, 47.1);
  return (
    <Stage sky={SKY_SUNSET}>
      <CameraRig
        position={kf3(t, [44.3, 46.5, 47.9], [[0.7, 2.3, 7.8], [0.35, 1.95, 5.4], [0.3, 1.8, 3.8]])}
        target={kf3(t, [44.3, 46.5, 47.9], [[-0.2, 1.75, 0], [0.15, 1.6, 0], [0.3, 1.5, 0]])}
        fov={42}
      />
      <TrainSet t={t - 44.3}>
        <Lustig
          position={[0.3, 0.12, -0.15]}
          rotationY={0.2}
          legs={false}
          bounce={Math.abs(Math.sin(t * 6)) * 0.02}
          face={{ mouth: "laugh", mouthOpen: 0.6 + 0.2 * Math.sin(t * 8), happyEyes: Math.sin(t * 2.2) > -0.3, browL: 0.6, browR: 0.6, blush: true }}
          armL={lerp3([0.02, 0.08, 0.45], [0.15, 0.2, 0.42], hug)}
          armR={lerp3([-0.02, 0.08, 0.45], [-0.15, 0.2, 0.42], hug)}
          props={<Suitcase position={[0, 1.08, 0.42]} open={1} scale={1.1} />}
        />
      </TrainSet>
      <EiffelTower position={[2 + (t - 44.3) * 0.4, -0.6, -60 - (t - 44.3) * 7]} scale={1.6} />
    </Stage>
  );
};

/* =================================================================== 15. He waited for the police… they never came (47.9 – 51.0) */
export const S15Waited: React.FC<ShotProps> = ({ t }) => {
  const peek = ramp(t, 48.1, 48.35) * (1 - ramp(t, 49.75, 49.95));
  const lower = ramp(t, 49.9, 50.25);
  const shrug = ramp(t, 50.2, 50.45);
  const pan = ramp(t, 48.5, 49.0) * (1 - ramp(t, 49.4, 49.85));
  const hours = 3 + ramp(t, 48.1, 49.8, Easing.inOut(Easing.quad)) * 7;
  const lPos: V3 = [0.45, 0, 0.3];
  const paperY = 1.22 - lower * 0.35;
  return (
    <Stage sky="#f2e6cc">
      <CameraRig
        position={kf3(t, [47.9, 51.0], [[0.25, 1.75, 4.3], [0.4, 1.6, 3.3]])}
        target={lerp3(kf3(t, [47.9, 51.0], [[0.0, 1.5, 0], [0.4, 1.4, 0.3]]), [-1.7, 1.4, 0.4], pan)}
        fov={42}
      />
      <OfficeSet day clockHours={hours} desk={false} />
      <Chair position={[lPos[0], 0, lPos[2] - 0.05]} rotationY={-0.25} color="#2f5a4a" />
      <Lustig
        position={[lPos[0], 0.02, lPos[2]]}
        rotationY={-0.25}
        face={{
          lookX: peek * -0.75,
          eyeOpenL: 1 - peek * 0.3,
          eyeOpenR: 1 - peek * 0.3,
          browTiltL: peek * 0.2,
          browTiltR: peek * 0.2,
          mouth: shrug > 0.5 ? "smirk" : "flat",
          browR: shrug * 0.8,
          sweat: peek * 0.8,
        }}
        armL={lerp3([0.02, paperY - 0.98, 0.5], [-0.3, 0.05, 0.35], shrug)}
        armR={lerp3([-0.02, paperY - 0.98, 0.5], [0.3, 0.05, 0.35], shrug)}
        props={
          shrug < 0.5 ? (
            <mesh position={[0, paperY, 0.52]}>
              <planeGeometry args={[0.75, 0.52]} />
              <meshToonMaterial
                map={textTex(
                  "gazette",
                  [
                    { text: "THE DAILY", size: 40 },
                    { text: "GAZETTE", size: 70 },
                    { text: "▬▬▬  ▬▬▬▬  ▬▬", size: 30, color: "#888" },
                    { text: "▬▬▬▬  ▬▬  ▬▬▬▬", size: 30, color: "#888" },
                  ],
                  { w: 512, h: 360, bg: "#ede6d6" },
                )}
              />
            </mesh>
          ) : null
        }
      />
    </Stage>
  );
};

/* =================================================================== 16. Poisson too embarrassed (51.0 – 54.2) */
export const S16Embarrassed: React.FC<ShotProps> = ({ t }) => {
  const red = ramp(t, 51.15, 51.6);
  const peek = ramp(t, 53.1, 53.35);
  const shakeHead = t > 53.4 ? Math.sin((t - 53.4) * 12) * 0.12 : 0;
  const skin = `#${[0xf6, 0xf3, 0xec].map((c, i) => Math.round(c + ([0xff, 0x8f, 0x8f][i] - c) * red).toString(16).padStart(2, "0")).join("")}`;
  const drops = Array.from({ length: 8 }, (_, i) => ((t * 2.2 + i / 8) % 1 + 1) % 1);
  return (
    <Stage sky={SKY_GRAY}>
      <CameraRig
        position={kf3(t, [51.0, 54.2], [[0, 1.95, 4.6], [0.15, 1.75, 3.2]])}
        target={[0.25, 1.6, 0.5]}
        fov={42}
      />
      <ScrapyardSet />
      <Poisson
        position={[0.3, 0, 0.6]}
        rotationY={-0.15}
        hatDown={1}
        headRot={[0.12, shakeHead, 0]}
        face={{ skin, eyeOpenL: 0.12 + peek * 0.5, eyeOpenR: 0.12 + peek * 0.5, browTiltL: 0.35, browTiltR: 0.35, mouth: "flat", sweat: red, lookX: peek * 0.3 }}
        armL={lerp3([0.17, 0.48, 0.44], [0.0, 0.38, 0.44], peek)}
        armR={lerp3([-0.17, 0.48, 0.44], [0.0, 0.38, 0.44], peek)}
        props={
          <group position={[0, 2.75, 0]}>
            <Cloud position={[0, 0, 0]} scale={0.22} color="#8a909c" />
            {drops.map((k, i) => (
              <Stick key={i} a={[-0.3 + i * 0.085, -0.15 - k * 0.8, 0]} b={[-0.3 + i * 0.085, -0.25 - k * 0.8, 0]} r={0.012} color="#5fa8e8" />
            ))}
          </group>
        }
      />
    </Stage>
  );
};

/* =================================================================== 17. A month later… sell it again (54.2 – 58.32) */
export const S17Return: React.FC<ShotProps> = ({ t }) => {
  const k = ramp(t, 54.35, 55.9, Easing.linear);
  const walking = k < 1;
  const pos: V3 = [interpolate(k, [0, 1], [2.6, 0.25]), 0, interpolate(k, [0, 1], [2.3, 1.75])];
  const face = ramp(t, 55.85, 56.15);
  const sign = pop(t, 56.6, 8);
  const tip = ramp(t, 57.0, 57.25);
  const card = ramp(t, 54.3, 54.6) * (1 - ramp(t, 56.0, 56.3));
  return (
    <Stage sky={SKY_DAY} overlay={<Overlay text="ONE MONTH LATER…" opacity={card} top="13%" size={70} />}>
      <CameraRig
        position={kf3(t, [54.2, 56.4, 57.35, 58.32], [[1.6, 1.75, 6.0], [0.35, 1.75, 4.9], [0.25, 1.75, 4.6], [0.1, 3.6, 7.2]])}
        target={kf3(t, [54.2, 56.4, 57.35, 58.32], [[0.8, 1.45, 1.6], [0.05, 1.45, 1.6], [0.0, 1.5, 1.6], [0, 8, -16]])}
        fov={42}
      />
      <ParisSet t={t} />
      <Lustig
        position={pos}
        rotationY={interpolate(face, [0, 1], [-1.85, 0.15])}
        walk={walking ? t * FPS * 0.42 : undefined}
        face={{
          mouth: "grin",
          eyeOpenL: t > 57.0 && t < 57.6 ? 0.08 : blink(t, [55.3]),
          eyeOpenR: blink(t, [55.3]),
          browR: 0.8,
          browL: 0.3,
        }}
        armL={[-0.05, -0.38, 0.06]}
        armR={lerp3([0.2, -0.32, 0.12 + (walking ? Math.sin(t * FPS * 0.42) * 0.12 : 0)], [-0.08, 0.86, 0.15], tip)}
        props={<Suitcase position={[-0.3, 0.33, 0.06]} rotation={[0, Math.PI / 2, 0]} scale={0.8} />}
      />
      <Sign
        tex={textTex("forsale", [{ text: "FOR SALE", size: 100, color: "#c0182c" }, { text: "(again)", size: 56, color: "#1d2a3a", weight: "italic bold" }], { bg: "#f7f0dc", border: "#c0182c" })}
        position={[-0.65, 0, 1.55]}
        rotation={[0, 0.25, (1 - sign) * -0.4]}
        scale={Math.max(0.001, sign)}
      />
    </Stage>
  );
};
