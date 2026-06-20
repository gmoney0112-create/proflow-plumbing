#!/usr/bin/env node
/**
 * generate-ai-videos.mjs
 *
 * Generates AI video clips for each ProFlow Remotion scene and downloads
 * them to public/ai-clips/. After running, update videoAssets.ts with:
 *   url: staticFile("ai-clips/<scene>.mp4")
 *
 * Usage:
 *   FAL_KEY=xxx npm run generate:ai
 *   FAL_KEY=xxx RUNWAY_API_KEY=yyy npm run generate:ai
 *   FAL_KEY=xxx npm run generate:ai -- --scene=intro
 *
 * Get keys:
 *   fal.ai  → https://fal.ai/dashboard/keys
 *   Runway  → https://app.runwayml.com/settings/api (needed only for --scene=cta)
 */

import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "ai-clips");

// ── Scene definitions ────────────────────────────────────────────────────────

const SCENES = {
  intro: {
    prompt:
      "Extreme close-up of crystal-clear water rushing through polished copper pipes, " +
      "cinematic macro photography, deep blue ambient lighting, slow motion 120fps, " +
      "professional commercial quality, 4K, beautiful bokeh background",
    duration: "5",
    model: "kling",
  },
  services: {
    prompt:
      "Professional plumber in clean work uniform with tool belt confidently inspecting pipes " +
      "under a kitchen sink, warm natural interior lighting, skilled tradesperson at work, " +
      "modern home, documentary style, 4K, shallow depth of field",
    duration: "5",
    model: "kling",
  },
  stats: {
    prompt:
      "Smooth aerial drone footage flying over a peaceful sunny suburban neighbourhood, " +
      "golden hour warm light, tree-lined streets, neat well-kept houses, " +
      "slow cinematic pan, 4K, professional real estate drone photography",
    duration: "5",
    model: "kling",
  },
  cta: {
    prompt:
      "Professional plumber in ProFlow uniform giving a satisfied thumbs up after completing " +
      "a repair job, smiling homeowner visible in background, bright welcoming kitchen interior, " +
      "warm lighting, commercial advertising quality, 4K",
    duration: "5",
    model: "runway",
  },
};

// ── fal.ai Kling helpers ─────────────────────────────────────────────────────

const FAL_BASE = "https://queue.fal.run/fal-ai/kling-video/v1.6/pro/text-to-video";

async function falSubmit(prompt, duration, falKey) {
  const res = await fetch(FAL_BASE, {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration, aspect_ratio: "16:9" }),
  });
  if (!res.ok) throw new Error(`fal.ai submit failed: ${res.status} ${await res.text()}`);
  const { request_id } = await res.json();
  return request_id;
}

async function falPoll(requestId, falKey) {
  const statusUrl = `${FAL_BASE}/requests/${requestId}/status`;
  while (true) {
    await sleep(4000);
    const res = await fetch(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });
    if (!res.ok) throw new Error(`fal.ai poll failed: ${res.status}`);
    const { status } = await res.json();
    process.stdout.write(`  status: ${status}\r`);
    if (status === "COMPLETED") break;
    if (status === "FAILED") throw new Error("fal.ai generation failed");
  }
  process.stdout.write("\n");
}

async function falResult(requestId, falKey) {
  const res = await fetch(`${FAL_BASE}/requests/${requestId}`, {
    headers: { Authorization: `Key ${falKey}` },
  });
  if (!res.ok) throw new Error(`fal.ai result failed: ${res.status}`);
  const data = await res.json();
  const videoUrl = data?.video?.url ?? data?.output?.video?.url;
  if (!videoUrl) throw new Error(`No video URL in fal.ai result: ${JSON.stringify(data)}`);
  return videoUrl;
}

async function generateKling(scene, falKey) {
  const { prompt, duration } = SCENES[scene];
  console.log(`  Submitting to fal.ai Kling…`);
  const requestId = await falSubmit(prompt, duration, falKey);
  console.log(`  request_id: ${requestId}`);
  console.log(`  Waiting for completion…`);
  await falPoll(requestId, falKey);
  return await falResult(requestId, falKey);
}

// ── Runway Gen-3 helpers ─────────────────────────────────────────────────────

const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";

async function runwaySubmit(prompt, runwayKey) {
  const res = await fetch(`${RUNWAY_BASE}/text_to_video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runwayKey}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({
      model: "gen3a_turbo",
      promptText: prompt,
      duration: 5,
      ratio: "1280:768",
    }),
  });
  if (!res.ok) throw new Error(`Runway submit failed: ${res.status} ${await res.text()}`);
  const { id } = await res.json();
  return id;
}

async function runwayPoll(taskId, runwayKey) {
  while (true) {
    await sleep(5000);
    const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${runwayKey}`, "X-Runway-Version": "2024-11-06" },
    });
    if (!res.ok) throw new Error(`Runway poll failed: ${res.status}`);
    const { status, output, failure } = await res.json();
    process.stdout.write(`  status: ${status}\r`);
    if (status === "SUCCEEDED") {
      process.stdout.write("\n");
      return output[0].url;
    }
    if (status === "FAILED") throw new Error(`Runway generation failed: ${failure}`);
  }
}

async function generateRunway(scene, runwayKey) {
  if (!runwayKey) {
    console.warn("  RUNWAY_API_KEY not set — falling back to fal.ai Kling for CTA");
    return generateKling(scene, process.env.FAL_KEY);
  }
  const { prompt } = SCENES[scene];
  console.log(`  Submitting to Runway Gen-3 Turbo…`);
  const taskId = await runwaySubmit(prompt, runwayKey);
  console.log(`  task_id: ${taskId}`);
  console.log(`  Waiting for completion…`);
  return await runwayPoll(taskId, runwayKey);
}

// ── Download helper ──────────────────────────────────────────────────────────

async function download(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  await pipeline(res.body, createWriteStream(destPath));
}

// ── Main ─────────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const falKey = process.env.FAL_KEY;
  const runwayKey = process.env.RUNWAY_API_KEY;

  if (!falKey) {
    console.error("Error: FAL_KEY environment variable is not set.");
    console.error("Get yours at https://fal.ai/dashboard/keys");
    process.exit(1);
  }

  const sceneArg = process.argv.find((a) => a.startsWith("--scene="))?.split("=")[1];
  const scenesToRun = sceneArg ? [sceneArg] : Object.keys(SCENES);

  if (sceneArg && !SCENES[sceneArg]) {
    console.error(`Unknown scene: ${sceneArg}. Valid: ${Object.keys(SCENES).join(", ")}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const results = [];

  for (const scene of scenesToRun) {
    console.log(`\n[${scene}] Generating AI video clip…`);

    let videoUrl;
    if (SCENES[scene].model === "runway") {
      videoUrl = await generateRunway(scene, runwayKey);
    } else {
      videoUrl = await generateKling(scene, falKey);
    }

    console.log(`  Video URL: ${videoUrl}`);

    const destPath = join(OUT_DIR, `${scene}.mp4`);
    console.log(`  Downloading to ${destPath}…`);
    await download(videoUrl, destPath);
    console.log(`  ✓ Saved`);

    results.push({ scene, path: `public/ai-clips/${scene}.mp4` });
  }

  console.log("\n────────────────────────────────────────────────────────");
  console.log("All clips generated. Update remotion/src/videoAssets.ts:");
  console.log("────────────────────────────────────────────────────────");
  for (const { scene, path } of results) {
    console.log(`  ${scene}: { url: staticFile("ai-clips/${scene}.mp4"), ... }`);
  }
  console.log("\nThen open Remotion Studio:  npm run start");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
