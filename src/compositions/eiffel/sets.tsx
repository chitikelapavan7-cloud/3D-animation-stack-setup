import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useId, useLayoutEffect } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Box, Line, Stick, ToonMat, toonGradient } from "../../style/toon";
import { canvasTex, planks, rng, shade, speckled } from "../../style/textures";
import { Building, Chair, Chandelier, Cloud, DeskLamp, EiffelTower, Glow, Tree, WallClock, letterheadTex, textTex } from "../../style/props";

type V3 = [number, number, number];

/**
 * Soft cast shadows from the strongest directional light (the "key"). Runs after the scene commits each frame,
 * so props that appear mid-shot are included. Glows, ink lines and transparent cards never cast shadows.
 */
const ShadowRig: React.FC<{ extent?: number }> = ({ extent = 6 }) => {
  const { scene, gl } = useThree();
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  useLayoutEffect(() => {
    let key: THREE.DirectionalLight | null = null;
    scene.traverse((o) => {
      if ((o as THREE.DirectionalLight).isDirectionalLight) {
        const l = o as THREE.DirectionalLight;
        if (!key || l.intensity > key.intensity) key = l;
      }
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mat = m.material as THREE.Material;
      const casts = !!mat && (mat as THREE.MeshToonMaterial).isMeshToonMaterial && !mat.transparent;
      m.castShadow = casts;
      m.receiveShadow = casts;
    });
    const k = key as THREE.DirectionalLight | null;
    if (k && !k.castShadow) {
      k.castShadow = true;
      k.shadow.mapSize.set(2048, 2048);
      const c = k.shadow.camera;
      c.left = -extent;
      c.right = extent;
      c.top = extent;
      c.bottom = -extent;
      c.near = 0.5;
      c.far = 60;
      c.updateProjectionMatrix();
      k.shadow.bias = -0.0006;
      k.shadow.normalBias = 0.03;
      k.shadow.radius = 4;
    }
  });
  return null;
};

