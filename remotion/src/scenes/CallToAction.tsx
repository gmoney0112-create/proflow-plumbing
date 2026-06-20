import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";

export const CallToAction: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { width, height } = useVideoConfig();
  const fps = 30;
  const bgOpacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const pulse = Math.sin(localFrame * 0.12) * 0.04 + 1;
  const btnSpring = spring({ fps, frame: Math.max(0, localFrame - 60), config: { damping: 10, stiffness: 80 } });
  const btnScale = interpolate(btnSpring, [0, 1], [0, 1]);
  const ring1 = interpolate(localFrame % 60, [0, 60], [0, 1]);
  const ring2 = interpolate((localFrame + 30) % 60, [0, 60], [0, 1]);
  return (
    <div style={{ width, height, background: "radial-gradient(ellipse at 50% 50%, #0d1f3c 0%, #060d1a 70%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: bgOpacity, position: "relative", overflow: "hidden" }}>
      {[ring1, ring2].map((r, i) => <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: interpolate(r, [0, 1], [200, 1400]), height: interpolate(r, [0, 1], [200, 1400]), borderRadius: "50%", border: "2px solid rgba(0,149,255,0.15)", transform: "translate(-50%, -50%)", opacity: interpolate(r, [0, 0.5, 1], [0.8, 0.4, 0]) }} />)}
      <div style={{ background: "#ff4444", color: "#fff", fontSize: 14, fontFamily: "Arial, sans-serif", fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", padding: "8px 24px", borderRadius: 4, marginBottom: 30, opacity: interpolate(localFrame, [5, 20], [0, 1], { extrapolateRight: "clamp" }), boxShadow: "0 0 20px rgba(255,68,68,0.5)" }}>● AVAILABLE RIGHT NOW</div>
      <div style={{ textAlign: "center", marginBottom: 20 }}><AnimatedText text="Got a plumbing problem?" delay={10} animationType="slide-up" style={{ fontSize: 40, fontFamily: "Arial, sans-serif", color: "#8ecfff", fontWeight: 400 }} /></div>
      <div style={{ textAlign: "center", marginBottom: 50 }}><AnimatedText text="We Fix It Fast." delay={25} animationType="scale-in" style={{ fontSize: 90, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#ffffff", lineHeight: 1, textShadow: "0 0 40px rgba(0,149,255,0.4)", display: "inline-block" }} /></div>
      <div style={{ transform: `scale(${pulse})`, marginBottom: 50, opacity: interpolate(localFrame, [40, 60], [0, 1], { extrapolateRight: "clamp" }) }}>
        <div style={{ fontSize: 72, fontWeight: 900, fontFamily: "'Arial Black', sans-serif", color: "#0095ff", textShadow: "0 0 40px rgba(0,149,255,0.7)", letterSpacing: 2 }}>📞 (555) PRO-FLOW</div>
      </div>
      <div style={{ transform: `scale(${btnScale})`, background: "linear-gradient(135deg, #0095ff, #00d4ff)", borderRadius: 50, padding: "22px 70px", fontSize: 26, fontWeight: 800, fontFamily: "Arial, sans-serif", color: "#fff", letterSpacing: 2, textTransform: "uppercase", boxShadow: "0 0 40px rgba(0,149,255,0.6), 0 8px 32px rgba(0,0,0,0.4)" }}>Book a Free Estimate →</div>
      <div style={{ display: "flex", gap: 40, marginTop: 50, opacity: interpolate(localFrame, [80, 100], [0, 1], { extrapolateRight: "clamp" }) }}>
        {["Licensed & Insured", "5-Star Rated", "Same-Day Service"].map((badge) => <div key={badge} style={{ border: "1px solid rgba(0,149,255,0.3)", borderRadius: 8, padding: "10px 20px", fontSize: 16, fontFamily: "Arial, sans-serif", color: "#6cb8ff" }}>✓ {badge}</div>)}
      </div>
    </div>
  );
};
