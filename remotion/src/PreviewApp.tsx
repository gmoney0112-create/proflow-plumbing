import React, { useState } from "react";
import { Player } from "@remotion/player";
import { ProFlowPromo } from "./ProFlowVideo";

export const PreviewApp: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      style={{
        background: "#04091a",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ marginBottom: 30, textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 900, margin: 0 }}>
          PRO<span style={{ color: "#0095ff" }}>FLOW</span> — Remotion Video Demo
        </h1>
        <p style={{ color: "#6cb8ff", marginTop: 8, fontSize: 16 }}>
          Programmatic video created with React + Remotion
        </p>
      </div>

      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(0,149,255,0.3), 0 20px 60px rgba(0,0,0,0.6)",
          border: "1px solid rgba(0,149,255,0.2)",
        }}
      >
        <Player
          component={ProFlowPromo}
          durationInFrames={900}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{ width: 960, height: 540 }}
          controls
          autoPlay
          loop
        />
      </div>

      <div style={{ marginTop: 30, display: "flex", gap: 20 }}>
        {[
          { label: "🎬 Intro", frame: 0 },
          { label: "🔧 Services", frame: 150 },
          { label: "📊 Stats", frame: 420 },
          { label: "📞 CTA", frame: 630 },
        ].map(({ label, frame }) => (
          <button
            key={label}
            onClick={() => {}}
            style={{
              background: "rgba(0,149,255,0.15)",
              border: "1px solid rgba(0,149,255,0.3)",
              color: "#6cb8ff",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 40, color: "#3a5a7a", fontSize: 14, textAlign: "center" }}>
        <p>
          Built with{" "}
          <a href="https://remotion.dev" style={{ color: "#0095ff" }}>
            Remotion
          </a>{" "}
          · Rendered via{" "}
          <a href="https://heygen.com" style={{ color: "#0095ff" }}>
            HeyGen HyperFrames MCP
          </a>{" "}
          in the cloud
        </p>
        <code style={{ color: "#2a4a6a", fontSize: 12 }}>
          npx remotion render src/index.ts ProFlowPromo out/proflow-promo.mp4
        </code>
      </div>
    </div>
  );
};
