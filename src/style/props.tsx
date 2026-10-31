import * as THREE from "three";
import { INK, Ink, Line, Stick, ToonMat, toonGradient } from "./toon";
import { canvasTex, glow, rng, shade } from "./textures";

type V3 = [number, number, number];

/* ---------------------------------------------------------------- text */

/** Canvas texture with centered text lines (signs, letters, newspapers). Uses a system serif for a period feel. */
export const textTex = (
  key: string,
  lines: { text: string; size: number; color?: string; weight?: string; font?: string }[],
  opts: { w?: number; h?: number; bg?: string; border?: string } = {},
) =>
  canvasTex(key, opts.w ?? 512, opts.h ?? 256, (ctx, w, h) => {
    ctx.fillStyle = opts.bg ?? "#f3e6c8";
    ctx.fillRect(0, 0, w, h);
    if (opts.border) {
      ctx.strokeStyle = opts.border;
      ctx.lineWidth = 14;
      ctx.strokeRect(10, 10, w - 20, h - 20);
    }
    const total = lines.reduce((a, l) => a + l.size * 1.15, 0);
    let y = (h - total) / 2;
    for (const l of lines) {
      ctx.font = `${l.weight ?? "bold"} ${l.size}px ${l.font ?? "Georgia, 'DejaVu Serif', serif"}`;
      ctx.fillStyle = l.color ?? INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(l.text, w / 2, y);
      y += l.size * 1.15;
    }
  });

/** A sign board on a post. */
export const Sign: React.FC<{ tex: THREE.Texture; w?: number; h?: number; post?: number; position?: V3; rotation?: V3; scale?: number }> = ({
  tex,
  w = 1.1,
  h = 0.55,
  post = 1.3,
  position,
  rotation,
  scale = 1,
}) => (
  <group position={position} rotation={rotation} scale={scale}>
    {post > 0 && (
      <mesh position={[0, post / 2, -0.03]}>
        <boxGeometry args={[0.07, post, 0.07]} />
        <ToonMat color="#7a4a28" />
        <Line t={0.012} />
      </mesh>
    )}
    <mesh position={[0, post + h / 2 - 0.1, 0]}>
      <boxGeometry args={[w, h, 0.05]} />
      <meshToonMaterial attach="material-0" color="#7a4a28" gradientMap={toonGradient()} />
      <meshToonMaterial attach="material-1" color="#7a4a28" gradientMap={toonGradient()} />
      <meshToonMaterial attach="material-2" color="#7a4a28" gradientMap={toonGradient()} />
      <meshToonMaterial attach="material-3" color="#7a4a28" gradientMap={toonGradient()} />
      <meshToonMaterial attach="material-4" map={tex} gradientMap={toonGradient()} />
      <meshToonMaterial attach="material-5" color="#7a4a28" gradientMap={toonGradient()} />
      <Line t={0.018} />
    </mesh>
  </group>
);

/* ---------------------------------------------------------------- nature / city */

export const Cloud: React.FC<{ position: V3; scale?: number; color?: string }> = ({ position, scale = 1, color = "#ffffff" }) => (
  <group position={position} scale={scale}>
    {(
      [
        [0, 0, 0, 1.4],
        [1.5, -0.3, 0, 1.0],
        [-1.5, -0.35, 0, 1.05],
        [0.7, 0.7, 0, 0.95],
        [-0.6, 0.55, 0, 0.9],
      ] as const
    ).map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 24, 16]} />
        <ToonMat color={color} emissive={color} emissiveIntensity={0.3} />
        <Line t={0.06} />
      </mesh>
    ))}
  </group>
);

export const Tree: React.FC<{ position: V3; scale?: number; color?: string }> = ({ position, scale = 1, color = "#4f9a3c" }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.09, 0.12, 1, 10]} />
      <ToonMat color="#6b4426" />
      <Line t={0.02} />
    </mesh>
    <mesh position={[0, 1.35, 0]} scale={[1, 1.1, 1]}>
      <sphereGeometry args={[0.6, 20, 14]} />
      <ToonMat color={color} />
      <Line t={0.03} />
    </mesh>
  </group>
);

