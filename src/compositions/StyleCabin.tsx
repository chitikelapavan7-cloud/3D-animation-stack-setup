import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions, words } from "../components/Captions";
import { CameraRig } from "../style/Camera";
import { Buttons, Character } from "../style/Character";
import { Box, Line, ToonMat } from "../style/toon";
import { canvasTex, glow, planks, rng, stripes } from "../style/textures";
import "../style/fonts";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const captions = words([
  ["Then", 150, 620],
  ["the", 650, 850],
  ["candle", 850, 1700],
  ["went", 2750, 3050],
  ["out.", 3050, 3950],
]);

const OUT = 90; // frame the candle dies

const nightSky = () =>
  canvasTex("nightsky", 256, 384, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0d1640");
    g.addColorStop(1, "#3a4fa0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(9);
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 40; i++) ctx.fillRect(r() * w, r() * h * 0.7, 3, 3);
    ctx.fillStyle = "#fff6d8";
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.25, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f1a48";
    ctx.beginPath();
    ctx.arc(w * 0.68 + 16, h * 0.25 - 8, 30, 0, Math.PI * 2);
    ctx.fill();
    // snowy sill
    ctx.fillStyle = "#e8eefc";
    ctx.beginPath();
    ctx.ellipse(w / 2, h, w * 0.6, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  });

const portrait = () =>
  canvasTex("portrait", 128, 160, (ctx, w, h) => {
    ctx.fillStyle = "#e9d9b4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#3b2a1c";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.42, 34, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w / 2 - 30, h * 0.62, 60, 70);
    ctx.fillStyle = "#e9d9b4";
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.42, 26, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  });

const Window: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0, -0.01]}>
      <planeGeometry args={[0.8, 1.1]} />
      <meshBasicMaterial map={nightSky()} />
    </mesh>
    <Box size={[0.95, 0.08, 0.1]} position={[0, 0.58, 0]} color="#5a3420" />
    <Box size={[0.95, 0.1, 0.16]} position={[0, -0.58, 0.02]} color="#5a3420" />
    <Box size={[0.08, 1.2, 0.1]} position={[-0.44, 0, 0]} color="#5a3420" />
    <Box size={[0.08, 1.2, 0.1]} position={[0.44, 0, 0]} color="#5a3420" />
    <Box size={[0.04, 1.1, 0.06]} position={[0, 0, 0]} color="#5a3420" line={0.01} />
    <Box size={[0.8, 0.04, 0.06]} position={[0, 0.05, 0]} color="#5a3420" line={0.01} />
  </group>
);

