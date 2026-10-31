import * as THREE from "three";
import { idleBlink, useSceneTime } from "./time";
import { INK, Ink, Line, Stick, ToonMat } from "./toon";

type V3 = [number, number, number];

export type Face = {
  eyeOpenL?: number;
  eyeOpenR?: number;
  eyeScale?: number;
  happyEyes?: boolean;
  lookX?: number;
  lookY?: number;
  browL?: number; // raise: -1 (down) .. 1 (up)
  browR?: number;
  browTiltL?: number; // radians; + = inner end up (worried/sad), - = inner end down (angry)
  browTiltR?: number;
  mouth?: "smile" | "flat" | "laugh" | "o" | "smirk" | "grin";
  mouthOpen?: number;
  mustache?: string;
  blush?: boolean;
  sweat?: number; // 0..1 visibility
  skin?: string; // head color override (e.g. blushing red)
  glasses?: string; // round glasses frame color
  heartEyes?: number; // 0..1 scale of heart-shaped eyes (replaces eyes)
};

let heartGeo: THREE.ShapeGeometry | null = null;
const heartGeometry = () => {
  if (heartGeo) return heartGeo;
  const h = new THREE.Shape();
  h.moveTo(5, 5);
  h.bezierCurveTo(5, 5, 4, 0, 0, 0);
  h.bezierCurveTo(-6, 0, -6, 7, -6, 7);
  h.bezierCurveTo(-6, 11, -3, 15.4, 5, 19);
  h.bezierCurveTo(12, 15.4, 16, 11, 16, 7);
  h.bezierCurveTo(16, 7, 16, 0, 10, 0);
  h.bezierCurveTo(7, 0, 5, 5, 5, 5);
  heartGeo = new THREE.ShapeGeometry(h, 16);
  heartGeo.center();
  heartGeo.rotateZ(Math.PI);
  heartGeo.scale(0.0075, 0.0075, 1);
  return heartGeo;
};

export const HEAD_R = 0.48;

/** Places children on the head surface at longitude theta / latitude phi, facing outward. */
const OnHead: React.FC<{ theta: number; phi: number; lift?: number; children: React.ReactNode }> = ({
  theta,
  phi,
  lift = 0,
  children,
}) => (
  <group rotation={new THREE.Euler(-phi, theta, 0, "YXZ")}>
    <group position={[0, 0, HEAD_R + lift]}>{children}</group>
  </group>
);

