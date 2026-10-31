import { ThreeCanvas } from "@remotion/three";
import type { Caption } from "@remotion/captions";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Captions } from "../components/Captions";

const captions: Caption[] = [
  { text: "Three.js", startMs: 300, endMs: 1200, timestampMs: 300, confidence: 1 },
  { text: " renders", startMs: 1200, endMs: 1900, timestampMs: 1200, confidence: 1 },
  { text: " the", startMs: 1900, endMs: 2200, timestampMs: 1900, confidence: 1 },
  { text: " 3D", startMs: 2200, endMs: 3000, timestampMs: 2200, confidence: 1 },
  { text: " Remotion", startMs: 4000, endMs: 4900, timestampMs: 4000, confidence: 1 },
  { text: " adds", startMs: 4900, endMs: 5400, timestampMs: 4900, confidence: 1 },
  { text: " captions", startMs: 5400, endMs: 6200, timestampMs: 5400, confidence: 1 },
  { text: " & audio", startMs: 6200, endMs: 7500, timestampMs: 6200, confidence: 1 },
];

/**
 * All animation must be driven by useCurrentFrame() — never useFrame()/clock time —
 * so every rendered frame is deterministic.
 */
const SpinningKnot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12 } });
  const t = frame / fps;

  return (
    <mesh rotation={[t * 0.6, t * 0.9, 0]} scale={pop * 1.4}>
      <torusKnotGeometry args={[1, 0.32, 256, 32]} />
      <meshStandardMaterial
        color="#6c8cff"
        metalness={0.6}
        roughness={0.25}
        emissive="#1a1f5c"
      />
    </mesh>
  );
};

export const Demo3D: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const volume = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #1d2340, #07080f)" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <pointLight position={[-4, -2, 3]} intensity={30} color="#ff6ad5" />
        <SpinningKnot />
      </ThreeCanvas>
      <Captions captions={captions} />
      <Audio src={staticFile("music.mp3")} volume={volume} />
    </AbsoluteFill>
  );
};
