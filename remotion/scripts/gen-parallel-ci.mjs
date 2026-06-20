/**
 * gen-parallel-ci.mjs
 * Used by .github/workflows/generate-ai-videos.yml
 * Submits all clips simultaneously, polls until done, downloads to
 * public/ai-clips/, then rewrites src/videoAssets.ts with staticFile() paths.
 *
 * Env vars (set as GitHub Secrets):
 *   FAL_KEY        — https://fal.ai/dashboard/keys
 *   RUNWAY_KEY     — https://app.runwayml.com/settings/api
 *   SCENES_INPUT   — "all" | comma-separated scene names
 */
import { createWriteStream, readFileSync, writeFileSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..");
const OUT_DIR   = join(__dirname, "..", "public", "ai-clips");
mkdirSync(OUT_DIR, { recursive: true });

const FAL_KEY    = process.env.FAL_KEY;
const RUNWAY_KEY = process.env.RUNWAY_KEY;

if (!FAL_KEY) {
  console.error("FAL_KEY is not set. Add it as a GitHub Secret.");
  process.exit(1);
}

// ── Scene definitions ─────────────────────────────────────────────────────────

const ALL_SCENES = {
  intro: {
    prompt:
      "Extreme close-up of crystal-clear water rushing through polished copper pipes, " +
      "cinematic macro photography, deep blue ambient lighting, slow motion, " +
      "professional commercial quality, 4K, beautiful bokeh background",
    duration: "5",
    provider: "kling",
  },
  services: {
    prompt:
      "Professional plumber in clean work uniform with tool belt confidently inspecting pipes " +
      "under a kitchen sink, warm natural interior lighting, skilled tradesperson, " +
      "modern home, documentary style, 4K, shallow depth of field",
    duration: "5",
    provider: "kling",
  },
  stats: {
    prompt:
      "Smooth aerial drone footage over a peaceful sunny suburban neighbourhood, " +
      "golden hour warm light, tree-lined streets, neat well-kept houses, " +
      "slow cinematic pan, 4K, professional real estate drone photography",
    duration: "5",
    provider: "kling",
  },
  cta: {
    prompt:
      "Professional plumber in blue uniform giving a satisfied thumbs up after completing " +
      "a repair job, smiling homeowner in background, bright welcoming kitchen interior, " +
      "warm lighting, commercial advertising quality, 4K",
    duration: "5",
    provider: "runway",
  },
};

// Filter by SCENES_INPUT if provided
const scenesInput = (process.env.SCENES_INPUT || "all").trim();
const SCENES = scenesInput === "all"
  ? ALL_SCENES
  : Object.fromEntries(
      scenesInput.split(",").map(s => s.trim()).filter(s => ALL_SCENES[s])
        .map(s => [s, ALL_SCENES[s]])
    );

if (Object.keys(SCENES).length === 0) {
  console.error(`No valid scenes in SCENES_INPUT="${scenesInput}". Valid: ${Object.keys(ALL_SCENES).join(", ")}`);
  process.exit(1);
}

// ── fal.ai helpers ────────────────────────────────────────────────────────────

const KLING_BASE = "https://queue.fal.run/fal-ai/kling-video/v1.6/pro/text-to-video";

async function falSubmit(scene) {
  const { prompt, duration } = SCENES[scene];
  const res = await fetch(KLING_BASE, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration, aspect_ratio: "16:9" }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`fal submit [${scene}]: ${res.status} ${JSON.stringify(body)}`);
  return body.request_id;
}

