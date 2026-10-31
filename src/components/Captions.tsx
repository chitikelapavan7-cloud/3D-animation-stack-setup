import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_FONT } from "../style/fonts";

type Variant = "highlight" | "cartoon";
type Page = ReturnType<typeof createTikTokStyleCaptions>["pages"][number];

/** A caption page never runs across the end of a sentence ("…came. Poisson" → "…came." | "Poisson"). */
const splitAtSentences = (pages: Page[], maxWords = Infinity): Page[] =>
  pages.flatMap((page) => {
    const out: Page[] = [];
    let cur: Page["tokens"] = [];
    const flush = () => {
      if (!cur.length) return;
      const startMs = cur[0].fromMs;
      out.push({ text: cur.map((t) => t.text).join(""), startMs, durationMs: cur[cur.length - 1].toMs - startMs, tokens: cur });
      cur = [];
    };
    page.tokens.forEach((tok, i) => {
      cur.push(tok);
      const sentenceEnd = /[.!?…]["”’]?$/.test(tok.text.trim());
      if ((sentenceEnd || cur.length >= maxWords) && i < page.tokens.length - 1) flush();
    });
    flush();
    return out;
  });

/**
 * Captions from Remotion's Caption format (times in ms).
 * - "highlight": word-by-word yellow highlight, bottom of frame.
 * - "cartoon": the reference style — 1–3 heavy white words, thick black stroke, pop-in, just below center.
 */
export const Captions: React.FC<{
  captions: Caption[];
  variant?: Variant;
  combineWithinMs?: number;
  /**
   * cartoon only: "center" (just below middle), "bottom" (lower third, clear of faces), or
   * "reference" — matches the reference shorts: block centred horizontally, its centre anchored at `anchorY`
   * (fraction of frame height) so resizing never moves it; heavy white text, thin black outline, soft drop shadow.
   */
  placement?: "center" | "bottom" | "reference";
  /** reference placement: vertical centre of the caption block (0–1 of frame height) */
  anchorY?: number;
  /** split pages longer than this many words (reference style uses 1–3 words) */
  maxWords?: number;
  /** cartoon only: font size multiplier (1 = 10.5% of frame width) */
  scale?: number;
}> = ({ captions, variant = "highlight", combineWithinMs, placement = "center", scale = 1, anchorY = 0.68, maxWords }) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(
    () =>
      splitAtSentences(
        createTikTokStyleCaptions({
          captions,
          combineTokensWithinMilliseconds: combineWithinMs ?? (variant === "cartoon" ? 450 : 1200),
        }).pages,
        maxWords,
      ),
    [captions, variant, combineWithinMs, maxWords],
  );

  return (
    <>
      {pages.map((page, i) => {
        const from = Math.round((page.startMs / 1000) * fps);
        const lastToken = page.tokens[page.tokens.length - 1];
        const endMs = variant === "cartoon" ? lastToken.toMs : (pages[i + 1]?.startMs ?? page.startMs + page.durationMs);
        const duration = Math.max(1, Math.round((endMs / 1000) * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={duration} layout="none">
            {variant === "cartoon" ? <CartoonPage page={page} placement={placement} scale={scale} anchorY={anchorY} /> : <HighlightPage page={page} />}
          </Sequence>
        );
      })}
    </>
  );
};

const CartoonPage: React.FC<{ page: Page; placement: "center" | "bottom" | "reference"; scale: number; anchorY: number }> = ({
  page,
  placement,
  scale,
  anchorY,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const size = width * 0.105 * scale;

  if (placement === "reference") {
    return (
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: width * 0.08,
            right: width * 0.08,
            top: height * anchorY,
            transform: `translateY(-50%) scale(${0.94 + 0.06 * pop})`,
            transformOrigin: "50% 50%",
            textAlign: "center",
            fontFamily: CAPTION_FONT,
            fontWeight: 900,
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: -size * 0.01,
            color: "#ffffff",
            WebkitTextStroke: `${size * 0.12}px #111111`,
            paintOrder: "stroke fill",
            textShadow: `${size * 0.045}px ${size * 0.06}px 0 rgba(0,0,0,0.85), 0 ${size * 0.05}px ${size * 0.18}px rgba(0,0,0,0.5)`,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "visible",
          }}
        >
          {page.text.trim()}
        </div>
      </AbsoluteFill>
    );
  }
  const position: React.CSSProperties =
    placement === "bottom"
      ? { justifyContent: "flex-end", paddingBottom: height * 0.085, paddingLeft: width * 0.1, paddingRight: width * 0.1 }
      : { paddingTop: height * 0.6 };

  if (placement === "bottom") {
    return (
      <AbsoluteFill style={{ alignItems: "center", ...position }}>
        <div
          style={{
            fontFamily: CAPTION_FONT,
            fontWeight: 700,
            fontSize: size,
            lineHeight: 1.25,
            color: "white",
            background: "rgba(12, 10, 20, 0.62)",
            borderRadius: size * 0.45,
            padding: `${size * 0.22}px ${size * 0.5}px`,
            maxWidth: width * 0.8,
            textAlign: "center",
            textShadow: "0 2px 3px rgba(0,0,0,0.5)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            opacity: Math.min(1, pop * 1.4),
            transform: `translateY(${(1 - pop) * size * 0.25}px)`,
          }}
        >
          {page.text.trim()}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ alignItems: "center", ...position }}>
      <div
        style={{
          fontFamily: CAPTION_FONT,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: -size * 0.02,
          color: "white",
          WebkitTextStroke: `${size * 0.16}px #111`,
          paintOrder: "stroke fill",
          textShadow: `0 ${size * 0.05}px 0 #111, 0 ${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.35)`,
          whiteSpace: "pre",
          
          // never more than two lines
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          padding: size * 0.12,
          textAlign: "center",
          transform: `scale(${0.82 + 0.18 * pop})`,
          transformOrigin: "50% 50%",
        }}
      >
        {page.text.trim()}
      </div>
    </AbsoluteFill>
  );
};

const HighlightPage: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
      <div
        style={{
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          fontSize: 72,
          fontWeight: 800,
          color: "white",
          textShadow: "0 4px 20px rgba(0,0,0,0.6)",
          whiteSpace: "pre",
        }}
      >
        {page.tokens.map((t, i) => (
          <span key={i} style={{ color: nowMs >= t.fromMs && nowMs < t.toMs ? "#ffd84d" : "white" }}>
            {t.text}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Build Caption[] from [word, startMs, endMs] tuples. */
export const words = (list: [string, number, number][]): Caption[] =>
  list.map(([text, startMs, endMs], i) => ({
    text: i === 0 ? text : ` ${text}`,
    startMs,
    endMs,
    timestampMs: startMs,
    confidence: 1,
  }));
