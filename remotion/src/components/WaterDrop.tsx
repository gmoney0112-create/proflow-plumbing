import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

interface WaterDropProps { x: number; y: number; delay: number; size?: number; color?: string; }

export const WaterDrop: React.FC<WaterDropProps> = ({ x, y, delay, size = 40, color = "rgba(0,149,255,0.6)" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - delay);
  const ripple = spring({ fps, frame: localFrame, config: { damping: 8, stiffness: 60 } });
  const scale = interpolate(ripple, [0, 1], [0, 1]);
  const opacity = interpolate(localFrame, [0, 10, 40, 60], [0, 0.8, 0.8, 0], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50% 50% 50% 0", background: `radial-gradient(circle at 30% 30%, ${color}, transparent)`, transform: `rotate(-45deg) scale(${scale})`, opacity, boxShadow: `0 0 ${size * 0.5}px ${color}` }} />;
};

export const PipeFlow: React.FC<{ progress: number; y: number; width: number }> = ({ progress, y, width }) => {
  const flowX = interpolate(progress, [0, 1], [-100, width + 100]);
  return <div style={{ position: "absolute", left: flowX, top: y, width: 200, height: 6, background: "linear-gradient(90deg, transparent, #0095ff, #00d4ff, transparent)", borderRadius: 3, boxShadow: "0 0 12px #0095ff" }} />;
};
