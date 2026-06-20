import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Intro } from "./scenes/Intro";
import { Services } from "./scenes/Services";
import { Stats } from "./scenes/Stats";
import { CallToAction } from "./scenes/CallToAction";

const SCENES = {
  intro:    { from: 0,   duration: 150 },
  services: { from: 150, duration: 270 },
  stats:    { from: 420, duration: 210 },
  cta:      { from: 630, duration: 270 },
};

const SceneTransition: React.FC<{ startFrame: number; duration?: number }> = ({ startFrame, duration = 20 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame - duration / 2, startFrame, startFrame + duration / 2], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#000", opacity, pointerEvents: "none", zIndex: 999 }} />;
};

interface ProFlowPromoProps {
  variant?: "widescreen" | "square";
}

export const ProFlowPromo: React.FC<ProFlowPromoProps> = ({ variant = "widescreen" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={SCENES.intro.from} durationInFrames={SCENES.intro.duration}>
        <Intro />
      </Sequence>
      <Sequence from={SCENES.services.from} durationInFrames={SCENES.services.duration}>
        <AbsoluteFill><Services localFrame={frame - SCENES.services.from} /></AbsoluteFill>
      </Sequence>
      <Sequence from={SCENES.stats.from} durationInFrames={SCENES.stats.duration}>
        <AbsoluteFill><Stats localFrame={frame - SCENES.stats.from} /></AbsoluteFill>
      </Sequence>
      <Sequence from={SCENES.cta.from} durationInFrames={SCENES.cta.duration}>
        <AbsoluteFill><CallToAction localFrame={frame - SCENES.cta.from} /></AbsoluteFill>
      </Sequence>
      <SceneTransition startFrame={SCENES.services.from} />
      <SceneTransition startFrame={SCENES.stats.from} />
      <SceneTransition startFrame={SCENES.cta.from} />
    </AbsoluteFill>
  );
};