export const Head: React.FC<{ face: Face; hat?: React.ReactNode }> = ({ face, hat }) => {
  const {
    eyeOpenL = 1,
    eyeOpenR = 1,
    eyeScale = 1,
    happyEyes,
    lookX = 0,
    lookY = 0,
    browL = 0,
    browR = 0,
    browTiltL = 0,
    browTiltR = 0,
    mouth = "smile",
    mouthOpen = 1,
    mustache,
    blush,
    sweat = 0,
    skin = "#f6f3ec",
    glasses,
    heartEyes = 0,
  } = face;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[HEAD_R, 48, 32]} />
        <ToonMat color={skin} />
        <Line t={0.032} />
      </mesh>

      {/* eyes */}
      {([-1, 1] as const).map((s) => {
        const open = s < 0 ? eyeOpenL : eyeOpenR;
        return (
          <OnHead key={`e${s}`} theta={s * 0.25 + lookX * 0.12} phi={0.06 + lookY * 0.1}>
            {heartEyes > 0 ? (
              <mesh geometry={heartGeometry()} scale={[heartEyes, heartEyes, 1]} position={[0, 0, 0.012]}>
                <meshBasicMaterial color="#e8283c" side={THREE.DoubleSide} />
              </mesh>
            ) : happyEyes ? (
              <mesh position={[0, -0.02, 0.008]}>
                <torusGeometry args={[0.055, 0.017, 8, 24, Math.PI]} />
                <Ink />
              </mesh>
            ) : (
              <group>
                <mesh scale={[0.058 * eyeScale, 0.088 * eyeScale * Math.max(open, 0.07), 0.025]}>
                  <sphereGeometry args={[1, 20, 14]} />
                  <Ink />
                </mesh>
                {open > 0.35 && (
                  <mesh position={[0.018 * eyeScale, 0.03 * eyeScale * open, 0.026]}>
                    <circleGeometry args={[0.014 * eyeScale, 12]} />
                    <meshBasicMaterial color="#ffffff" />
                  </mesh>
                )}
              </group>
            )}
          </OnHead>
        );
      })}

      {/* brows */}
      {([-1, 1] as const).map((s) => {
        const raise = s < 0 ? browL : browR;
        const tilt = s < 0 ? browTiltL : browTiltR;
        return (
          <OnHead key={`b${s}`} theta={s * 0.26} phi={0.29 + raise * 0.07} lift={0.006}>
            <mesh rotation={[0, 0, Math.PI / 2 - s * tilt]}>
              <capsuleGeometry args={[0.021, 0.1, 4, 10]} />
              <Ink />
            </mesh>
          </OnHead>
        );
      })}

      {/* mouth */}
      <OnHead theta={0} phi={-0.22} lift={0.006}>
        {mouth === "smile" && (
          <mesh rotation={[0, 0, Math.PI]} position={[0, 0.03, 0]}>
            <torusGeometry args={[0.06, 0.014, 8, 24, Math.PI]} />
            <Ink />
          </mesh>
        )}
        {mouth === "smirk" && (
          <mesh rotation={[0, 0, Math.PI + 0.35]} position={[0.02, 0.03, 0]}>
            <torusGeometry args={[0.05, 0.013, 8, 24, Math.PI * 0.7]} />
            <Ink />
          </mesh>
        )}
        {mouth === "flat" && (
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.013, 0.07, 4, 8]} />
            <Ink />
          </mesh>
        )}
        {mouth === "o" && (
          <mesh scale={[0.04, 0.055 * mouthOpen, 0.02]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#3a0d0d" />
          </mesh>
        )}
        {(mouth === "laugh" || mouth === "grin") && (
          <group position={[0, 0.03, 0]} scale={[1, mouth === "grin" ? 0.55 : mouthOpen, 1]}>
            <mesh rotation={[0, 0, Math.PI]}>
              <circleGeometry args={[0.11, 32, 0, Math.PI]} />
              <meshBasicMaterial color="#5c1416" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.075, 0.002]} scale={[0.055, 0.03, 1]}>
              <circleGeometry args={[1, 24]} />
              <meshBasicMaterial color="#ee6f7c" />
            </mesh>
            <mesh position={[0, -0.012, 0.003]} scale={[1, 0.25, 1]} rotation={[0, 0, Math.PI]}>
              <circleGeometry args={[0.1, 24, 0, Math.PI]} />
              <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.11, 0.012, 6, 32, Math.PI]} />
              <Ink />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[0.012, 0.22, 4, 8]} />
              <Ink />
            </mesh>
          </group>
        )}
      </OnHead>

      {mustache &&
        ([-1, 1] as const).map((s) => (
          <OnHead key={`m${s}`} theta={s * 0.085} phi={-0.1} lift={0.01}>
            <mesh rotation={[0, 0, s * 0.35]} scale={[0.075, 0.032, 0.02]}>
              <sphereGeometry args={[1, 16, 10]} />
              <ToonMat color={mustache} />
              <Line t={0.008} />
            </mesh>
          </OnHead>
        ))}

      {blush &&
        ([-1, 1] as const).map((s) => (
          <OnHead key={`c${s}`} theta={s * 0.45} phi={-0.1} lift={0.004}>
            <mesh scale={[0.06, 0.035, 1]}>
              <circleGeometry args={[1, 20]} />
              <meshBasicMaterial color="#ff8fa0" transparent opacity={0.55} />
            </mesh>
          </OnHead>
        ))}

      {sweat > 0 && (
        <OnHead theta={0.62} phi={0.3} lift={0.03}>
          <mesh scale={[0.04 * sweat, 0.06 * sweat, 0.02]} position={[0, -0.04 * (1 - sweat), 0]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#8fd0ff" />
          </mesh>
        </OnHead>
      )}

      {glasses &&
        ([-1, 1] as const).map((s) => (
          <OnHead key={`g${s}`} theta={s * 0.25} phi={0.06} lift={0.03}>
            <mesh>
              <torusGeometry args={[0.088, 0.013, 8, 28]} />
              <meshBasicMaterial color={glasses} />
            </mesh>
            <mesh position={[0, 0, -0.005]}>
              <circleGeometry args={[0.085, 24]} />
              <meshBasicMaterial color="#cfe8ff" transparent opacity={0.25} />
            </mesh>
          </OnHead>
        ))}
      {glasses && (
        <OnHead theta={0} phi={0.08} lift={0.035}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.01, 0.06, 4, 6]} />
            <meshBasicMaterial color={glasses} />
          </mesh>
        </OnHead>
      )}

      {hat}
    </group>
  );
};

