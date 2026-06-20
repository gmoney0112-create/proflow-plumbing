import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

interface AiVideoBackgroundProps {
  src: string | null;
  fallbackGradient: string;
  overlayOpacity?: number;
  overlayColor?: string;
}

export const AiVideoBackground: React.FC<AiVideoBackgroundProps> = ({
  src,
  fallbackGradient,
  overlayOpacity = 0.55,
  overlayColor = "0,0,0",
}) => (
  <AbsoluteFill style={{ zIndex: 0 }}>
    {src ? (
      <OffthreadVideo
        src={src}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        muted
        loop
      />
    ) : (
      <div style={{ position: "absolute", inset: 0, background: fallbackGradient }} />
    )}
    {/* Dark overlay keeps animated text and UI legible over any footage */}
    <AbsoluteFill style={{ background: `rgba(${overlayColor},${overlayOpacity})` }} />
  </AbsoluteFill>
);