const Candle: React.FC<{ flame: number; frame: number }> = ({ flame, frame }) => {
  const sway = Math.sin(frame * 0.45) * 0.08 + Math.sin(frame * 1.3) * 0.04;
  return (
    <group>
      <mesh position={[0, 0.015, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.03, 24]} />
        <ToonMat color="#c99a3a" />
        <Line t={0.012} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.055, 0.06, 0.28, 20]} />
        <ToonMat color="#f3e9d2" />
        <Line t={0.012} />
      </mesh>
      {/* drip */}
      <mesh position={[0.045, 0.26, 0.03]} scale={[0.02, 0.05, 0.02]}>
        <sphereGeometry args={[1, 10, 8]} />
        <ToonMat color="#f3e9d2" />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      {flame > 0.01 && (
        <group position={[0, 0.37, 0]} rotation={[0, 0, sway]} scale={flame}>
          <mesh position={[0, 0.05, 0]} scale={[0.04, 0.085, 0.04]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial color="#ffb43a" />
          </mesh>
          <mesh position={[0, 0.035, 0.01]} scale={[0.022, 0.05, 0.022]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#fff4c4" />
          </mesh>
          <mesh position={[0, 0.05, 0.05]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial
              map={glow("candleglow", "rgba(255,190,90,0.55)")}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};

const Smoke: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[0, 1, 2, 3].map((i) => {
      const k = Math.max(0, t - i * 4) / 30;
      if (k <= 0 || k > 1) return null;
      return (
        <mesh key={i} position={[Math.sin(k * 6 + i) * 0.04, 0.38 + k * 0.6, 0]} scale={0.03 + k * 0.08}>
          <sphereGeometry args={[1, 12, 10]} />
          <meshBasicMaterial color="#c9cbd6" transparent opacity={0.6 * (1 - k)} depthWrite={false} />
        </mesh>
      );
    })}
  </>
);

const Book: React.FC = () => (
  <group rotation={[0, 0.25, 0]}>
    <Box size={[0.5, 0.03, 0.36]} position={[0, 0.015, 0]} color="#8a2d2d" line={0.01} />
    <mesh position={[-0.12, 0.045, 0]} rotation={[0, 0, 0.08]}>
      <boxGeometry args={[0.23, 0.03, 0.32]} />
      <ToonMat color="#f5ecd4" />
      <Line t={0.008} />
    </mesh>
    <mesh position={[0.12, 0.045, 0]} rotation={[0, 0, -0.08]}>
      <boxGeometry args={[0.23, 0.03, 0.32]} />
      <ToonMat color="#f5ecd4" />
      <Line t={0.008} />
    </mesh>
  </group>
);

export const StyleCabin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const flicker = 1 + 0.07 * Math.sin(frame * 1.7) + 0.05 * Math.sin(frame * 3.3 + 1);
  const flame = interpolate(frame, [OUT - 6, OUT], [1, 0], clamp) * flicker;
  const dark = interpolate(frame, [OUT - 4, OUT + 2], [0, 1], clamp);

  // Character beats
  const lookUp = interpolate(frame, [28, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sus = interpolate(frame, [50, 58], [0, 1], clamp) * (1 - dark);
  const blink = frame >= 44 && frame <= 47 ? 0.1 : 1;
  const shock = interpolate(frame, [OUT + 2, OUT + 7], [0, 1], { ...clamp, easing: Easing.out(Easing.back(3)) });
  const shiver = frame > OUT + 2 ? Math.sin(frame * 2.4) * 0.012 * (1 - interpolate(frame, [OUT, 120], [0, 0.6])) : 0;

  const camZ = interpolate(frame, [0, 120], [3.9, 3.25], { easing: Easing.inOut(Easing.sin) });
  const camShakeY = shock > 0 ? Math.sin(frame * 3.1) * 0.01 * (1 - shock * 0.5) : 0;

  const wood = planks("cabinwall", "#b8743f", 6, 4, [3, 1.6]);
  const floor = planks("cabinfloor", "#8d5530", 5, 7, [3, 3]);
  const roof = planks("cabinroof", "#6e4428", 6, 11, [2, 3]);

  return (
    <AbsoluteFill style={{ background: "#0e0a14" }}>
      <ThreeCanvas width={width} height={height} flat>
        <CameraRig position={[-0.05 + shiver, 1.95 + camShakeY, camZ]} target={[-0.02, 1.55, 0]} fov={42} />

        {/* lighting: warm candle vs cold moon */}
        <ambientLight intensity={interpolate(dark, [0, 1], [0.7, 0.55])} color={dark > 0.5 ? "#6b7bc8" : "#b8988a"} />
        <pointLight
          position={[-0.5, 1.45, 1.1]}
          intensity={(1 - dark) * 3.2 * flicker}
          distance={0}
          decay={1.3}
          color="#ffd6a8"
        />
        <directionalLight position={[2, 3, -2]} intensity={0.25 + dark * 1.6} color="#7f9bff" />
        <directionalLight position={[-1, 2, 4]} intensity={0.45 * (1 - dark) + 0.15} color="#ffd2a1" />

        {/* room */}
        <Box size={[7, 5, 0.12]} position={[0, 2.2, -1.3]} map={wood} color="#ffffff" line={0} />
        <Box size={[7, 0.1, 6]} position={[0, -0.05, 1.2]} map={floor} color="#ffffff" line={0} />
        <mesh position={[-2.2, 3.4, 0.5]} rotation={[0, 0, 0.75]}>
          <boxGeometry args={[4, 0.12, 4]} />
          <ToonMat map={roof} />
        </mesh>
        <mesh position={[2.3, 3.6, 0.5]} rotation={[0, 0, -0.75]}>
          <boxGeometry args={[4, 0.12, 4]} />
          <ToonMat map={roof} />
        </mesh>
        <Box size={[0.18, 3.4, 0.18]} position={[-1.35, 1.2, -1.15]} rotation={[0, 0, 0.05]} color="#4b2c19" />
        <Box size={[0.18, 3.4, 0.18]} position={[1.45, 1.2, -1.15]} rotation={[0, 0, -0.04]} color="#4b2c19" />
        <Box size={[3.4, 0.16, 0.2]} position={[0, 3.05, -1.1]} rotation={[0, 0, 0.02]} color="#4b2c19" />

        <Window position={[0.82, 2.05, -1.22]} />
        <group position={[-0.78, 2.1, -1.22]} rotation={[0, 0, 0.06]}>
          <Box size={[0.36, 0.44, 0.04]} color="#3b2414" line={0.012} />
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.28, 0.36]} />
            <ToonMat map={portrait()} />
          </mesh>
        </group>

        {/* character behind desk */}
        <Character
          position={[0, 0.22, 0]}
          face={{
            lookY: interpolate(lookUp, [0, 1], [-0.85, 0]),
            lookX: interpolate(lookUp, [0, 1], [0, 0.15]) - shock * 0.15,
            eyeOpenL: blink * (1 - sus * 0.15),
            eyeOpenR: blink * (1 - sus * 0.55),
            eyeScale: 1 + shock * 0.45,
            browL: sus * 0.9 + shock * 1.1,
            browR: -sus * 0.4 + shock * 1.1,
            browTiltL: -sus * 0.15 - shock * 0.25,
            browTiltR: sus * 0.25 - shock * 0.25,
            mouth: shock > 0.05 ? "o" : sus > 0.5 ? "flat" : "smirk",
            mouthOpen: 0.4 + shock * 0.8,
            sweat: shock,
          }}
          headRot={[interpolate(lookUp, [0, 1], [0.32, 0]) - shock * 0.08, interpolate(lookUp, [0, 1], [0, 0.12]), sus * 0.08]}
          lean={interpolate(lookUp, [0, 1], [0.18, 0]) - shock * 0.1}
          bounce={shock * 0.04}
          legs={false}
          outfit={{
            color: "#ffffff",
            map: stripes("pj", ["#e9e3f2", "#e9e3f2", "#8a7fb8"], 10, 0),
            details: <Buttons color="#4b3f78" z={0.26} />,
          }}
          armL={[-0.05, -0.27, 0.46]}
          armR={[0.08, -0.27, 0.46]}
          hat={
            <group rotation={[-0.12, 0, -0.1]}>
              {/* dome */}
              <mesh>
                <sphereGeometry args={[0.515, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
                <ToonMat map={stripes("nightcap", ["#d23b3b", "#f5f0e6"], 7, 0.9)} />
                <Line t={0.022} />
              </mesh>
              {/* band */}
              <mesh position={[0, 0.515 * Math.cos(Math.PI * 0.36), 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.515 * Math.sin(Math.PI * 0.36), 0.055, 12, 48]} />
                <ToonMat color="#f5f0e6" />
                <Line t={0.016} />
              </mesh>
              {/* floppy tail drooping to the side */}
              <mesh position={[0.37, 0.33, -0.05]} rotation={[0, 0, -2.0]}>
                <coneGeometry args={[0.17, 0.6, 24]} />
                <ToonMat map={stripes("nightcap", ["#d23b3b", "#f5f0e6"], 7, 0.9)} />
                <Line t={0.018} />
              </mesh>
              <mesh position={[0.66, 0.2, -0.05]}>
                <sphereGeometry args={[0.085, 16, 12]} />
                <ToonMat color="#f5f0e6" />
                <Line t={0.015} />
              </mesh>
            </group>
          }
        />

        {/* desk */}
        <Box size={[2.4, 0.08, 1.0]} position={[0, 0.86, 0.6]} map={planks("desk", "#9a5a2e", 4, 21)} color="#ffffff" line={0.025} />
        <Box size={[2.3, 0.82, 0.08]} position={[0, 0.41, 1.06]} map={planks("deskfront", "#7a4423", 5, 5)} color="#ffffff" line={0.025} />
        <group position={[0.12, 0.9, 0.6]}>
          <Book />
        </group>
        <group position={[-0.5, 0.9, 0.85]}>
          <Candle flame={flame} frame={frame} />
          {frame > OUT - 2 && <Smoke t={frame - OUT + 2} />}
        </group>
        <group position={[0.62, 0.9, 0.8]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.09, 0.08, 0.2, 20]} />
            <ToonMat color="#3f6fb5" />
            <Line t={0.014} />
          </mesh>
          <mesh position={[0.11, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.05, 0.016, 8, 16]} />
            <ToonMat color="#3f6fb5" />
          </mesh>
        </group>
      </ThreeCanvas>

      {/* painterly vignette */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(10,5,20,${0.45 + dark * 0.25}) 100%)`,
        }}
      />
      <Captions captions={captions} variant="cartoon" />
      <Audio src={staticFile("audio/cabin.mp3")} />
    </AbsoluteFill>
  );
};
