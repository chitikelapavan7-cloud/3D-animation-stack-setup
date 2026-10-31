import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type V3 = [number, number, number];

/** Frame-driven camera: set position/target per render (no useFrame). */
export const CameraRig: React.FC<{ position: V3; target: V3; fov?: number; roll?: number; lift?: number }> = ({
  position,
  target: aim,
  fov = 40,
  roll = 0,
  lift = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  // `lift` raises the whole shot (e.g. to frame taller standing characters)
  const target: V3 = [aim[0], aim[1] + lift, aim[2]];
  camera.position.set(position[0], position[1] + lift, position[2]);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(...target);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};
