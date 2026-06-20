import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AnimatedText } from "../components/AnimatedText";

const SERVICES = [
  {
    icon: "🔧",
    title: "Emergency Repairs",
    subtitle: "24/7 rapid response — we're there when you need us most.",
    accent: "#ff4444",
    glow: "rgba(255,68,68,0.3)",
  },
  {
    icon: "🌡️",
    title: "Water Heater Install",
    subtitle: "Same-day installation. All brands serviced.",
    accent: "#ff8c00",
    glow: "rgba(255,140,0,0.3)",
  },
  {
    icon: "🔩",
    title: "Pipe Replacement",
    subtitle: "Full re-piping. Trenchless options available.",
    accent: "#0095ff",
    glow: "rgba(0,149,255,0.3)",
  },
  {
    icon: "🌀",
    title: "Drain Cleaning",
    subtitle: "Hydro-jetting & camera inspection for every job.",
    accent: "#00d4a0",
    glow: "rgba(0,212,160,0.3)",
  },
];

interface ServiceCardProps {
  service: typeof SERVICES[0];
  index: number;
  activeIndex: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, index, activeIndex }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isActive = index === activeIndex;
  const isPast = index < activeIndex;
  const isFuture = index > activeIndex;

  let opacity = 1;
  let scale = 1;
  let translateX = 0;

  if (isActive) {
    const slideIn = spring({ fps, frame, config: { damping: 14, stiffness: 100 } });
    scale = interpolate(slideIn, [0, 1], [0.9, 1]);
    opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
    translateX = interpolate(slideIn, [0, 1], [80, 0]);
  } else if (isPast) {
    opacity = interpolate(frame, [0, 10], [1, 0.15], { extrapolateRight: "clamp" });
    scale = 0.9;
    translateX = -60;
  } else {
    opacity = 0.15;
    translateX = 60;
  }

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(10,22,40,0.95) 0%, rgba(${isActive ? "0,80,160" : "5,15,30"},0.9) 100%)`,
        border: `2px solid ${isActive ? service.accent : "rgba(255,255,255,0.08)"}`,
        borderRadius: 20,
        padding: "30px 40px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        gap: 30,
        transform: `scale(${scale}) translateX(${translateX}px)`,
        opacity,
        boxShadow: isActive ? `0 0 40px ${service.glow}, 0 8px 32px rgba(0,0,0,0.5)` : "0 4px 16px rgba(0,0,0,0.3)",
        transition: "none",
        minWidth: 700,
      }}
    >
      <div
        style={{
          fontSize: 52,
          filter: isActive ? `drop-shadow(0 0 20px ${service.accent})` : "none",
        }}
      >
        {service.icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            fontFamily: "'Arial Black', sans-serif",
            color: isActive ? "#ffffff" : "#4a6580",
            marginBottom: 6,
          }}
        >
          {service.title}
        </div>
        <div
          style={{
            fontSize: 18,
            fontFamily: "Arial, sans-serif",
            color: isActive ? service.accent : "#2a4560",
          }}
        >
          {service.subtitle}
        </div>
      </div>
      {isActive && (
        <div
          style={{
            marginLeft: "auto",
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: service.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            boxShadow: `0 0 20px ${service.glow}`,
          }}
        >
          ✓
        </div>
      )}
    </div>
  );
};

export const Services: React.FC<{ localFrame: number }> = ({ localFrame }) => {
  const { width, height } = useVideoConfig();

  // Each service gets about 50 frames of spotlight
  const activeIndex = Math.min(3, Math.floor(localFrame / 50));
  const sectionProgress = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const bgOpacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width,
        height,
        background: "radial-gradient(ellipse at 20% 50%, #081428 0%, #04091a 70%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: bgOpacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(rgba(0,149,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Section header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <AnimatedText
          text="OUR SERVICES"
          delay={5}
          animationType="slide-up"
          style={{
            fontSize: 16,
            fontFamily: "Arial, sans-serif",
            color: "#0095ff",
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        />
        <AnimatedText
          text="What We Do Best"
          delay={15}
          animationType="slide-up"
          style={{
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "'Arial Black', sans-serif",
            color: "#ffffff",
          }}
        />
      </div>

      {/* Service cards — each rendered at its own sub-frame */}
      <div style={{ position: "relative" }}>
        {SERVICES.map((service, i) => {
          const cardFrame = Math.max(0, localFrame - i * 50);
          return (
            <div key={i} style={{ position: "relative" }}>
              {/* Inject per-card frame via context trick */}
              <ServiceCard service={service} index={i} activeIndex={activeIndex} />
            </div>
          );
        })}
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
        {SERVICES.map((s, i) => (
          <div
            key={i}
            style={{
              width: i === activeIndex ? 32 : 10,
              height: 10,
              borderRadius: 5,
              background: i <= activeIndex ? s.accent : "rgba(255,255,255,0.15)",
              boxShadow: i === activeIndex ? `0 0 12px ${s.glow}` : "none",
              transition: "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};
