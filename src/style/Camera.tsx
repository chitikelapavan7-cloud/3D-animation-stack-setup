import { useThree } from "@react-three/fiber";
import { createContext, useContext } from "react";
import * as THREE from "three";

type V3 = [number, number, number];
export type Bounds = { min: V3; max: V3 };

/**
 * Shot-wide lens settings. `distance` pulls every camera back along its line of sight (composition and moves are
 * kept), `fovScale` widens the lens, and `bounds` (room interior) stops the camera before it would pass a wall.
 */
export const Lens = createContext<{ distance: number; fovScale: number; bounds?: Bounds }>({ distance: 1, fovScale: 1 });

const clampAlongRay = (target: V3, pos: V3, k: number, b?: Bounds): number => {
  if (!b) return k;
  let kk = k;
  for (let i = 0; i < 3; i++) {
    const d = pos[i] - target[i];
    if (Math.abs(d) < 1e-6) continue;
    const limit = d > 0 ? b.max[i] : b.min[i];
    const allowed = (limit - target[i]) / d; // ray parameter where this axis hits the wall
    if (allowed > 0) kk = Math.min(kk, allowed);
  }
  return Math.max(Math.min(1, k), kk);
};

/** Frame-driven camera: set position/target per render (no useFrame). */
export const CameraRig: React.FC<{ position: V3; target: V3; fov?: number; roll?: number; lift?: number }> = ({
  position: p0,
  target: aim,
  fov = 40,
  roll = 0,
  lift = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const lens = useContext(Lens);
  // `lift` raises the whole shot (e.g. to frame taller standing characters)
  const target: V3 = [aim[0], aim[1] + lift, aim[2]];
  const raw: V3 = [p0[0], p0[1] + lift, p0[2]];
  const k = clampAlongRay(target, raw, lens.distance, lens.bounds);
  const position: V3 = [0, 1, 2].map((i) => target[i] + (raw[i] - target[i]) * k) as V3;
  // Upward-looking shots: pulling back along the ray would sink the camera (even below the ground).
  // Pull back horizontally only — keep the authored height — and never go below eye-safe ground clearance.
  if (position[1] < raw[1]) position[1] = raw[1];
  position[1] = Math.max(position[1], 0.35);
  camera.position.set(...position);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(...target);
  const f = fov * lens.fovScale;
  if (camera.fov !== f) {
    camera.fov = f;
    camera.updateProjectionMatrix();
  }
  return null;
};
