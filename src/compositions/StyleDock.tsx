import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions, words } from "../components/Captions";
import { CameraRig } from "../style/Camera";
import { Buttons, Character } from "../style/Character";
import { Box, Line, Stick, ToonMat } from "../style/toon";
import { dots, planks, stripes } from "../style/textures";
import "../style/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const captions = words([
  ["Nobody", 120, 700],
  ["believed", 700, 1350],
  ["the", 1450, 1600],
  ["fisherman's", 1600, 2450],
  ["big", 2600, 2900],
  ["catch.", 2900, 3900],
]);

const Cloud: React.FC<{ position: [number, number, number]; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    {[
      [0, 0, 0, 1.4],
      [1.5, -0.3, 0, 1.0],
      [-1.5, -0.35, 0, 1.05],
      [0.7, 0.7, 0, 0.95],
      [-0.6, 0.55, 0, 0.9],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 16]} />
        <ToonMat color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        <Line t={0.06} />
      </mesh>
    ))}
  </group>
);

const Post: React.FC<{ position: [number, number, number]; h?: number }> = ({ position, h = 1.5 }) => (
  <group position={position}>
    <mesh position={[0, h / 2 - 0.8, 0]}>
      <cylinderGeometry args={[0.13, 0.14, h, 16]} />
      <ToonMat color="#7a4a28" />
      <Line t={0.02} />
    </mesh>
    <mesh position={[0, h - 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.15, 0.035, 8, 24]} />
      <ToonMat color="#d9b98a" />
      <Line t={0.01} />
    </mesh>
    <mesh position={[0, h - 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.15, 0.035, 8, 24]} />
      <ToonMat color="#d9b98a" />
      <Line t={0.01} />
    </mesh>
  </group>
);

const Fish: React.FC<{ wiggle: number }> = ({ wiggle }) => (
  <group rotation={[0, 0, Math.PI / 2 + wiggle]}>
    <mesh scale={[0.11, 0.06, 0.05]}>
      <sphereGeometry args={[1, 20, 14]} />
      <ToonMat color="#ff8a2a" />
      <Line t={0.012} />
    </mesh>
    <mesh position={[-0.14, 0, 0]} rotation={[0, 0, Math.PI / 2 + wiggle * 2]}>
      <coneGeometry args={[0.055, 0.08, 3]} />
      <ToonMat color="#ff6a1a" />
      <Line t={0.01} />
    </mesh>
    <mesh position={[0.06, 0.015, 0.045]}>
      <sphereGeometry args={[0.012, 8, 8]} />
      <meshBasicMaterial color="#111" />
    </mesh>
  </group>
);

