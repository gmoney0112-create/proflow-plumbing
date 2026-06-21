import React from "react";
import { interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { WaterDrop, PipeFlow } from "../components/WaterDrop";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const logoSpring = spring({ fps, frame: Math.max(0, frame - 20), config: { damping: 10, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const lineWidth = interpolate(frame, [40, 80], [0, 300], { extrapolateRight: "clamp" });
  const pipeProgress = interpolate(frame, [10, 100], [0, 1], { extrapolateRight: "clamp" });
  const drops = [
    { x: 80, y: 120, delay: 5, size: 50, color: "rgba(0,149,255,0.5)" },
    { x: width - 150, y: 80, delay: 15, size: 35, color: "rgba(0,212,255,0.4)" },
    { x: 200, y: height - 200, delay: 25, size: 60, color: "rgba(0,100,200,0.4)" },
    { x: width - 250, y: height - 150, delay: 10, size: 45, color: "rgba(0,180,255,0.5)" },
  ];
  return (
    <div style={{ width, height, background: "radial-gradient(ellipse at 50% 50%, #0a1628 0%, #060d1a 60%, #020609 100%)", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: bgOpacity }}>
      <OffthreadVideo src={staticFile("footage/scene1.mp4")} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} muted />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(10,22,40,0.78) 0%, rgba(6,13,26,0.88) 60%, rgba(2,6,9,0.94) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,149,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,149,255,0.05) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      {drops.map((d, i) => <WaterDrop key={i} {...d} />)}
      <PipeFlow progress={pipeProgress} y={height * 0.2} width={width} />
      <PipeFlow progress={1 - pipeProgress} y={height * 0.8} width={width} />
      <div style={{ transform: `scale(${logoScale})`, opacity: logoOpacity, textAlign: "center", zIndex: 10, position: "relative" }}>
        <div style={{ fontSize: 90, marginBottom: 10, filter: "drop-shadow(0 0 30px rgba(0,149,255,0.8))" }}>💧</div>
        <div style={{ fontSize: 80, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#ffffff", letterSpacing: -2, textShadow: "0 0 40px rgba(0,149,255,0.6)" }}>PRO<span style={{ color: "#0095ff" }}>FLOW</span></div>
        <div style={{ fontSize: 22, fontFamily: "Arial, sans-serif", color: "#6cb8ff", letterSpacing: 12, textTransform: "uppercase", marginTop: 6 }}>PLUMBING</div>
      </div>
      <div style={{ width: lineWidth, height: 3, background: "linear-gradient(90deg, transparent, #0095ff, #00d4ff, transparent)", borderRadius: 2, marginTop: 30, boxShadow: "0 0 15px #0095ff", zIndex: 10, position: "relative" }} />
      <div style={{ marginTop: 20, zIndex: 10, position: "relative" }}>
        <AnimatedText text="Precision. Speed. Reliability." delay={70} animationType="fade-in" style={{ fontSize: 26, fontFamily: "Arial, sans-serif", color: "#8ecfff", letterSpacing: 3, textTransform: "uppercase" }} />
      </div>
    </div>
  );
};
