import { Composition } from "remotion";
import { Demo3D } from "./compositions/Demo3D";
import { StyleCabin } from "./compositions/StyleCabin";
import { StyleDock } from "./compositions/StyleDock";

const SHORT = { fps: 30, width: 1080, height: 1920 } as const;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Demo3D" component={Demo3D} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="StyleCabin" component={StyleCabin} durationInFrames={120} {...SHORT} />
    <Composition id="StyleDock" component={StyleDock} durationInFrames={120} {...SHORT} />
  </>
);