const facadeTex = (key: string, wall: string) =>
  canvasTex(key, 256, 512, (ctx, w, h) => {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 3; col++) {
        const x = 26 + col * 78;
        const y = 40 + row * 92;
        ctx.fillStyle = "#2b3d63";
        ctx.fillRect(x, y, 48, 66);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.strokeRect(x, y, 48, 66);
        ctx.fillStyle = INK;
        ctx.fillRect(x - 6, y + 66, 60, 6); // balcony rail
      }
    ctx.fillStyle = shade(wall, -0.08);
    ctx.fillRect(0, h - 40, w, 40);
  });

/** Haussmann-style Paris building. */
export const Building: React.FC<{ position: V3; size?: V3; wall?: string; rotationY?: number }> = ({
  position,
  size = [2.4, 4.5, 2],
  wall = "#efe2c4",
  rotationY = 0,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, size[1] / 2, 0]}>
      <boxGeometry args={size} />
      <ToonMat map={facadeTex(`facade-${wall}`, wall)} />
      <Line t={0.03} />
    </mesh>
    <mesh position={[0, size[1] + 0.35, 0]}>
      <boxGeometry args={[size[0] * 0.92, 0.7, size[2] * 0.85]} />
      <ToonMat color="#5f6f8c" />
      <Line t={0.03} />
    </mesh>
    {[-0.6, 0.5].map((x) => (
      <mesh key={x} position={[x * size[0] * 0.5, size[1] + 0.85, 0]}>
        <boxGeometry args={[0.2, 0.4, 0.2]} />
        <ToonMat color="#b8664a" />
        <Line t={0.02} />
      </mesh>
    ))}
  </group>
);

/* ---------------------------------------------------------------- Eiffel Tower */

const latticeTex = (key: string, color: string, repeat: [number, number]) =>
  canvasTex(
    key,
    256,
    256,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const segs: [number, number, number, number, number][] = [
        [0, 0, w, 0, 26],
        [0, h, w, h, 26],
        [0, 0, 0, h, 30],
        [w, 0, w, h, 30],
        [0, 0, w, h, 13],
        [w, 0, 0, h, 13],
        [0, h / 2, w, h / 2, 8],
      ];
      for (const pass of [0, 1])
        for (const [x1, y1, x2, y2, wd] of segs) {
          ctx.strokeStyle = pass === 0 ? INK : color;
          ctx.lineWidth = pass === 0 ? wd + 10 : wd;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
    },
    repeat,
  );

const Frustum: React.FC<{ rb: number; rt: number; h: number; y: number; color: string; rep: number }> = ({ rb, rt, h, y, color, rep }) => (
  <mesh position={[0, y + h / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
    <cylinderGeometry args={[rt, rb, h, 4, 1, true]} />
    <meshToonMaterial
      map={latticeTex(`lattice-${color}-${rep}`, color, [4, rep])}
      gradientMap={toonGradient()}
      alphaTest={0.5}
      side={THREE.DoubleSide}
    />
  </mesh>
);

/** Cartoon Eiffel Tower (~11.6 units tall at scale 1). */
export const EiffelTower: React.FC<{ position?: V3; scale?: number; color?: string; rotationY?: number }> = ({
  position,
  scale = 1,
  color = "#8a5a3a",
  rotationY = 0,
}) => {
  const dark = shade(color, -0.1);
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      <Frustum rb={2.7} rt={1.4} h={2.6} y={0} color={color} rep={2} />
      {/* base arches */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0, 0, 1.62]} rotation={[-0.2, 0, 0]}>
            <torusGeometry args={[1.0, 0.11, 8, 28, Math.PI]} />
            <ToonMat color={dark} />
            <Line t={0.03} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.68, 0]}>
        <boxGeometry args={[2.35, 0.24, 2.35]} />
        <ToonMat color={dark} />
        <Line t={0.04} />
      </mesh>
      <Frustum rb={1.2} rt={0.64} h={2.4} y={2.8} color={color} rep={3} />
      <mesh position={[0, 5.25, 0]}>
        <boxGeometry args={[1.25, 0.18, 1.25]} />
        <ToonMat color={dark} />
        <Line t={0.035} />
      </mesh>
      <Frustum rb={0.58} rt={0.16} h={5.2} y={5.34} color={color} rep={6} />
      <mesh position={[0, 10.65, 0]}>
        <boxGeometry args={[0.36, 0.28, 0.36]} />
        <ToonMat color={dark} />
        <Line t={0.025} />
      </mesh>
      <mesh position={[0, 10.9, 0]}>
        <sphereGeometry args={[0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <ToonMat color={dark} />
        <Line t={0.02} />
      </mesh>
      <Stick a={[0, 10.9, 0]} b={[0, 11.65, 0]} r={0.035} color={INK} />
    </group>
  );
};

