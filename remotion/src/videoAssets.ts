import { staticFile } from "remotion";

export interface VideoClip {
  url: string | null;
  prompt: string;
  model: string;
}

// Set url to staticFile("ai-clips/<scene>.mp4") after running: npm run generate:ai
export const AI_VIDEO_CLIPS: Record<string, VideoClip> = {
  intro: {
    url: null,
    prompt:
      "Extreme close-up of crystal-clear water rushing through polished copper pipes, " +
      "cinematic macro photography, deep blue ambient lighting, slow motion 120fps, " +
      "professional commercial quality, 4K, beautiful bokeh background",
    model: "fal-ai/kling-video/v1.6/pro/text-to-video",
  },
  services: {
    url: null,
    prompt:
      "Professional plumber in clean work uniform with tool belt confidently inspecting pipes " +
      "under a kitchen sink, warm natural interior lighting, skilled tradesperson at work, " +
      "modern home, documentary style, 4K, shallow depth of field",
    model: "fal-ai/kling-video/v1.6/pro/text-to-video",
  },
  stats: {
    url: null,
    prompt:
      "Smooth aerial drone footage flying over a peaceful sunny suburban neighbourhood, " +
      "golden hour warm light, tree-lined streets, neat well-kept houses, " +
      "slow cinematic pan, 4K, professional real estate drone photography",
    model: "fal-ai/kling-video/v1.6/pro/text-to-video",
  },
  cta: {
    url: null,
    prompt:
      "Professional plumber in ProFlow uniform giving a satisfied thumbs up after completing " +
      "a repair job, smiling homeowner visible in background, bright welcoming kitchen interior, " +
      "warm lighting, commercial advertising quality, 4K",
    model: "fal-ai/runway-gen3/turbo/text-to-video",
  },
};
