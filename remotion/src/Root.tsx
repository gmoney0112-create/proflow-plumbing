import React from "react";
import { Composition } from "remotion";
import { ProFlowPromo } from "./ProFlowVideo";

// 30-second video at 30fps = 900 frames
const DURATION_FRAMES = 900;
const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ProFlowPromo"
        component={ProFlowPromo}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ProFlowShort"
        component={ProFlowPromo}
        durationInFrames={450}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ variant: "square" }}
      />
    </>
  );
};