/* ---------------------------------------------------------------- hats (head space) */

export const TopHat: React.FC<{ tilt?: number }> = ({ tilt = 0 }) => (
  <group position={[0, 0.35, 0]} rotation={[-0.05, 0, tilt]}>
    <mesh>
      <cylinderGeometry args={[0.55, 0.55, 0.035, 36]} />
      <ToonMat color="#1e1e26" />
      <Line t={0.015} />
    </mesh>
    <mesh position={[0, 0.27, 0]}>
      <cylinderGeometry args={[0.34, 0.32, 0.52, 32]} />
      <ToonMat color="#2a2a34" />
      <Line t={0.02} />
    </mesh>
    <mesh position={[0, 0.07, 0]}>
      <cylinderGeometry args={[0.326, 0.326, 0.1, 32]} />
      <ToonMat color="#8c1f2d" />
    </mesh>
  </group>
);

export const BowlerHat: React.FC<{ color?: string; down?: number }> = ({ color = "#6b4a2e", down = 0 }) => (
  <group position={[0, 0.3 - down * 0.12, 0.0 + down * 0.05]} rotation={[0.08 + down * 0.25, 0, 0]}>
    <mesh scale={[1, 0.25, 1]}>
      <sphereGeometry args={[0.56, 32, 12]} />
      <ToonMat color={shade(color, -0.05)} />
      <Line t={0.03} />
    </mesh>
    <mesh position={[0, 0.02, 0]} scale={[1, 0.95, 1]}>
      <sphereGeometry args={[0.37, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <ToonMat color={color} />
      <Line t={0.02} />
    </mesh>
    <mesh position={[0, 0.07, 0]}>
      <cylinderGeometry args={[0.375, 0.375, 0.08, 32]} />
      <ToonMat color="#2a1d14" />
    </mesh>
  </group>
);

export const FlatCap: React.FC<{ color?: string }> = ({ color = "#6d6f73" }) => (
  <group position={[0, 0.3, 0.02]} rotation={[0.15, 0, 0]}>
    <mesh scale={[1, 0.38, 1.05]}>
      <sphereGeometry args={[0.47, 28, 16]} />
      <ToonMat color={color} />
      <Line t={0.03} />
    </mesh>
    <mesh position={[0, -0.03, 0.42]} rotation={[0.25, 0, 0]} scale={[1, 0.25, 0.6]}>
      <sphereGeometry args={[0.32, 20, 10]} />
      <ToonMat color={shade(color, -0.06)} />
      <Line t={0.015} />
    </mesh>
  </group>
);

export const Beret: React.FC<{ color?: string }> = ({ color = "#1f2a44" }) => (
  <group position={[0.05, 0.36, 0]} rotation={[0, 0, -0.28]}>
    <mesh scale={[1, 0.26, 1]}>
      <sphereGeometry args={[0.5, 28, 14]} />
      <ToonMat color={color} />
      <Line t={0.03} />
    </mesh>
    <mesh position={[0, 0.14, 0]}>
      <cylinderGeometry args={[0.025, 0.025, 0.08, 8]} />
      <ToonMat color={color} />
    </mesh>
  </group>
);

/* ---------------------------------------------------------------- outfit details (body space) */

/** White shirt V + tie for suits. */
export const SuitFront: React.FC<{ tie?: string; shirt?: string }> = ({ tie = "#b3202e", shirt = "#ffffff" }) => (
  <group position={[0, 0, 0.255]}>
    <mesh position={[0, 0.98, 0]} rotation={[0, 0, Math.PI]}>
      <circleGeometry args={[0.13, 3]} />
      <meshBasicMaterial color={shirt} />
    </mesh>
    <mesh position={[0, 0.94, 0.005]} scale={[0.035, 0.09, 1]} rotation={[0, 0, Math.PI / 4]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color={tie} />
    </mesh>
    <mesh position={[0, 0.98, 0.006]}>
      <circleGeometry args={[0.022, 12]} />
      <meshBasicMaterial color={shade(tie, -0.1)} />
    </mesh>
  </group>
);

export const BowTie: React.FC<{ color?: string }> = ({ color = "#c0392b" }) => (
  <group position={[0, 1.0, 0.26]}>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.05, 0, 0]} rotation={[0, 0, (s * Math.PI) / 2]}>
        <circleGeometry args={[0.05, 3]} />
        <meshBasicMaterial color={color} />
      </mesh>
    ))}
  </group>
);

