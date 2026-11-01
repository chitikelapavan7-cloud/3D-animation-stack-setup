import { useMemo } from "react";
import * as THREE from "three";

export const INK = "#141414";

let gradient: THREE.DataTexture | null = null;
/** Crisp 3-band cel-shading ramp. */
export const toonGradient = () => {
  if (gradient) return gradient;
  // crisp 3-band cel shading (ship-video reference): clear light / mid / shadow shapes
  const data = new Uint8Array([105, 185, 255]);
  gradient = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
};

export const ToonMat: React.FC<{
  color?: string;
  map?: THREE.Texture | null;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}> = ({ color = "#ffffff", map, emissive, emissiveIntensity, transparent, opacity }) => (
  <meshToonMaterial
    color={color}
    map={map ?? null}
    gradientMap={toonGradient()}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={emissiveIntensity ?? 1}
    transparent={transparent}
    opacity={opacity ?? 1}
  />
);

export const Ink: React.FC = () => <meshBasicMaterial color={INK} />;

/**
 * Inverted-hull black outline — the signature thick cartoon line.
 * Place as a child of a mesh: it borrows the parent's geometry and draws its back faces pushed
 * outward along the normals. (drei's <Outlines> does not render inside Remotion, so we use this.)
 */
/** Global ink weight: the ship-video reference uses bold outlines on characters and props alike. */
export const INK_WEIGHT = 1.4;

export const Line: React.FC<{ t?: number; color?: string }> = ({ t: base = 0.025, color = INK }) => {
  const t = base * INK_WEIGHT;
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        uniforms: { thickness: { value: t }, color: { value: new THREE.Color(color) } },
        vertexShader: `
          uniform float thickness;
          void main() {
            vec3 p = position + normal * thickness;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: `
          uniform vec3 color;
          void main() { gl_FragColor = vec4(color, 1.0); }`,
      }),
    [t, color],
  );
  return (
    <mesh
      material={material}
      ref={(m) => {
        const parent = m?.parent as THREE.Mesh | null;
        if (m && parent?.geometry && m.geometry !== parent.geometry) m.geometry = parent.geometry;
      }}
    />
  );
};

type V3 = [number, number, number];

/** Outlined toon box — the building block for sets/props. */
export const Box: React.FC<{
  size: V3;
  position?: V3;
  rotation?: V3;
  color?: string;
  map?: THREE.Texture | null;
  line?: number;
}> = ({ size, position, rotation, color, map, line = 0.02 }) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <ToonMat color={color} map={map} />
    {line > 0 && <Line t={line} />}
  </mesh>
);

/** Black stick limb between two points. */
export const Stick: React.FC<{ a: V3; b: V3; r?: number; color?: string }> = ({ a, b, r = 0.03, color = INK }) => {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const mid = va.add(vb).multiplyScalar(0.5);
  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
};