export type CharacterProps = {
  position?: V3;
  rotationY?: number;
  face: Face;
  hat?: React.ReactNode;
  outfit: { color: string; map?: THREE.Texture; details?: React.ReactNode };
  /** hand positions relative to each shoulder */
  armL?: V3;
  armR?: V3;
  headRot?: V3;
  lean?: number;
  bounce?: number;
  legs?: boolean;
  props?: React.ReactNode; // in body space
  /** walk-cycle phase in radians — use walkPhase(distance) so feet never slide; omit when standing */
  walk?: number;
  /** objects held in the left / right hand (positioned relative to the hand, follow arm swing) */
  holdL?: React.ReactNode;
  holdR?: React.ReactNode;
  /** lip movement driven by the narration loudness (for quoted lines) */
  talk?: boolean;
  /** varies idle timing between characters */
  seed?: number;
  /** turn off idle breathing / sway / auto-blink (rarely needed) */
  still?: boolean;
};

const SHOULDER_Y = 0.98;
export const SHOULDER_L: V3 = [-0.25, SHOULDER_Y, 0];
export const SHOULDER_R: V3 = [0.25, SHOULDER_Y, 0];
/** Body-space hand position for a shoulder + arm offset (use to attach props to hands). */
export const handPos = (shoulder: V3, arm: V3): V3 => [shoulder[0] + arm[0], shoulder[1] + arm[1], shoulder[2] + arm[2]];

const ARM_LEN = 0.44; // upper + lower arm

/** Two-segment arm with a natural elbow bend (elbow pushed outward/back/down when the hand comes closer). */
const Arm: React.FC<{ shoulder: V3; hand: V3; side: -1 | 1 }> = ({ shoulder, hand, side }) => {
  const s = new THREE.Vector3(...shoulder);
  const h = new THREE.Vector3(...hand);
  const d = h.clone().sub(s);
  const dist = d.length();
  const mid = s.clone().add(h).multiplyScalar(0.5);
  const bend = Math.sqrt(Math.max(0, (ARM_LEN / 2) ** 2 - (dist / 2) ** 2));
  if (bend > 0.001) {
    const out = new THREE.Vector3(side, -0.35, -0.45).normalize();
    const dir = d.clone().normalize();
    out.sub(dir.multiplyScalar(out.dot(dir))).normalize();
    mid.add(out.multiplyScalar(bend));
  }
  const e: V3 = [mid.x, mid.y, mid.z];
  return (
    <>
      <Stick a={shoulder} b={e} r={0.03} />
      <Stick a={e} b={hand} r={0.03} />
      <mesh position={e}>
        <sphereGeometry args={[0.03, 10, 8]} />
        <Ink />
      </mesh>
    </>
  );
};