/* ---------------------------------------------------------------- money & paper */

const billTex = () =>
  canvasTex("bill", 128, 64, (ctx, w, h) => {
    ctx.fillStyle = "#7fbf6a";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#2f6b2a";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = "#2f6b2a";
    ctx.font = "bold 34px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F", w / 2, h / 2 + 2);
  });

export const CashStack: React.FC<{ position?: V3; rotation?: V3; n?: number }> = ({ position, rotation, n = 4 }) => (
  <group position={position} rotation={rotation}>
    {Array.from({ length: n }, (_, i) => (
      <mesh key={i} position={[(i % 2) * 0.02, i * 0.025, 0]} rotation={[0, i * 0.15, 0]}>
        <boxGeometry args={[0.32, 0.022, 0.16]} />
        <meshToonMaterial attach="material-0" color="#7fbf6a" gradientMap={toonGradient()} />
        <meshToonMaterial attach="material-1" color="#7fbf6a" gradientMap={toonGradient()} />
        <meshToonMaterial attach="material-2" map={billTex()} gradientMap={toonGradient()} />
        <meshToonMaterial attach="material-3" color="#7fbf6a" gradientMap={toonGradient()} />
        <meshToonMaterial attach="material-4" color="#7fbf6a" gradientMap={toonGradient()} />
        <meshToonMaterial attach="material-5" color="#7fbf6a" gradientMap={toonGradient()} />
        <Line t={0.008} />
      </mesh>
    ))}
  </group>
);

export const Suitcase: React.FC<{ position?: V3; rotation?: V3; open?: number; scale?: number }> = ({ position, rotation, open = 0, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.62, 0.42, 0.18]} />
      <ToonMat color="#8a4f2a" />
      <Line t={0.015} />
    </mesh>
    {[-0.2, 0.2].map((x) => (
      <mesh key={x} position={[x, 0, 0]}>
        <boxGeometry args={[0.05, 0.43, 0.19]} />
        <ToonMat color="#5a321b" />
      </mesh>
    ))}
    <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI]} />
      <Ink />
    </mesh>
    {[-0.16, 0.0, 0.14].map((x, i) => (
      <mesh key={x} position={[x, 0.21 + open * 0.06, 0.02]} rotation={[0, 0, (i - 1) * 0.3]}>
        <boxGeometry args={[0.16, 0.12 + open * 0.08, 0.02]} />
        <ToonMat color="#7fbf6a" />
        <Line t={0.006} />
      </mesh>
    ))}
  </group>
);

export const Envelope: React.FC<{ position?: V3; rotation?: V3 }> = ({ position, rotation }) => (
  <group position={position} rotation={rotation}>
    <mesh>
      <boxGeometry args={[0.42, 0.07, 0.26]} />
      <ToonMat color="#e9d9b0" />
      <Line t={0.01} />
    </mesh>
    {[-0.1, 0.02, 0.12].map((x, i) => (
      <mesh key={x} position={[x, 0.02, -0.12]} rotation={[0.3, i * 0.2 - 0.2, 0]}>
        <boxGeometry args={[0.14, 0.012, 0.12]} />
        <ToonMat color="#7fbf6a" />
        <Line t={0.005} />
      </mesh>
    ))}
  </group>
);

