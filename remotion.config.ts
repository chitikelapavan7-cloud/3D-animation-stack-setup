import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Three.js needs WebGL. "angle" uses the GPU; "swangle" is software rendering for
// headless/cloud machines without a GPU. Override with REMOTION_GL=angle|swangle.
const hasGpu = existsSync("/dev/dri");
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as "angle" | "swangle") ?? (hasGpu ? "angle" : "swangle"));

// Use the preinstalled Chromium in Claude Code cloud containers if present.
if (existsSync("/opt/pw-browsers/chromium")) {
  Config.setBrowserExecutable("/opt/pw-browsers/chromium");
}