/** Big round white head, small bean body, black stick limbs with round hands. */
export const Character: React.FC<CharacterProps> = ({
  position = [0, 0, 0],
  rotationY = 0,
  face,
  hat,
  outfit,
  armL = [-0.2, -0.32, 0.12],
  armR = [0.2, -0.32, 0.12],
  headRot = [0, 0, 0],
  lean = 0,
  bounce = 0,
  legs = true,
  props,
  walk,
  holdL,
  holdR,
  talk,
  seed,
  still,
}) => {
  const time = useSceneTime();
  const t = time?.t ?? 0;
  const sd = seed ?? Math.abs(position[0] * 7.3 + position[2] * 3.1) % 10;
  const idle = time && !still ? 1 : 0;

  // idle life: breathing, gentle head sway, auto-blink
  const breath = idle * Math.sin((t + sd) * ((2 * Math.PI) / 3.4));
  const sway = idle * (walk === undefined ? 1 : 0.4);
  const head: V3 = [
    headRot[0] + sway * 0.025 * Math.sin(t * 0.9 + sd),
    headRot[1] + sway * 0.04 * Math.sin(t * 0.55 + sd * 2),
    headRot[2] + sway * 0.02 * Math.sin(t * 0.7 + sd * 3),
  ];
  const blink = idle ? idleBlink(t, sd) : 1;
  const voice = talk && time ? time.voice : 0;
  const talking = voice > 0.06;
  const liveFace: Face = {
    ...face,
    eyeOpenL: (face.eyeOpenL ?? 1) * blink,
    eyeOpenR: (face.eyeOpenR ?? 1) * blink,
    ...(talking ? { mouth: "o" as const, mouthOpen: 0.25 + voice * 0.95 } : {}),
  };

  // arms swing with the walk; hanging arms drift slightly with breathing
  const swing = (arm: V3, side: -1 | 1): V3 => {
    const hanging = Math.min(1, Math.max(0, (-arm[1] - 0.12) / 0.15));
    const w = walk === undefined ? 0 : Math.sin(walk + (side < 0 ? Math.PI : 0)) * 0.14 * hanging;
    return [arm[0], arm[1] + breath * 0.008, arm[2] + w];
  };
  const hL = handPos(SHOULDER_L, swing(armL, -1));
  const hR = handPos(SHOULDER_R, swing(armR, 1));
  const walkBob = walk === undefined ? 0 : Math.abs(Math.sin(walk)) * 0.035;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {legs && (
        <mesh position={[0, 0.012, 0.02]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.42, 0.3, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
      {legs &&
        ([-1, 1] as const).map((s) => {
          const ph = walk === undefined ? 0 : walk + (s < 0 ? 0 : Math.PI);
          const fz = walk === undefined ? 0 : Math.sin(ph) * 0.17;
          const fy = walk === undefined ? 0 : Math.max(0, Math.cos(ph)) * 0.08;
          return (
            <group key={s}>
              <Stick a={[s * 0.11, 0.55 + walkBob, 0]} b={[s * 0.13, 0.04 + fy, fz]} r={0.032} />
              <mesh position={[s * 0.14, 0.035 + fy, 0.05 + fz]} scale={[0.07, 0.04, 0.1]}>
                <sphereGeometry args={[1, 14, 10]} />
                <Ink />
              </mesh>
            </group>
          );
        })}
      <group position={[0, bounce + walkBob, 0]} rotation={[lean, 0, 0]}>
        <group position={[0, 0.53, 0]} scale={[1 - breath * 0.006, 1 + breath * 0.012, 1]}>
          <mesh position={[0, 0.3, 0]} scale={[1, 1, 0.85]}>
            <capsuleGeometry args={[0.29, 0.3, 10, 20]} />
            <ToonMat color={outfit.color} map={outfit.map} />
            <Line t={0.026} />
          </mesh>
        </group>
        {outfit.details}
        <Arm shoulder={SHOULDER_L} hand={hL} side={-1} />
        <Arm shoulder={SHOULDER_R} hand={hR} side={1} />
        {[hL, hR].map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.065, 16, 12]} />
            <Ink />
          </mesh>
        ))}
        {holdL && <group position={hL}>{holdL}</group>}
        {holdR && <group position={hR}>{holdR}</group>}
        {props}
        <group position={[0, 1.5 + breath * 0.008, 0]} rotation={head}>
          <Head face={liveFace} hat={hat} />
        </group>
      </group>
    </group>
  );
};

/** Two-tone collar / buttons helper for outfits. */
export const Buttons: React.FC<{ color?: string; z?: number }> = ({ color = INK, z = 0.25 }) => (
  <>
    {[0.98, 0.86, 0.74].map((y) => (
      <mesh key={y} position={[0, y, z]}>
        <sphereGeometry args={[0.022, 10, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    ))}
  </>
);