async function falResult(requestId) {
  while (true) {
    await sleep(8000);
    const sr = await fetch(`${KLING_BASE}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const { status } = await sr.json();
    if (status === "COMPLETED") {
      const rr = await fetch(`${KLING_BASE}/requests/${requestId}`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      const data = await rr.json();
      const url = data?.video?.url ?? data?.output?.video?.url;
      if (!url) throw new Error(`No video URL: ${JSON.stringify(data)}`);
      return url;
    }
    if (status === "FAILED") throw new Error(`fal generation failed (req ${requestId})`);
    console.log(`  fal [${requestId.slice(-8)}] status: ${status}`);
  }
}

// ── Runway helpers ────────────────────────────────────────────────────────────

const RUNWAY_BASE = "https://api.runwayml.com/v1";

async function runwaySubmit(scene) {
  if (!RUNWAY_KEY) {
    console.log(`  No RUNWAY_KEY set — using fal.ai Kling for ${scene} instead`);
    const id = await falSubmit(scene);
    return { type: "kling", id };
  }
  const { prompt } = SCENES[scene];
  const res = await fetch(`${RUNWAY_BASE}/text_to_video`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNWAY_KEY}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({ promptText: prompt, model: "gen3a_turbo", duration: 5, ratio: "1280:768" }),
  });
  const body = await res.json();
  if (!res.ok) {
    console.log(`  Runway submit failed (${res.status}) — falling back to Kling`);
    const id = await falSubmit(scene);
    return { type: "kling", id };
  }
  return { type: "runway", id: body.id };
}

async function runwayResult(taskId) {
  while (true) {
    await sleep(8000);
    const res = await fetch(`${RUNWAY_BASE}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${RUNWAY_KEY}`, "X-Runway-Version": "2024-11-06" },
    });
    const data = await res.json();
    console.log(`  runway [${taskId.slice(-8)}] status: ${data.status}`);
    if (data.status === "SUCCEEDED") {
      const url = data.output?.[0];
      if (!url) throw new Error(`No output URL: ${JSON.stringify(data)}`);
      return url;
    }
    if (data.status === "FAILED") throw new Error(`Runway failed: ${data.failure}`);
  }
}

// ── Download ──────────────────────────────────────────────────────────────────

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url.slice(0, 80)}`);
  await pipeline(res.body, createWriteStream(dest));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Per-scene orchestration ───────────────────────────────────────────────────

async function processScene(scene) {
  const { provider } = SCENES[scene];
  console.log(`[${scene}] submitting (${provider})…`);

  let videoUrl;
  if (provider === "runway") {
    const job = await runwaySubmit(scene);
    if (job.type === "kling") {
      console.log(`[${scene}] → fal.ai Kling (fallback)`);
      videoUrl = await falResult(job.id);
    } else {
      videoUrl = await runwayResult(job.id);
    }
  } else {
    const requestId = await falSubmit(scene);
    console.log(`[${scene}] request_id: ${requestId}`);
    videoUrl = await falResult(requestId);
  }

  const dest = join(OUT_DIR, `${scene}.mp4`);
  console.log(`[${scene}] downloading → ${dest}`);
  await download(videoUrl, dest);
  console.log(`[${scene}] ✓ done`);
  return scene;
}

// ── Update videoAssets.ts ─────────────────────────────────────────────────────

function updateVideoAssets(succeededScenes) {
  const assetPath = join(__dirname, "..", "src", "videoAssets.ts");
  let src = readFileSync(assetPath, "utf-8");

  for (const scene of succeededScenes) {
    // Replace: url: null  →  url: staticFile("ai-clips/<scene>.mp4")
    src = src.replace(
      new RegExp(`(${scene}:[\\s\\S]*?url:)\\s*null`, "m"),
      `$1 staticFile("ai-clips/${scene}.mp4")`
    );
  }

  writeFileSync(assetPath, src);
  console.log(`\nUpdated videoAssets.ts for: ${succeededScenes.join(", ")}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const sceneNames = Object.keys(SCENES);
  console.log(`Generating ${sceneNames.length} clip(s) in parallel: ${sceneNames.join(", ")}\n`);

  const results = await Promise.allSettled(sceneNames.map(processScene));

  const succeeded = [];
  const failed = [];

  for (const [i, res] of results.entries()) {
    const scene = sceneNames[i];
    if (res.status === "fulfilled") { succeeded.push(scene); }
    else { failed.push(scene); console.error(`✗ ${scene}: ${res.reason.message}`); }
  }

  if (succeeded.length > 0) {
    updateVideoAssets(succeeded);
    console.log(`\n✓ Clips saved to remotion/public/ai-clips/`);
    console.log(`✓ videoAssets.ts updated with staticFile() paths`);
  }

  if (failed.length > 0) {
    console.error(`\nFailed scenes: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