export const letterheadTex = () =>
  canvasTex("letterhead", 256, 340, (ctx, w, h) => {
    ctx.fillStyle = "#f7f0dc";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1f3f8f";
    ctx.textAlign = "center";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText("RÉPUBLIQUE FRANÇAISE", w / 2, 36);
    ctx.font = "italic 15px Georgia, serif";
    ctx.fillText("Ministère des Postes", w / 2, 60);
    ctx.fillText("et Télégraphes", w / 2, 78);
    ctx.fillStyle = "#b3202e";
    ctx.fillRect(30, 90, w - 60, 3);
    ctx.fillStyle = "#9a9387";
    const r = rng(4);
    for (let y = 118; y < h - 70; y += 18) ctx.fillRect(30, y, (w - 60) * (0.6 + r() * 0.4), 6);
  });

export const Paper: React.FC<{ position?: V3; rotation?: V3; seal?: number; scale?: number }> = ({ position, rotation, seal = 0, scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.38, 0.5]} />
      <meshToonMaterial map={letterheadTex()} gradientMap={toonGradient()} side={THREE.DoubleSide} />
    </mesh>
    {seal > 0 && (
      <group position={[0.09, 0.004, 0.15]} rotation={[-Math.PI / 2, 0, 0]} scale={seal}>
        <mesh>
          <ringGeometry args={[0.045, 0.06, 24]} />
          <meshBasicMaterial color="#c0182c" />
        </mesh>
        <mesh>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial color="#c0182c" />
        </mesh>
      </group>
    )}
  </group>
);

export const Stamp: React.FC<{ position?: V3 }> = ({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 0]}>
      <boxGeometry args={[0.2, 0.04, 0.14]} />
      <ToonMat color="#c0182c" />
      <Line t={0.01} />
    </mesh>
    <mesh position={[0, 0.07, 0]}>
      <boxGeometry args={[0.18, 0.06, 0.12]} />
      <ToonMat color="#6b3f22" />
      <Line t={0.01} />
    </mesh>
    <mesh position={[0, 0.17, 0]}>
      <cylinderGeometry args={[0.03, 0.03, 0.14, 10]} />
      <ToonMat color="#6b3f22" />
      <Line t={0.008} />
    </mesh>
    <mesh position={[0, 0.27, 0]}>
      <sphereGeometry args={[0.06, 14, 10]} />
      <ToonMat color="#6b3f22" />
      <Line t={0.01} />
    </mesh>
  </group>
);

export const Coin: React.FC<{ position: V3; rotation?: V3; scale?: number }> = ({ position, rotation, scale = 1 }) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <cylinderGeometry args={[0.16, 0.16, 0.035, 22]} />
    <ToonMat color="#f2c230" />
    <Line t={0.012} />
  </mesh>
);

/* ---------------------------------------------------------------- lights & interiors */

export const Glow: React.FC<{ color: string; size: number; position?: V3; opacity?: number }> = ({ color, size, position, opacity = 1 }) => (
  <mesh position={position}>
    <planeGeometry args={[size, size]} />
    <meshBasicMaterial
      map={glow(`glow-${color}`, color)}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  </mesh>
);

