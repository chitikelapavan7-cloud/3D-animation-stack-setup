import * as THREE from "three";

/** Deterministic PRNG so textures are identical on every frame/render. */
export const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export const shade = (hex: string, l: number, s = 0) => {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, s, l);
  return `#${c.getHexString()}`;
};

const cache = new Map<string, THREE.CanvasTexture>();

/** Hand-painted look (reference): many soft, short, slightly darker/lighter brush dabs over the base texture. */
const brushStrokes = (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) => {
  const r = rng(seed);
  const n = Math.round((w * h) / 700);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const len = 6 + r() * 18;
    const ang = (r() - 0.5) * 0.9 + (r() > 0.5 ? 0 : Math.PI / 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = 0.05 + r() * 0.07;
    ctx.fillStyle = r() > 0.5 ? "#ffffff" : "#000000";
    ctx.beginPath();
    ctx.ellipse(0, 0, len, 1.5 + r() * 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
};

export const canvasTex = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat: [number, number] = [1, 1],
  painterly = true,
) => {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx, w, h);
  if (painterly) brushStrokes(ctx, w, h, key.length * 7 + w);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(...repeat);
  tex.anisotropy = 8;
  cache.set(key, tex);
  return tex;
};

/** Painted wood planks with seams, grain strokes, knots and specks. */
export const planks = (key: string, base: string, count: number, seed = 1, repeat: [number, number] = [1, 1]) =>
  canvasTex(
    key,
    512,
    512,
    (ctx, w, h) => {
      const r = rng(seed);
      const pw = w / count;
      for (let i = 0; i < count; i++) {
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.06);
        ctx.fillRect(i * pw, 0, pw, h);
        ctx.strokeStyle = shade(base, -0.06);
        ctx.lineWidth = 2;
        for (let g = 0; g < 5; g++) {
          const x = i * pw + 6 + r() * (pw - 12);
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.6, x + 2, h);
          ctx.globalAlpha = 0.35;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // butt joint
        const jy = r() * h;
        ctx.fillStyle = shade(base, -0.2);
        ctx.fillRect(i * pw, jy, pw, 3);
        // knot
        if (r() > 0.5) {
          ctx.fillStyle = shade(base, -0.13);
          ctx.beginPath();
          ctx.ellipse(i * pw + pw / 2, r() * h, 5, 9, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        // seam
        ctx.fillStyle = shade(base, -0.24);
        ctx.fillRect(i * pw, 0, 4, h);
      }
      // nail specks
      ctx.fillStyle = shade(base, -0.3);
      for (let i = 0; i < count; i++) {
        ctx.fillRect(i * pw + 8, 10, 4, 4);
        ctx.fillRect(i * pw + pw - 12, h - 14, 4, 4);
      }
    },
    repeat,
  );

export const stripes = (key: string, colors: string[], count: number, angle = 0) =>
  canvasTex(key, 256, 256, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    ctx.rotate(angle);
    const size = (w * 2) / count;
    for (let i = -count; i < count; i++) {
      ctx.fillStyle = colors[((i % colors.length) + colors.length) % colors.length];
      ctx.fillRect(i * size, -w * 1.5, size + 1, w * 3);
    }
  });

export const dots = (key: string, base: string, dot: string, step = 40, radius = 7) =>
  canvasTex(key, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = dot;
    for (let y = 0, row = 0; y < h + step; y += step, row++)
      for (let x = row % 2 ? step / 2 : 0; x < w + step; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
  });

/** Plaster/dirt surface with scattered pebbles and specks. */
export const speckled = (key: string, base: string, seed = 3, repeat: [number, number] = [1, 1]) =>
  canvasTex(
    key,
    512,
    512,
    (ctx, w, h) => {
      const r = rng(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = shade(base, r() > 0.5 ? 0.12 : -0.12);
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 3 + r() * 7, 2 + r() * 5, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    repeat,
  );

/** Soft radial glow for flames/lamps (use with additive blending). */
export const glow = (key: string, color: string) =>
  canvasTex(key, 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