/** Canvas + painted sky + vignette. Children are the 3D scene. */
export const Stage: React.FC<{ sky: string; vignette?: number; children: React.ReactNode; overlay?: React.ReactNode; shadowExtent?: number }> = ({
  sky,
  vignette = 0.3,
  children,
  overlay,
  shadowExtent,
}) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  const grainId = `grain${useId().replace(/:/g, "")}`;
  return (
    <AbsoluteFill style={{ background: sky }}>
      {/* reference grade: richer saturation, slightly warmer */}
      <AbsoluteFill style={{ filter: "saturate(1.14) contrast(1.04)" }}>
      <ThreeCanvas width={width} height={height} flat shadows>
        {children}
        {/* cool back/rim light separates characters from the background */}
        <directionalLight position={[-3, 4, -6]} intensity={0.45} color="#cfe0ff" />
        <ShadowRig extent={shadowExtent} />
      </ThreeCanvas>
      </AbsoluteFill>
      {/* warm sunlight wash from the upper left, cool shade lower right */}
      <AbsoluteFill
        style={{
          background: "linear-gradient(155deg, rgba(255,196,120,0.22) 0%, rgba(255,170,90,0) 45%, rgba(60,40,110,0.16) 100%)",
          mixBlendMode: "soft-light",
        }}
      />
      {/* animated film grain (deterministic per frame) */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.11, mixBlendMode: "overlay" }}>
        <filter id={grainId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 47} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#${grainId})`} />
      </svg>
      <AbsoluteFill
        style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(12,8,24,${vignette}) 100%)` }}
      />
      {overlay}
    </AbsoluteFill>
  );
};

export const SKY_DAY = "linear-gradient(180deg, #2f62c9 0%, #5b93e6 45%, #bfe0f7 75%)";
export const SKY_GRAY = "linear-gradient(180deg, #5d6a80 0%, #8f9bb0 50%, #c9cfd8 80%)";
export const SKY_SUNSET = "linear-gradient(180deg, #3a4fa0 0%, #c9739a 45%, #ffc27a 75%)";

const damask = (key: string, base: string, motif: string) =>
  canvasTex(
    key,
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = motif;
      for (const [cx, cy] of [
        [w / 2, h / 2],
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ]) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, 22, 40, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx, cy, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = shade(base, -0.05);
      ctx.fillRect(w / 4 - 2, 0, 4, h);
      ctx.fillRect((3 * w) / 4 - 2, 0, 4, h);
    },
    [4, 2],
  );


/* ------------------------------------------------------------------ shared set dressing */

const LampPost: React.FC<{ position: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 1.2, 0]}>
      <cylinderGeometry args={[0.045, 0.07, 2.4, 10]} />
      <ToonMat color="#2b2f36" />
      <Line t={0.015} />
    </mesh>
    <mesh position={[0, 2.5, 0]}>
      <cylinderGeometry args={[0.13, 0.08, 0.28, 6]} />
      <ToonMat color="#f6e7b0" emissive="#f6e7b0" emissiveIntensity={0.3} />
      <Line t={0.015} />
    </mesh>
    <mesh position={[0, 2.7, 0]}>
      <coneGeometry args={[0.17, 0.16, 6]} />
      <ToonMat color="#2b2f36" />
      <Line t={0.012} />
    </mesh>
  </group>
);

const Bench: React.FC<{ position: V3; rotationY?: number }> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <Box size={[1.1, 0.07, 0.36]} position={[0, 0.42, 0]} color="#3f7a4a" line={0.012} />
    <Box size={[1.1, 0.3, 0.06]} position={[0, 0.66, -0.17]} color="#3f7a4a" line={0.012} />
    {[-0.45, 0.45].map((x) => (
      <Box key={x} size={[0.06, 0.42, 0.32]} position={[x, 0.21, 0]} color="#2b2f36" line={0.01} />
    ))}
  </group>
);

const FlowerBed: React.FC<{ position: V3; w?: number; seed?: number }> = ({ position, w = 1.6, seed = 1 }) => {
  const r = rng(seed);
  const cols = ["#e8505b", "#f9c74f", "#ffffff", "#c77dff"];
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]} scale={[w / 2, 0.16, 0.3]}>
        <sphereGeometry args={[1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <ToonMat color="#3f8a3a" />
        <Line t={0.015} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[(i / 8 - 0.5) * w * 0.85, 0.2 + r() * 0.04, (r() - 0.5) * 0.25]}>
          <sphereGeometry args={[0.055, 8, 6]} />
          <ToonMat color={cols[i % cols.length]} />
        </mesh>
      ))}
    </group>
  );
};

/** Far skyline strip of rooftops (no outlines so it reads as distance). */
const Skyline: React.FC<{ z: number; color: string }> = ({ z, color }) => {
  const r = rng(99);
  return (
    <>
      {Array.from({ length: 22 }, (_, i) => {
        const w = 2 + r() * 3;
        const h = 2 + r() * 4;
        return (
          <mesh key={i} position={[-40 + i * 3.8 + r(), h / 2, z - r() * 3]}>
            <boxGeometry args={[w, h, 2]} />
            <ToonMat color={color} />
          </mesh>
        );
      })}
    </>
  );
};

const Birds: React.FC<{ t: number }> = ({ t }) => (
  <>
    {[0, 1, 2].map((i) => {
      const x = -12 + ((t * 1.6 + i * 3) % 24);
      const flap = Math.sin(t * 9 + i) * 0.5;
      return (
        <group key={i} position={[x, 13 + i * 1.2 + Math.sin(t + i) * 0.3, -24 - i * 2]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[sd * 0.22, 0, 0]} rotation={[0, 0, sd * flap]}>
              <boxGeometry args={[0.45, 0.05, 0.05]} />
              <meshBasicMaterial color="#1d1d24" />
            </mesh>
          ))}
        </group>
      );
    })}
  </>
);

const rug = (key: string, base: string, border: string) =>
  canvasTex(key, 512, 384, (ctx, w, h) => {
    ctx.fillStyle = border;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = base;
    ctx.fillRect(22, 22, w - 44, h - 44);
    ctx.strokeStyle = border;
    ctx.lineWidth = 6;
    ctx.strokeRect(46, 46, w - 92, h - 92);
    ctx.fillStyle = border;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 70, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 50, 32, 0, 0, Math.PI * 2);
    ctx.fill();
  });

/* ------------------------------------------------------------------ Paris / Champ de Mars */

export const ParisSet: React.FC<{ rusty?: boolean; t?: number }> = ({ rusty, t = 0 }) => {
  const r = rng(12);
  return (
    <>
      <hemisphereLight args={[rusty ? "#c6cedc" : "#e6f1ff", "#8a7a5a", rusty ? 1.2 : 1.5]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 8, 6]} intensity={rusty ? 0.9 : 1.8} color={rusty ? "#e6e6ee" : "#fff1d6"} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -20]}>
        <planeGeometry args={[120, 80]} />
        <ToonMat color={rusty ? "#6f9356" : "#69b34c"} map={speckled("grass", "#ffffff", 5, [30, 20])} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -10]}>
        <planeGeometry args={[3, 40]} />
        <ToonMat color={rusty ? "#bfae8a" : "#e2cf9c"} map={speckled("path", "#ffffff", 7, [2, 20])} />
      </mesh>
      <EiffelTower position={[0, 0, -16]} scale={1.65} color={rusty ? "#9a4a24" : "#8a5a3a"} />
      {[-1, 1].map((s) =>
        [-2, -5, -8, -11].map((z) => <Tree key={`${s}${z}`} position={[s * 3.0, 0, z]} scale={1.2 + r() * 0.2} color={rusty ? "#5c8a48" : "#4f9a3c"} />),
      )}
      <fog attach="fog" args={[rusty ? "#b9c1cf" : "#cfe6fb", 28, 110]} />
      {[-1, 1].map((s) => [-3.2, -7.6].map((z) => <LampPost key={`l${s}${z}`} position={[s * 1.9, 0, z]} />))}
      <Bench position={[-2.25, 0, -1.4]} rotationY={Math.PI / 2} />
      <Bench position={[2.25, 0, -5.2]} rotationY={-Math.PI / 2} />
      <FlowerBed position={[-2.2, 0, 0.9]} seed={3} />
      <FlowerBed position={[2.3, 0, -0.6]} seed={8} />
      <Skyline z={-38} color={rusty ? "#9aa3b3" : "#a9bcd6"} />
      <Birds t={t} />
      <Building position={[-9, 0, -12]} size={[3, 5, 3]} rotationY={0.5} />
      <Building position={[-8.5, 0, -18]} size={[3, 6, 3]} wall="#e6d3ad" rotationY={0.4} />
      <Building position={[9, 0, -12]} size={[3, 5.5, 3]} wall="#f1e4c8" rotationY={-0.5} />
      <Building position={[8.5, 0, -19]} size={[3, 6, 3]} rotationY={-0.4} />
      <Cloud position={[-6 + t * 0.15, 20, -40]} scale={2} color={rusty ? "#e3e6ec" : "#ffffff"} />
      <Cloud position={[7 + t * 0.1, 25, -45]} scale={2.4} color={rusty ? "#d6dae2" : "#ffffff"} />
      <Cloud position={[2 + t * 0.12, 30, -50]} scale={1.8} color={rusty ? "#e3e6ec" : "#ffffff"} />
    </>
  );
};

/* ------------------------------------------------------------------ Office (desk) */

const windowSky = (key: string, day: boolean) =>
  canvasTex(key, 256, 320, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, day ? "#4f8be0" : "#0d1640");
    g.addColorStop(1, day ? "#cfe8ff" : "#3a4fa0");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // rooftops + tiny tower silhouette
    ctx.fillStyle = day ? "#7f8fb0" : "#1a2350";
    ctx.fillRect(0, h * 0.72, w, h);
    ctx.fillRect(20, h * 0.62, 60, h);
    ctx.fillRect(170, h * 0.66, 70, h);
    ctx.beginPath();
    ctx.moveTo(120, h * 0.72);
    ctx.lineTo(132, h * 0.3);
    ctx.lineTo(144, h * 0.72);
    ctx.fill();
    if (!day) {
      ctx.fillStyle = "#fff6d8";
      ctx.beginPath();
      ctx.arc(w * 0.75, h * 0.2, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  });

export const OfficeWindow: React.FC<{ position: V3; day: boolean }> = ({ position, day }) => (
  <group position={position}>
    <mesh position={[0, 0, -0.01]}>
      <planeGeometry args={[0.9, 1.15]} />
      <meshBasicMaterial map={windowSky(`win-${day}`, day)} />
    </mesh>
    <Box size={[1.05, 0.09, 0.1]} position={[0, 0.6, 0]} color="#4b2c19" />
    <Box size={[1.05, 0.12, 0.16]} position={[0, -0.6, 0.02]} color="#4b2c19" />
    <Box size={[0.09, 1.25, 0.1]} position={[-0.5, 0, 0]} color="#4b2c19" />
    <Box size={[0.09, 1.25, 0.1]} position={[0.5, 0, 0]} color="#4b2c19" />
    <Box size={[0.04, 1.15, 0.06]} color="#4b2c19" line={0.01} />
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.68, 0, 0.08]} scale={[1, 1, 0.5]}>
        <capsuleGeometry args={[0.16, 1.2, 6, 12]} />
        <ToonMat color="#7a1f2b" />
        <Line t={0.015} />
      </mesh>
    ))}
  </group>
);

export const OfficeSet: React.FC<{ day?: boolean; clockHours?: number; lamp?: boolean; desk?: boolean }> = ({
  day = false,
  clockHours = 3.2,
  lamp = true,
  desk = true,
}) => (
  <>
    <fog attach="fog" args={[day ? "#e9d8c0" : "#2a2034", 5, 22]} />
    <ambientLight intensity={day ? 0.75 : 0.55} color={day ? "#ffffff" : "#8f84a8"} />
    <directionalLight position={[2, 4, 4]} intensity={day ? 1.3 : 0.35} color={day ? "#fff1d6" : "#9fb0ff"} />
    {lamp && <pointLight position={[-0.7, 1.5, 0.9]} intensity={day ? 0 : 4} decay={1.3} color="#ffd9a0" />}
    <Box size={[8, 5, 0.12]} position={[0, 2.2, -1.3]} map={damask(`dmk-office`, "#2f5a4a", "#3d6e5c")} color="#ffffff" line={0} />
    <Box size={[0.12, 5, 6]} position={[-2.6, 2.2, 1.2]} map={damask(`dmk-office`, "#2f5a4a", "#3d6e5c")} color="#ffffff" line={0} />
    <Box size={[8, 0.7, 0.16]} position={[0, 0.35, -1.22]} map={planks("wains", "#6b3f22", 8, 3)} color="#ffffff" line={0.02} />
    <Box size={[8, 0.1, 6]} position={[0, -0.05, 1.2]} map={planks("officefloor", "#7a4a2a", 6, 9, [3, 3])} color="#ffffff" line={0} />
    <OfficeWindow position={[1.0, 2.0, -1.22]} day={day} />
    <group position={[-1.95, 0, -1.0]}>
      <Box size={[1.1, 2.6, 0.4]} position={[0, 1.3, 0]} color="#5a3420" line={0.02} />
      {[0.55, 1.15, 1.75, 2.3].map((y, row) =>
        Array.from({ length: 7 }, (_, i) => (
          <mesh key={`${row}${i}`} position={[-0.42 + i * 0.14, y + 0.17, 0.12]} rotation={[0, 0, i === 5 ? 0.25 : 0]}>
            <boxGeometry args={[0.1, 0.34 - ((i + row) % 3) * 0.05, 0.26]} />
            <ToonMat color={["#8c1f2d", "#2f5a7a", "#c99a3a", "#3f7a4a", "#6b3f22"][(i + row) % 5]} />
          </mesh>
        )),
      )}
      {[0.4, 1.0, 1.6, 2.2].map((y) => (
        <Box key={y} size={[1.0, 0.05, 0.36]} position={[0, y, 0.04]} color="#4b2c19" line={0.008} />
      ))}
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0.004, 0.9]}>
      <planeGeometry args={[3.2, 2.2]} />
      <ToonMat map={rug("office-rug", "#7a2533", "#d9a93a")} />
    </mesh>
    <WallClock position={[-0.9, 2.35, -1.2]} hours={clockHours} />
    {/* door on left wall */}
    <group position={[-2.52, 1.15, 0.9]} rotation={[0, Math.PI / 2, 0]}>
      <Box size={[1.0, 2.3, 0.08]} map={planks("door", "#5a3420", 3, 2)} color="#ffffff" line={0.02} />
      <mesh position={[0.35, 0, 0.07]}>
        <sphereGeometry args={[0.05, 12, 8]} />
        <ToonMat color="#d9a93a" />
        <Line t={0.01} />
      </mesh>
    </group>
    {desk && (
      <>
        <Box size={[2.4, 0.08, 1.0]} position={[0, 0.86, 0.6]} map={planks("desk", "#9a5a2e", 4, 21)} color="#ffffff" line={0.025} />
        <Box size={[2.3, 0.82, 0.08]} position={[0, 0.41, 1.06]} map={planks("deskfront", "#7a4423", 5, 5)} color="#ffffff" line={0.025} />
        {lamp && <DeskLamp position={[-0.85, 0.9, 0.7]} on={day ? 0 : 1} />}
      </>
    )}
  </>
);

/* ------------------------------------------------------------------ Hotel exterior */

export const HotelFacade: React.FC = () => (
  <>
    <hemisphereLight args={["#e6f1ff", "#8a6a4a", 1.4]} />
    <ambientLight intensity={0.35} />
    <directionalLight position={[3, 6, 6]} intensity={1.6} color="#fff1d6" />
    <mesh position={[0, 4.5, -1.2]}>
      <boxGeometry args={[12, 9, 0.3]} />
      <ToonMat color="#efe2c4" />
    </mesh>
    {/* columns */}
    {[-3.6, -1.6, 1.6, 3.6].map((x) => (
      <mesh key={x} position={[x, 3, -0.9]}>
        <cylinderGeometry args={[0.22, 0.25, 6, 16]} />
        <ToonMat color="#f6ecd4" />
        <Line t={0.025} />
      </mesh>
    ))}
    <Box size={[9, 0.35, 0.6]} position={[0, 6.1, -0.9]} color="#e6d3ad" line={0.03} />
    {/* arched windows */}
    {[-2.6, 2.6].map((x) =>
      [1.8, 4.3].map((y) => (
        <group key={`${x}${y}`} position={[x, y, -1.04]}>
          <Box size={[0.9, 1.4, 0.06]} color="#2b3d63" line={0.02} />
          <mesh position={[0, 0.7, 0]}>
            <circleGeometry args={[0.45, 20, 0, Math.PI]} />
            <ToonMat color="#2b3d63" />
          </mesh>
          <Box size={[1.1, 0.1, 0.2]} position={[0, -0.75, 0.05]} color="#e6d3ad" line={0.015} />
        </group>
      )),
    )}
    {/* door + sign */}
    <Box size={[1.6, 2.6, 0.1]} position={[0, 1.3, -1.0]} color="#3b2414" line={0.03} />
    <Box size={[0.06, 2.4, 0.12]} position={[0, 1.3, -0.94]} color="#d9a93a" line={0.01} />
    <mesh position={[0, 3.2, -0.92]}>
      <planeGeometry args={[3.2, 0.6]} />
      <meshToonMaterial
        map={textTex("hotelsign", [{ text: "HÔTEL DE CRILLON", size: 64, color: "#e8c25a" }], { w: 1024, h: 192, bg: "#1d2a3a", border: "#e8c25a" })}
        gradientMap={toonGradient()}
      />
    </mesh>
    {/* awning */}
    <mesh position={[0, 2.85, -0.45]} rotation={[0.5, 0, 0]}>
      <boxGeometry args={[2.4, 0.06, 1.1]} />
      <ToonMat color="#a3202e" />
      <Line t={0.02} />
    </mesh>
    {/* steps + red carpet */}
    <Box size={[3, 0.12, 0.8]} position={[0, 0.06, -0.6]} color="#d8cbb0" line={0.02} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 2]}>
      <planeGeometry args={[1.3, 6]} />
      <ToonMat color="#b3202e" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]}>
      <planeGeometry args={[30, 12]} />
      <ToonMat color="#cfc4ac" map={speckled("pavement", "#ffffff", 21, [8, 4])} />
    </mesh>
    {/* tricolour flags */}
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 2.6, 6.4, -0.8]} rotation={[0, 0, s * -0.5]}>
        <Stick a={[0, 0, 0]} b={[0, 1.6, 0]} r={0.03} color="#2b2f36" />
        {["#2a4ea8", "#ffffff", "#d23b3b"].map((c, i) => (
          <mesh key={c} position={[s * (0.17 + i * 0.3), 1.35, 0.02]}>
            <planeGeometry args={[0.3, 0.55]} />
            <meshToonMaterial color={c} gradientMap={toonGradient()} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    ))}
    {[-2.6, 2.6].map((x) => (
      <group key={x} position={[x, 1.04, -0.92]}>
        <Box size={[1.0, 0.18, 0.22]} color="#5a3420" line={0.012} />
        {[-0.35, -0.12, 0.12, 0.35].map((dx, i) => (
          <mesh key={dx} position={[dx, 0.14, 0]}>
            <sphereGeometry args={[0.08, 8, 6]} />
            <ToonMat color={i % 2 ? "#e8505b" : "#f9c74f"} />
          </mesh>
        ))}
      </group>
    ))}
    {/* topiaries */}
    {[-1.3, 1.3].map((x) => (
      <group key={x} position={[x, 0, -0.3]}>
        <Box size={[0.5, 0.5, 0.5]} position={[0, 0.25, 0]} color="#3b3b44" line={0.015} />
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[0.42, 20, 14]} />
          <ToonMat color="#3f8a3a" />
          <Line t={0.02} />
        </mesh>
      </group>
    ))}
  </>
);

/* ------------------------------------------------------------------ Hotel suite (meeting room) */

export const SEATS = {
  // where seated dealers sit around the table [x, z, rotationY]
  leftEnd: [-1.95, -0.05, Math.PI / 2] as const,
  rightEnd: [1.95, -0.05, -Math.PI / 2] as const,
  nearL: [-0.85, 1.05, Math.PI] as const,
  farL: [-1.0, -1.0, 0] as const,
  nearR: [0.85, 1.05, Math.PI] as const,
};

export const SuiteSet: React.FC<{ dim?: number; table?: boolean; chairs?: boolean; nearChairs?: boolean; doorOpen?: number }> = ({
  dim = 0,
  table = true,
  chairs = true,
  nearChairs = true,
  doorOpen = 0,
}) => {
  const wall = damask("dmk-suite", "#7a2533", "#8e3342");
  return (
    <>
      <fog attach="fog" args={["#4a2a26", 6, 24]} />
      <ambientLight intensity={0.75 - dim * 0.3} color="#fff0e0" />
      <directionalLight position={[2, 5, 4]} intensity={1.1 - dim * 0.5} color="#fff1d6" />
      <directionalLight position={[-3, 3, -2]} intensity={0.4} color="#ffd8a8" />
      <pointLight position={[0, 2.6, 0]} intensity={2.2 - dim * 1.2} decay={1.2} color="#ffd9a0" />
      {/* walls */}
      <Box size={[9, 4, 0.12]} position={[0, 1.9, -3]} map={wall} color="#ffffff" line={0} />
      {/* front wall, split around the doorway (x -2.2..-1.0, y 0..2.5) */}
      <Box size={[2.3, 4, 0.12]} position={[-3.35, 1.9, 4.2]} map={wall} color="#ffffff" line={0} />
      <Box size={[5.5, 4, 0.12]} position={[1.75, 1.9, 4.2]} map={wall} color="#ffffff" line={0} />
      <Box size={[1.2, 0.95, 0.12]} position={[-1.6, 3.425, 4.2]} map={wall} color="#ffffff" line={0} />
      <Box size={[0.12, 4, 7.4]} position={[-4.2, 1.9, 0.6]} map={wall} color="#ffffff" line={0} />
      <Box size={[0.12, 4, 7.4]} position={[4.2, 1.9, 0.6]} map={wall} color="#ffffff" line={0} />
      <Box size={[9, 0.9, 0.08]} position={[0, 0.45, -2.92]} color="#f0e3c6" line={0.02} />
      <Box size={[2.3, 0.9, 0.08]} position={[-3.35, 0.45, 4.12]} color="#f0e3c6" line={0.02} />
      <Box size={[5.5, 0.9, 0.08]} position={[1.75, 0.45, 4.12]} color="#f0e3c6" line={0.02} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
        <planeGeometry args={[9, 7.6]} />
        <ToonMat map={planks("parquet", "#9a6236", 8, 15, [3, 3])} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.1]}>
        <planeGeometry args={[5.2, 3.8]} />
        <ToonMat map={rug("suite-rug", "#2d4a7a", "#d9a93a")} />
      </mesh>
      <Box size={[9, 0.18, 0.2]} position={[0, 3.82, -2.9]} color="#f0e3c6" line={0.015} />
      <Box size={[9, 0.18, 0.2]} position={[0, 3.82, 4.08]} color="#f0e3c6" line={0.015} />
      {[-3.4, 3.4].map((x) => (
        <group key={x} position={[x, 2.25, -2.88]}>
          <Box size={[0.12, 0.3, 0.08]} color="#d9a93a" line={0.01} />
          <mesh position={[0, 0.22, 0.08]} scale={[0.05, 0.08, 0.05]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color="#ffe3a0" />
          </mesh>
          <Glow color="rgba(255,214,140,0.45)" size={1.2} position={[0, 0.2, 0.12]} />
        </group>
      ))}
      {/* back wall: window with drapes + portrait */}
      <group position={[-2.1, 2.0, -2.92]}>
        <OfficeWindow position={[0, 0, 0]} day />
      </group>
      <group position={[1.9, 2.15, -2.92]}>
        <Box size={[1.0, 1.2, 0.06]} color="#c99a3a" line={0.02} />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[0.8, 1.0]} />
          <meshToonMaterial
            map={textTex("painting", [{ text: "", size: 10 }], { w: 64, h: 80, bg: "#4f7a8a" })}
            gradientMap={toonGradient()}
          />
        </mesh>
      </group>
      {/* front wall: door + mirror */}
      {/* door (hinged at its left edge) + lit hallway behind it */}
      <mesh position={[-1.6, 1.25, 6.5]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#f2c879" />
      </mesh>
      <group position={[-1.0, 1.475, 4.06]} rotation={[0, doorOpen * 1.6, 0]}>
        <group position={[-0.6, 0, 0]} rotation={[0, Math.PI, 0]}>
          <Box size={[1.2, 2.95, 0.08]} map={planks("door2", "#f0e3c6", 2, 4)} color="#ffffff" line={0.02} />
          <mesh position={[-0.42, 0, 0.07]}>
            <sphereGeometry args={[0.05, 12, 8]} />
            <ToonMat color="#d9a93a" />
          </mesh>
        </group>
      </group>
      <group position={[1.6, 2.1, 4.1]} rotation={[0, Math.PI, 0]}>
        <Box size={[1.1, 1.4, 0.06]} color="#c99a3a" line={0.02} />
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[0.9, 1.2]} />
          <meshBasicMaterial color="#b9d4e0" />
        </mesh>
      </group>
      <Chandelier position={[0, 3.0, 0]} />
      {table && (
        <>
          <Box size={[3.4, 0.09, 1.4]} position={[0, 0.82, 0]} map={planks("table", "#5a2f18", 6, 31)} color="#ffffff" line={0.03} />
          {[
            [-1.5, -0.55],
            [1.5, -0.55],
            [-1.5, 0.55],
            [1.5, 0.55],
          ].map(([x, z], i) => (
            <Box key={i} size={[0.1, 0.8, 0.1]} position={[x, 0.4, z]} color="#3b1f10" line={0.015} />
          ))}
          <mesh position={[0, 0.875, 0]}>
            <boxGeometry args={[2.6, 0.01, 0.5]} />
            <ToonMat color="#e9dcc0" />
          </mesh>
          {[-1.25, 1.25].map((x) => (
            <group key={x} position={[x, 0.88, -0.35]}>
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.05, 14]} />
                <ToonMat color="#d9a93a" />
                <Line t={0.008} />
              </mesh>
              <Stick a={[0, 0.03, 0]} b={[0, 0.3, 0]} r={0.018} color="#d9a93a" />
              {[-0.1, 0, 0.1].map((dx) => (
                <group key={dx} position={[dx, 0.33 + (dx === 0 ? 0.04 : 0), 0]}>
                  <mesh>
                    <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} />
                    <ToonMat color="#fff4dc" />
                  </mesh>
                  <mesh position={[0, 0.09, 0]} scale={[0.018, 0.035, 0.018]}>
                    <sphereGeometry args={[1, 8, 6]} />
                    <meshBasicMaterial color="#ffc04a" />
                  </mesh>
                </group>
              ))}
              <Box size={[0.24, 0.025, 0.03]} position={[0, 0.27, 0]} color="#d9a93a" line={0} />
            </group>
          ))}
          <mesh position={[-0.35, 0.882, -0.42]} rotation={[-Math.PI / 2, 0, 0.2]}>
            <planeGeometry args={[0.32, 0.42]} />
            <meshToonMaterial map={letterheadTex()} gradientMap={toonGradient()} />
          </mesh>
        </>
      )}
      {chairs &&
        Object.entries(SEATS)
          .filter(([name]) => nearChairs || !name.startsWith("near"))
          .map(([, [x, z, ry]], i) => (
          <Chair key={i} position={[x + Math.sin(ry) * -0.1, 0, z + Math.cos(ry) * -0.1]} rotationY={ry} />
        ))}
      {chairs && <Chair position={[0, 0, -1.25]} rotationY={0} />}
    </>
  );
};

/* ------------------------------------------------------------------ Train */

export const TrainSet: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => {
  const speed = 5.5; // units / s
  const wrap = (x: number, len: number) => ((((x % len) + len) % len) - len / 2);
  const bob = Math.sin(t * 22) * 0.012;
  const grass = speckled("traingrass", "#ffffff", 17, [12, 4]);
  grass.offset.x = (t * speed) / 10;
  return (
    <>
      <hemisphereLight args={["#ffe6cc", "#7a6a4a", 1.3]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 5, 5]} intensity={1.5} color="#ffd9a8" />
      {/* ground (scrolling texture) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, -15]}>
        <planeGeometry args={[120, 40]} />
        <ToonMat color="#7fae4a" map={grass} />
      </mesh>
      <fog attach="fog" args={["#ffcf9e", 30, 120]} />
      {[-30, -8, 14, 36].map((x, i) => (
        <mesh key={x} position={[x + ((t * speed * 0.08) % 44), -0.6, -38 - (i % 2) * 6]} scale={[14, 5 + (i % 2) * 2, 6]}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <ToonMat color={i % 2 ? "#6f9a52" : "#7fae5a"} />
        </mesh>
      ))}
      {/* track bed */}
      <Box size={[200, 0.2, 1.8]} position={[0, -0.5, 0]} color="#8a7a66" line={0} />
      {/* fence posts (fast) */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = wrap(i * 2.2 + t * speed, 22);
        return <Box key={`f${i}`} size={[0.1, 0.7, 0.1]} position={[x, -0.2, 2.2]} color="#7a4a28" line={0.015} />;
      })}
      {/* telegraph poles + trees (parallax) */}
      {Array.from({ length: 5 }, (_, i) => {
        const x = wrap(i * 6 + t * speed * 0.7, 30);
        return <Box key={`p${i}`} size={[0.12, 4, 0.12]} position={[x, 1.4, -3]} color="#5a3a22" line={0.02} />;
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const x = wrap(i * 5 + 1.3 + t * speed * 0.45, 40);
        return <Tree key={`t${i}`} position={[x, -0.6, -7 - (i % 3)]} scale={1.3 + (i % 2) * 0.4} />;
      })}
      <Cloud position={[-8 + t * 0.6, 14, -50]} scale={2} />
      <Cloud position={[10 + t * 0.6, 18, -55]} scale={2.4} />

      {/* carriage (static in frame, slight bob) */}
      <group position={[0, bob, 0]}>
        <Box size={[4.2, 0.85, 1.6]} position={[0, 0.62, 0]} color="#2f5d3a" line={0.03} />
        <Box size={[4.3, 0.08, 1.65]} position={[0, 1.06, 0.01]} color="#d9a93a" line={0.01} />
        <Box size={[4.2, 2.5, 0.08]} position={[0, 1.45, -0.78]} color="#5a3420" line={0.02} />
        {[-2.05, -0.75, 0.75, 2.05].map((x) => (
          <Box key={x} size={[0.18, 1.4, 0.12]} position={[x, 1.78, 0.76]} color="#2f5d3a" line={0.02} />
        ))}
        <Box size={[4.5, 0.22, 1.9]} position={[0, 2.58, 0]} color="#1f3d27" line={0.03} />
        <mesh position={[0, 2.68, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.25, 1, 1]}>
          <cylinderGeometry args={[0.95, 0.95, 4.4, 20, 1, false, 0, Math.PI]} />
          <ToonMat color="#1f3d27" />
          <Line t={0.03} />
        </mesh>
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 0.08, 0.82]} rotation={[Math.PI / 2, t * 18, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
            <ToonMat color="#2a2a2a" />
            <Line t={0.015} />
          </mesh>
        ))}
        {children}
      </group>
      {/* smoke puffs from the (off-screen) locomotive */}
      {Array.from({ length: 6 }, (_, i) => {
        const k = ((t * 0.9 + i / 6) % 1 + 1) % 1;
        return (
          <mesh key={`s${i}`} position={[-3.6 + k * 7, 3.0 + k * 1.4, -0.2]} scale={0.25 + k * 0.6}>
            <sphereGeometry args={[1, 16, 12]} />
            <ToonMat color="#eeeeee" transparent opacity={0.9 - k * 0.7} />
          </mesh>
        );
      })}
    </>
  );
};

/* ------------------------------------------------------------------ Scrapyard */

export const ScrapyardSet: React.FC = () => {
  const r = rng(77);
  const junk = Array.from({ length: 26 }, () => ({
    x: (r() - 0.5) * 9,
    z: -2.5 - r() * 4,
    s: 0.2 + r() * 0.5,
    kind: Math.floor(r() * 3),
    c: ["#7d838c", "#9a5a3a", "#5d6670", "#a8794a"][Math.floor(r() * 4)],
    ry: r() * 3,
  }));
  return (
    <>
      <hemisphereLight args={["#cfd6e6", "#6a5a48", 1.2]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} color="#f0f0ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -5]}>
        <planeGeometry args={[60, 30]} />
        <ToonMat color="#9a8466" map={speckled("dirt", "#ffffff", 31, [10, 5])} />
      </mesh>
      {junk.map((j, i) => (
        <mesh key={i} position={[j.x, j.s * 0.6, j.z]} rotation={[j.ry, j.ry * 2, 0]}>
          {j.kind === 0 ? (
            <cylinderGeometry args={[j.s * 0.5, j.s * 0.5, j.s * 1.6, 12]} />
          ) : j.kind === 1 ? (
            <boxGeometry args={[j.s * 1.4, j.s, j.s]} />
          ) : (
            <torusGeometry args={[j.s * 0.6, j.s * 0.18, 8, 16]} />
          )}
          <ToonMat color={j.c} />
          <Line t={0.02} />
        </mesh>
      ))}
      {[-2.4, 2.6].map((x, i) => (
        <mesh key={x} position={[x, 0.8, -4.5]} scale={[2.2, 1.2, 1.4]}>
          <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <ToonMat color={i ? "#7d6a58" : "#6f747c"} />
          <Line t={0.03} />
        </mesh>
      ))}
      <mesh position={[0, 2.2, -7]}>
        <planeGeometry args={[30, 4.5]} />
        <ToonMat color="#8a8f99" map={planks("fence", "#8a8f99", 14, 4, [4, 1])} />
      </mesh>
      <group position={[-1.8, 0, -1.5]}>
        <mesh position={[0, 1.7, 0]}>
          <planeGeometry args={[1.8, 0.7]} />
          <meshToonMaterial
            map={textTex(
              "yardsign",
              [
                { text: "POISSON & CIE", size: 54, color: "#1d2a3a" },
                { text: "FERRAILLE", size: 40, color: "#a3202e" },
              ],
              { w: 512, h: 200, bg: "#efe2c4", border: "#1d2a3a" },
            )}
            gradientMap={toonGradient()}
          />
        </mesh>
        <Box size={[0.08, 1.4, 0.08]} position={[-0.6, 0.7, -0.05]} color="#7a4a28" line={0.012} />
        <Box size={[0.08, 1.4, 0.08]} position={[0.6, 0.7, -0.05]} color="#7a4a28" line={0.012} />
      </group>
    </>
  );
};
