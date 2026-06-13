import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";
import { WaterDrop, PipeFlow } from "../components/WaterDrop";

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background pulse
  const bgPulse = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });

  // Logo reveal
  const logoSpring = spring({ fps, frame: Math.max(0, frame - 20), config: { damping: 10, stiffness: 80 } });
  const logoScale = interpolate(logoSpring, [0, 1], [0.5, 1]);
  const logoOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });

  // Line accent
  const lineWidth = interpolate(frame, [40, 80], [0, 300], { extrapolateRight: "clamp" });

  // Pipe flow progress
  const pipeProgress = interpolate(frame, [10, 100], [0, 1], { extrapolateRight: "clamp" });

  const drops = [
    { x: 80, y: 120, delay: 5, size: 50, color: "rgba(0,149,255,0.5)" },
    { x: width - 150, y: 80, delay: 15, size: 35, color: "rgba(0,212,255,0.4)" },
    { x: 200, y: height - 200, delay: 25, size: 60, color: "rgba(0,100,200,0.4)" },
    { x: width - 250, y: height - 150, delay: 10, size: 45, color: "rgba(0,180,255,0.5)" },
  ];

  return (
    <div
      style={{
        width,
        height,
        background: `radial-gradient(ellipse at 50% 50%, #0a1628 0%, #060d1a 60%, #020609 100%)`,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: bgOpacity,
      }}
    >
      {/* Animated grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(0,149,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,149,255,0.05) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: bgPulse * 0.7,
        }}
      />

      {/* Water drops */}
      {drops.map((d, i) => (
        <WaterDrop key={i} {...d} />
      ))}

      {/* Pipe flow lines */}
      <PipeFlow progress={pipeProgress} y={height * 0.2} width={width} />
      <PipeFlow progress={1 - pipeProgress} y={height * 0.8} width={width} />

      {/* Logo / Brand */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        {/* Drop icon */}
        <div
          style={{
            fontSize: 90,
            marginBottom: 10,
            filter: "drop-shadow(0 0 30px rgba(0,149,255,0.8))",
          }}
        >
          💧
        </div>

        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            fontFamily: "'Arial Black', sans-serif",
            color: "#ffffff",
            letterSpacing: -2,
            textShadow: "0 0 40px rgba(0,149,255,0.6)",
          }}
        >
          PRO<span style={{ color: "#0095ff" }}>FLOW</span>
        </div>

        <div
          style={{
            fontSize: 22,
            fontFamily: "Arial, sans-serif",
            color: "#6cb8ff",
            letterSpacing: 12,
            textTransform: "uppercase",
            marginTop: 6,
          }}
        >
          PLUMBING
        </div>
      </div>

      {/* Animated accent line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: "linear-gradient(90deg, transparent, #0095ff, #00d4ff, transparent)",
          borderRadius: 2,
          marginTop: 30,
          boxShadow: "0 0 15px #0095ff",
          zIndex: 10,
        }}
      />

      {/* Tagline */}
      <div style={{ marginTop: 20, zIndex: 10 }}>
        <AnimatedText
          text="Precision. Speed. Reliability."
          delay={70}
          animationType="fade-in"
          style={{
            fontSize: 26,
            fontFamily: "Arial, sans-serif",
            color: "#8ecfff",
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        />
      </div>
    </div>
  );
};
