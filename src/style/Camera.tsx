import { useThree } from "@react-three/fiber";
import * as THREE from "three";

type V3 = [number, number, number];

/** Frame-driven camera: set position/target per render (no useFrame). */
export const CameraRig: React.FC<{ position: V3; target: V3; fov?: number; roll?: number }> = ({
  position,
  target,
  fov = 40,
  roll = 0,
}) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  camera.position.set(...position);
  camera.up.set(Math.sin(roll), Math.cos(roll), 0);
  camera.lookAt(...target);
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  return null;
};