export const DeskLamp: React.FC<{ position?: V3; on?: number }> = ({ position, on = 1 }) => (
  <group position={position}>
    <mesh position={[0, 0.02, 0]}>
      <cylinderGeometry args={[0.12, 0.14, 0.04, 20]} />
      <ToonMat color="#c99a3a" />
      <Line t={0.01} />
    </mesh>
    <Stick a={[0, 0.02, 0]} b={[0, 0.42, 0]} r={0.018} color="#c99a3a" />
    <mesh position={[0, 0.45, 0.05]} rotation={[0.3, 0, 0]} scale={[1.6, 1, 1]}>
      <sphereGeometry args={[0.11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshToonMaterial color="#2e7d4f" gradientMap={toonGradient()} side={THREE.DoubleSide} />
      <Line t={0.012} />
    </mesh>
    <Glow color="rgba(255,214,140,0.5)" size={1.0} position={[0, 0.38, 0.12]} opacity={on} />
  </group>
);

export const Chandelier: React.FC<{ position?: V3 }> = ({ position }) => (
  <group position={position}>
    <Stick a={[0, 0, 0]} b={[0, 0.8, 0]} r={0.02} color="#c99a3a" />
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.45, 0.035, 8, 32]} />
      <ToonMat color="#d9a93a" />
      <Line t={0.012} />
    </mesh>
    <mesh position={[0, -0.12, 0]}>
      <sphereGeometry args={[0.12, 16, 12]} />
      <ToonMat color="#d9a93a" />
      <Line t={0.012} />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return (
        <group key={i} position={[Math.cos(a) * 0.45, 0.06, Math.sin(a) * 0.45]}>
          <mesh>
            <cylinderGeometry args={[0.025, 0.025, 0.1, 8]} />
            <ToonMat color="#fff4dc" />
          </mesh>
          <mesh position={[0, 0.08, 0]} scale={[0.03, 0.05, 0.03]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#ffd36b" />
          </mesh>
        </group>
      );
    })}
    <Glow color="rgba(255,220,150,0.35)" size={2.2} position={[0, 0.05, 0.3]} />
  </group>
);

export const WallClock: React.FC<{ position?: V3; hours: number }> = ({ position, hours }) => {
  const minuteA = -(hours % 1) * Math.PI * 2;
  const hourA = -(hours / 12) * Math.PI * 2;
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.06, 32]} />
        <ToonMat color="#6b3f22" />
        <Line t={0.015} />
      </mesh>
      <mesh position={[0, 0, 0.032]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#f7f0dc" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.23, Math.cos((i / 12) * Math.PI * 2) * 0.23, 0.036]}>
          <circleGeometry args={[0.014, 8]} />
          <Ink />
        </mesh>
      ))}
      <group position={[0, 0, 0.04]} rotation={[0, 0, minuteA]}>
        <mesh position={[0, 0.1, 0]}>
          <planeGeometry args={[0.025, 0.21]} />
          <Ink />
        </mesh>
      </group>
      <group position={[0, 0, 0.042]} rotation={[0, 0, hourA]}>
        <mesh position={[0, 0.065, 0]}>
          <planeGeometry args={[0.035, 0.14]} />
          <Ink />
        </mesh>
      </group>
    </group>
  );
};

export const Lightbulb: React.FC<{ position?: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.12, 0]}>
      <sphereGeometry args={[0.16, 20, 16]} />
      <meshBasicMaterial color="#ffe066" />
      <Line t={0.015} />
    </mesh>
    <mesh position={[0, -0.06, 0]}>
      <cylinderGeometry args={[0.07, 0.07, 0.1, 14]} />
      <ToonMat color="#9aa3ad" />
      <Line t={0.01} />
    </mesh>
    {Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2;
      return <Stick key={i} a={[Math.cos(a) * 0.24, 0.12 + Math.sin(a) * 0.24, 0]} b={[Math.cos(a) * 0.34, 0.12 + Math.sin(a) * 0.34, 0]} r={0.016} color="#ffcf33" />;
    })}
    <Glow color="rgba(255,230,120,0.6)" size={1.1} position={[0, 0.12, -0.05]} />
  </group>
);

export const Chair: React.FC<{ position?: V3; rotationY?: number; color?: string }> = ({ position, rotationY = 0, color = "#7a1f2b" }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0.48, 0]}>
      <boxGeometry args={[0.6, 0.1, 0.55]} />
      <ToonMat color={color} />
      <Line t={0.015} />
    </mesh>
    <mesh position={[0, 0.95, -0.25]}>
      <boxGeometry args={[0.62, 0.9, 0.08]} />
      <ToonMat color={color} />
      <Line t={0.015} />
    </mesh>
    {[
      [-0.25, -0.22],
      [0.25, -0.22],
      [-0.25, 0.22],
      [0.25, 0.22],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.22, z]}>
        <boxGeometry args={[0.06, 0.44, 0.06]} />
        <ToonMat color="#4b2c19" />
      </mesh>
    ))}
  </group>
);
