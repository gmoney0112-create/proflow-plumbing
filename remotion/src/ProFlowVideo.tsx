import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Intro } from "./scenes/Intro";
import { Services } from "./scenes/Services";
import { Stats } from "./scenes/Stats";
import { CallToAction } from "./scenes/CallToAction";

// Scene timing (frames at 30fps)
const SCENES = {
  intro:    { from: 0,   duration: 150 },  //  0s – 5s
  services: { from: 150, duration: 270 },  //  5s – 14s
  stats:    { from: 420, duration: 210 },  // 14s – 21s
  cta:      { from: 630, duration: 270 },  // 21s – 30s
};

// Cross-fade overlay between scenes
const SceneTransition: React.FC<{ startFrame: number; duration?: number }> = ({
  startFrame,
  duration = 20,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame - duration / 2, startFrame, startFrame + duration / 2],
    [0, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <AbsoluteFill
      style={{ background: "#000", opacity, pointerEvents: "none", zIndex: 999 }}
    />
  );
};

interface ProFlowPromoProps {
  variant?: "widescreen" | "square";
}

export const ProFlowPromo: React.FC<ProFlowPromoProps> = ({ variant = "widescreen" }) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Scene 1: Intro */}
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.duration}>
        <Intro />
      </Sequence>

      {/* Scene 2: Services showcase */}
      <Sequence from={SCENES.services.from} durationInFrames={SCENES.services.duration}>
        <AbsoluteFill>
          <Services localFrame={frame - SCENES.services.from} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Stats */}
      <Sequence from={SCENES.stats.from} durationInFrames={SCENES.stats.duration}>
        <AbsoluteFill>
          <Stats localFrame={frame - SCENES.stats.from} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Call to Action */}
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <AbsoluteFill>
          <CallToAction localFrame={frame - SCENES.cta.from} />
        </AbsoluteFill>
      </Sequence>

      {/* Cross-fade transitions between scenes */}
      <SceneTransition startFrame={SCENES.services.from} />
      <SceneTransition startFrame={SCENES.stats.from} />
      <SceneTransition startFrame={SCENES.cta.from} />
    </AbsoluteFill>
  );
};
