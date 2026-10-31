import { Character, type CharacterProps, type Face } from "../../style/Character";
import { Beret, BowlerHat, BowTie, FlatCap, SuitFront, TopHat } from "../../style/props";
import { shade, stripes } from "../../style/textures";

type Partial<T> = { [K in keyof T]?: T[K] };
type CastProps = Omit<Partial<CharacterProps>, "face"> & { face?: Face };

/** Victor Lustig: top hat, pencil mustache, charcoal suit, red tie, permanent smirk. */
export const Lustig: React.FC<CastProps> = ({ face, ...p }) => (
  <Character
    face={{ mouth: "smirk", mustache: "#1d1b1a", browTiltL: -0.05, browTiltR: 0.12, browR: 0.25, ...face }}
    hat={<TopHat tilt={-0.06} />}
    outfit={{ color: "#2d3040", details: <SuitFront tie="#b3202e" lapel="#1b1d28" /> }}
    {...p}
  />
);

/** André Poisson: bowler hat, round glasses, tan suit, bow tie, bushy mustache. */
export const Poisson: React.FC<CastProps & { hatDown?: number }> = ({ face, hatDown = 0, ...p }) => (
  <Character
    face={{ mouth: "smile", mustache: "#8a8a8a", glasses: "#2a1d14", ...face }}
    hat={<BowlerHat color="#6b4a2e" down={hatDown} />}
    outfit={{ color: "#c79a5b", details: <BowTie color="#2f6fb5" /> }}
    {...p}
  />
);

const DEALERS = [
  { hat: <FlatCap color="#6d6f73" />, outfit: "#4f6b8a", mustache: "#4a3020" },
  { hat: <FlatCap color="#7a5a3a" />, outfit: "#7a3b3b", mustache: undefined },
  { hat: <Beret color="#2b2b33" />, outfit: "#4e7a4a", mustache: "#2a2a2a" },
  { hat: <FlatCap color="#3f4a5a" />, outfit: "#8a6a3a", mustache: "#9a6a3a" },
] as const;

/** The four other scrap dealers (variant 0–3). */
export const Dealer: React.FC<CastProps & { variant: number }> = ({ variant, face, ...p }) => {
  const d = DEALERS[variant % DEALERS.length];
  return (
    <Character
      face={{ mouth: "flat", mustache: d.mustache, ...face }}
      hat={d.hat}
      outfit={{ color: d.outfit, details: <SuitFront tie="#2a2a2a" shirt="#e8e2d0" lapel={shade(d.outfit, -0.08)} /> }}
      {...p}
    />
  );
};

/** Parisian bystanders (variant 0–2): berets, striped shirts. */
export const Parisian: React.FC<CastProps & { variant: number }> = ({ variant, face, ...p }) => {
  const looks = [
    { hat: <Beret color="#1f2a44" />, map: stripes("pstripe-a", ["#ffffff", "#ffffff", "#1f2a44"], 12, Math.PI / 2), color: "#ffffff" },
    { hat: <Beret color="#8c1f2d" />, map: undefined, color: "#d9a13a" },
    { hat: <FlatCap color="#55606e" />, map: stripes("pstripe-c", ["#f2efe6", "#c0392b"], 10, Math.PI / 2), color: "#ffffff" },
  ];
  const l = looks[variant % looks.length];
  return <Character face={{ mouth: "flat", ...face }} hat={l.hat} outfit={{ color: l.color, map: l.map }} {...p} />;
};
