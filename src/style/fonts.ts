import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

export const CAPTION_FONT = "Montserrat";

// Remotion waits for this before rendering frames.
loadFont({ family: CAPTION_FONT, url: staticFile("fonts/montserrat-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: CAPTION_FONT, url: staticFile("fonts/montserrat-latin-700-normal.woff2"), weight: "700" });