export const StyleDock: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // beats: 0-40 friend holds it in, 40+ friend bursts out laughing; fisherman deadpan, sweat at 75
  const burst = interpolate(frame, [36, 44], [0, 1], { ...clamp, easing: Easing.out(Easing.back(2)) });
  const laughCycle = Math.sin(frame * 0.95);
  const laugh = burst * (0.5 + 0.5 * laughCycle);
  const sweat = interpolate(frame, [72, 80], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  const lift = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const fishSwing = Math.sin(frame * 0.22) * 0.25 * (1 - lift * 0.4);
  const blinkF = frame >= 60 && frame <= 63 ? 0.08 : 1;

  const camT = Easing.inOut(Easing.sin)(frame / 120);
  const cam: [number, number, number] = [interpolate(camT, [0, 1], [-0.3, 0.15]), 1.75, interpolate(camT, [0, 1], [6.4, 5.5])];

  // rod: from fisherman's right hand up and over toward camera-center
  const rodBase: [number, number, number] = [-0.26, 1.0, 0.42]; // = fisherman right hand in world space
  const rodTip: [number, number, number] = [0.02, 2.55 + lift * 0.1, 0.85];
  const lineLen = 0.42;
  const fishPos: [number, number, number] = [
    rodTip[0] + Math.sin(fishSwing) * lineLen,
    rodTip[1] - Math.cos(fishSwing) * lineLen,
    rodTip[2],
  ];

  const waves = Array.from({ length: 14 }, (_, i) => {
    const x = ((i * 1.37 + frame * 0.012 * (i % 2 ? 1 : -1)) % 9) - 4.5;
    return { x, z: -2.5 - (i % 7) * 1.4, w: 0.5 + (i % 3) * 0.3 };
  });

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #2f62c9 0%, #5b93e6 45%, #b9dcf7 72%)" }}>
      <ThreeCanvas width={width} height={height} flat>
        <CameraRig position={cam} target={[0.05, 1.3, 0]} fov={42} />
        <hemisphereLight args={["#e6f1ff", "#b08a66", 1.5]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 5, 4]} intensity={1.8} color="#fff1d6" />

        {/* sea */}
        <mesh position={[0, -0.55, -20]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 60]} />
          <ToonMat color="#2f86c9" />
        </mesh>
        {waves.map((w, i) => (
          <mesh key={i} position={[w.x, -0.53, w.z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.03, w.w, 4, 8]} />
            <meshBasicMaterial color="#bfe6ff" />
          </mesh>
        ))}

        {/* far island + lighthouse */}
        <mesh position={[-7, -0.6, -28]} scale={[6, 2.2, 3]}>
          <sphereGeometry args={[1, 32, 16]} />
          <ToonMat color="#5fae4a" />
          <Line t={0.04} />
        </mesh>
        <group position={[-6, 1.3, -27]}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.45, 0.65, 2.6, 20]} />
            <ToonMat map={stripes("lighthouse", ["#f4efe6", "#d23b3b"], 6, Math.PI / 2)} />
            <Line t={0.05} />
          </mesh>
          <mesh position={[0, 2.75, 0]}>
            <coneGeometry args={[0.6, 0.6, 20]} />
            <ToonMat color="#d23b3b" />
            <Line t={0.05} />
          </mesh>
        </group>
        <Cloud position={[3.5 + frame * 0.004, 11, -32]} scale={1.4} />
        <Cloud position={[-5 + frame * 0.003, 15, -38]} scale={1.1} />
        <Cloud position={[7, 6.5, -45]} scale={1.6} />

        {/* dock */}
        <Box size={[5, 0.16, 5]} position={[0, -0.08, 0]} map={planks("dock", "#a8693a", 7, 13, [2, 2])} color="#ffffff" line={0.03} />
        <Post position={[-2.3, 0, 2.3]} />
        <Post position={[2.3, 0, 2.3]} />
        <Post position={[-2.3, 0, -2.3]} h={1.7} />
        <Post position={[2.3, 0, -2.3]} h={1.7} />
        <Box size={[0.6, 0.6, 0.6]} position={[-1.35, 0.3, -1.0]} rotation={[0, 0.3, 0]} map={planks("crate", "#c48a4a", 4, 2)} color="#ffffff" line={0.025} />
        <Box size={[0.45, 0.45, 0.45]} position={[-1.3, 0.83, -1.0]} rotation={[0, -0.2, 0]} map={planks("crate", "#c48a4a", 4, 2)} color="#ffffff" line={0.025} />
        <group position={[1.45, 0, -0.9]}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.76, 20]} />
            <ToonMat map={planks("barrel", "#8a5530", 10, 6)} />
            <Line t={0.025} />
          </mesh>
          {[0.15, 0.6].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.305, 0.025, 6, 30]} />
              <ToonMat color="#555" />
            </mesh>
          ))}
        </group>
        {/* bucket */}
        <group position={[-0.95, 0, 0.55]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.17, 0.13, 0.32, 20, 1, true]} />
            <ToonMat color="#9aa7b5" />
            <Line t={0.015} />
          </mesh>
        </group>

        {/* fisherman: deadpan, holding up a tiny fish */}
        <Character
          position={[-0.65, 0, 0.1]}
          rotationY={0.3}
          face={{
            lookX: 0.35,
            lookY: -0.1,
            eyeOpenL: 0.55 * blinkF,
            eyeOpenR: 0.55 * blinkF,
            browL: -0.3,
            browR: -0.3,
            browTiltL: -0.12,
            browTiltR: -0.12,
            mouth: "flat",
            mustache: "#6b3f1f",
            sweat,
          }}
          headRot={[0, 0.25, -0.05]}
          outfit={{ color: "#f2c230", details: <Buttons color="#7a5a10" z={0.26} /> }}
          armL={[0.05, -0.3, 0.3]}
          armR={[0.03, 0.02, 0.42]}
          hat={
            <group position={[0, 0.27, 0]} rotation={[-0.08, 0, 0.06]}>
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.33, 0.42, 0.26, 28]} />
                <ToonMat color="#5f7a3a" />
                <Line t={0.02} />
              </mesh>
              <mesh>
                <cylinderGeometry args={[0.66, 0.66, 0.035, 36]} />
                <ToonMat color="#53692f" />
                <Line t={0.015} />
              </mesh>
              <mesh position={[0, 0.06, 0]}>
                <cylinderGeometry args={[0.425, 0.425, 0.07, 28]} />
                <ToonMat color="#3a4a22" />
              </mesh>
            </group>
          }
        />
        <Stick a={rodBase} b={rodTip} r={0.022} color="#5a3a1c" />
        <Stick a={rodTip} b={fishPos} r={0.004} color="#e8e8e8" />
        <group position={[fishPos[0], fishPos[1] - 0.08, fishPos[2]]}>
          <Fish wiggle={Math.sin(frame * 0.8) * 0.25} />
        </group>

        {/* friend: cracking up */}
        <Character
          position={[0.72, 0, -0.1]}
          rotationY={-0.4}
          face={
            burst > 0.2
              ? { happyEyes: true, mouth: "laugh", mouthOpen: 0.7 + laugh * 0.5, browL: 0.6, browR: 0.6, blush: true }
              : {
                  lookX: -0.4,
                  lookY: 0.3,
                  eyeOpenL: 1,
                  eyeOpenR: 1,
                  mouth: "grin",
                  browL: 0.3,
                  browR: 0.3,
                  blush: true,
                }
          }
          headRot={[-0.25 * burst - laugh * 0.08, -0.15, 0.1 * burst]}
          lean={-0.12 * burst - laugh * 0.05}
          bounce={laugh * 0.05}
          outfit={{ color: "#ffffff", map: stripes("sailor", ["#ffffff", "#ffffff", "#2b5fb8"], 12, Math.PI / 2) }}
          armL={burst > 0.2 ? [-0.25, 0.25 + laugh * 0.05, 0.22] : [0.02, -0.18, 0.32]}
          armR={burst > 0.2 ? [-0.12, -0.28, 0.32] : [-0.05, -0.2, 0.3]}
          hat={
            <mesh rotation={[-0.15, 0, 0]}>
              <sphereGeometry args={[0.505, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
              <ToonMat map={dots("bandana", "#2f6fd6", "#ffffff", 44, 7)} />
              <Line t={0.02} />
            </mesh>
          }
        />
      </ThreeCanvas>

      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(10,20,40,0.35) 100%)" }} />
      <Captions captions={captions} variant="cartoon" />
      <Audio src={staticFile("audio/dock.mp3")} />
    </AbsoluteFill>
  );
};
