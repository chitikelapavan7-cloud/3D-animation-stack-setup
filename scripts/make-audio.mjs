// Procedurally generates the background music bed and sound effects (no external assets).
// Usage: node scripts/make-audio.mjs <durationSeconds>
import { mkdirSync, writeFileSync } from "node:fs";

const SR = 44100;
const dur = Number(process.argv[2] ?? 60);

const writeWav = (file, samples) => {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const norm = peak > 0 ? 0.89 / peak : 1;
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(s * norm * 32767), 44 + i * 2));
  writeFileSync(file, buf);
};

let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** Karplus–Strong plucked string (pizzicato). */
const pluck = (out, start, midi, len, amp, damp = 0.996) => {
  const period = Math.round(SR / hz(midi));
  const ring = Array.from({ length: period }, () => rand());
  const s0 = Math.round(start * SR);
  const n = Math.round(len * SR);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const j = i % period;
    const v = ring[j];
    ring[j] = damp * 0.5 * (v + ring[(j + 1) % period]);
    const env = i < n - 2000 ? 1 : (n - i) / 2000;
    out[s0 + i] += v * amp * env;
  }
};

/* ---------- music: sneaky minor-key pizzicato "heist" waltz-march */
const music = new Float32Array(Math.ceil((dur + 1) * SR));
const beat = 60 / 112;
const prog = [
  [45, [57, 60, 64]], // Am
  [50, [57, 62, 65]], // Dm
  [52, [56, 59, 64]], // E
  [45, [57, 60, 64]], // Am
  [41, [57, 60, 65]], // F
  [50, [57, 62, 65]], // Dm
  [52, [56, 59, 62]], // E7
  [52, [56, 59, 64]], // E
];
const melody = [76, null, 74, 72, 71, null, 72, 74, 76, null, 79, 77, 76, 74, 72, 71];
for (let bar = 0, time = 0; time < dur; bar++) {
  const [bass, chord] = prog[bar % prog.length];
  for (let b = 0; b < 4; b++) {
    const tt = time + b * beat;
    if (b % 2 === 0) pluck(music, tt, bass - 12 + (b === 2 ? 7 : 0), beat * 1.2, 0.55, 0.994);
    else chord.forEach((m) => pluck(music, tt, m, beat * 0.4, 0.16, 0.99));
    // soft brush
    for (let i = 0; i < 1500; i++) {
      const k = Math.round((tt + beat / 2) * SR) + i;
      if (k < music.length) music[k] += rand() * 0.03 * (1 - i / 1500);
    }
    // sparse melody every other 4-bar phrase
    if (Math.floor(bar / 4) % 2 === 1) {
      const m = melody[(bar % 4) * 4 + b];
      if (m) pluck(music, tt, m, beat * 0.9, 0.22, 0.997);
    }
  }
  time += 4 * beat;
}
// fade in/out
for (let i = 0; i < music.length; i++) {
  const t = i / SR;
  music[i] *= Math.min(1, t / 1.0, Math.max(0, (dur - t) / 1.5));
}

/* ---------- sfx */
const sfx = (seconds, fn) => Float32Array.from({ length: Math.round(seconds * SR) }, (_, i) => fn(i / SR));
const stamp = sfx(0.3, (t) => (Math.sin(2 * Math.PI * 90 * t * (1 - t)) * 0.9 + rand() * 0.4 * Math.exp(-t * 60)) * Math.exp(-t * 18));
const thud = sfx(0.9, (t) => (Math.sin(2 * Math.PI * (60 - 30 * t) * t) + rand() * 0.5 * Math.exp(-t * 20)) * Math.exp(-t * 5));
const pop = sfx(0.25, (t) => Math.sin(2 * Math.PI * (300 + 900 * t) * t) * Math.exp(-t * 22));
const ding = sfx(1.6, (t) => (Math.sin(2 * Math.PI * 1318 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-t * 3));
const kaching = sfx(1.2, (t) => {
  const bell = t > 0.12 ? (Math.sin(2 * Math.PI * 2093 * t) + Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-(t - 0.12) * 4) : 0;
  const click = t < 0.12 ? rand() * Math.exp(-t * 40) : 0;
  return bell * 0.6 + click;
});
const whistle = sfx(1.6, (t) => {
  const env = Math.min(1, t / 0.08) * Math.min(1, (1.6 - t) / 0.4);
  return (Math.sin(2 * Math.PI * 740 * t) + 0.7 * Math.sin(2 * Math.PI * 932 * t) + rand() * 0.25) * env;
});

mkdirSync("public/audio/sfx", { recursive: true });
writeWav("public/audio/eiffel-music.wav", music);
for (const [name, s] of Object.entries({ stamp, thud, pop, ding, kaching, whistle })) writeWav(`public/audio/sfx/${name}.wav`, s);
console.log("audio written");
