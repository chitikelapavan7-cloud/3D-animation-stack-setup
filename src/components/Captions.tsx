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
}> = ({ captions, variant = "highlight", combineWithinMs }) => {
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
            {variant === "cartoon" ? <CartoonPage page={page} /> : <HighlightPage page={page} />}
          </Sequence>
        );
      })}
    </>
  );
};

const CartoonPage: React.FC<{ page: Page }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 260, mass: 0.6 } });
  const size = width * 0.105;

  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: height * 0.6 }}>
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
          textAlign: "center",
          transform: `scale(${0.82 + 0.18 * pop})`,
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
