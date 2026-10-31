// Aligns a known script to a voiceover without speech recognition.
// Phrase boundaries come from `ffmpeg silencedetect` (speech start/end per phrase); words inside a phrase
// are timed proportionally to their estimated syllable count. Output: Remotion Caption[] JSON.
// Usage: node scripts/align-script.mjs <phrases.json> <out.json>
// phrases.json: [[startSec, endSec, "phrase text"], ...]
import { readFileSync, writeFileSync } from "node:fs";

const [input, output] = process.argv.slice(2);
const phrases = JSON.parse(readFileSync(input, "utf8"));

const NUMBER_SYLLABLES = { "1925": 6 }; // "nineteen twenty-five"
const syllables = (w) => {
  const clean = w.toLowerCase().replace(/[^a-zé0-9']/g, "");
  if (NUMBER_SYLLABLES[clean]) return NUMBER_SYLLABLES[clean];
  const groups = clean.replace(/e$/, "").match(/[aeiouyé]+/g);
  return Math.max(1, groups ? groups.length : 1);
};

const captions = [];
for (const [start, end, text] of phrases) {
  const words = text.split(/\s+/).filter(Boolean);
  // trailing punctuation adds a little hold time to the word
  const weights = words.map((w) => syllables(w) + (/[,.:…!?]$/.test(w) ? 0.4 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  words.forEach((w, i) => {
    const d = ((end - start) * weights[i]) / total;
    captions.push({
      text: captions.length === 0 ? w : ` ${w}`,
      startMs: Math.round(t * 1000),
      endMs: Math.round((t + d) * 1000),
      timestampMs: Math.round(t * 1000),
      confidence: null,
    });
    t += d;
  });
}
writeFileSync(output, JSON.stringify(captions, null, 2));
console.log(`Wrote ${captions.length} word captions to ${output}`);
