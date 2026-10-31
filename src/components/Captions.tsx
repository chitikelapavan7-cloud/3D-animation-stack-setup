import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { CAPTION_FONT } from "../style/fonts";

type Variant = "highlight" | "cartoon";
type Page = ReturnType<typeof createTikTokStyleCaptions>["pages"][number];

/**
 * Captions from Remotion's Caption format (times in ms).
 * - "highlight": word-by-word yellow highlight, bottom of frame.
 * - "cartoon": the reference style — 1–3 heavy white words, thick black stroke, pop-in, just below center.
 */
export const Captions: React.FC<{
  captions: Caption[];
  variant?: Variant;
  combineWithinMs?: number;
  /** cartoon only: "center" (just below middle) or "bottom" (lower third, clear of faces) */
  placement?: "center" | "bottom";
  /** cartoon only: font size multiplier (1 = 10.5% of frame width) */
  scale?: number;
}> = ({ captions, variant = "highlight", combineWithinMs, placement = "center", scale = 1 }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: combineWithinMs ?? (variant === "cartoon" ? 450 : 1200),
      }),
    [captions, variant, combineWithinMs],
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
            {variant === "cartoon" ? <CartoonPage page={page} placement={placement} scale={scale} /> : <HighlightPage page={page} />}
          </Sequence>
        );
      })}
    </>
  );
};

const CartoonPage: React.FC<{ page: Page; placement: "center" | "bottom"; scale: number }> = ({ page, placement, scale }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const size = width * 0.105 * scale;
  const position: React.CSSProperties =
    placement === "bottom"
      ? { justifyContent: "flex-end", paddingBottom: height * 0.085, paddingLeft: width * 0.1, paddingRight: width * 0.1 }
      : { paddingTop: height * 0.6 };

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
          whiteSpace: placement === "bottom" ? "normal" : "pre",
          maxWidth: placement === "bottom" ? width * 0.8 : undefined,
          // never more than two lines
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          padding: size * 0.12,
          textAlign: "center",
          transform: `scale(${0.82 + 0.18 * pop})`,
          transformOrigin: placement === "bottom" ? "50% 100%" : "50% 50%",
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
