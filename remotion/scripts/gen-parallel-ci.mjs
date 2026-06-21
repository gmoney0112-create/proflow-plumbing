/**
 * gen-parallel-ci.mjs
 * Used by .github/workflows/generate-ai-videos.yml
 *
 * Submits all clips simultaneously, polls until done, downloads to
 * public/ai-clips/, then rewrites src/videoAssets.ts with staticFile() paths.
 *
 * Provider priority by quality (first key found wins for all scenes):
 *   1. RUNWAY_KEY           — Runway Gen-3 Turbo        (highest cinematic quality)
 *   2. KLING_API_KEY        — Kling v1.6 direct          (api.klingai.com)
 *   3. REPLICATE_API_TOKEN  — Kling v2.0 via Replicate
 *   4. FAL_KEY              — Kling v1.6 via fal.ai      (fallback)
 *
 * Set these as GitHub Secrets in:
 *   Settings → Secrets and variables → Actions → New repository secret
 */
import { createWriteStream, readFileSync, writeFileSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = join(__dirname, "..", "public", "ai-clips");
mkdirSync(OUT_DIR, { recursive: true });

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const KLING_KEY       = process.env.KLING_API_KEY;
const FAL_KEY         = process.env.FAL_KEY;
const RUNWAY_KEY      = process.env.RUNWAY_KEY;

// Detect primary provider — ordered by output quality (highest first)
const PRIMARY = RUNWAY_KEY      ? "runway"
              : KLING_KEY       ? "kling"
              : REPLICATE_TOKEN ? "replicate"
              : FAL_KEY         ? "fal"
              : null;

if (!PRIMARY) {
  console.error(
    "No AI video API key found. Set at least one of these GitHub Secrets:\n" +
    "  RUNWAY_KEY           — https://app.runwayml.com/settings/api\n" +
    "  KLING_API_KEY        — https://klingai.com/dev/help-center/info\n" +
    "  REPLICATE_API_TOKEN  — https://replicate.com/account/api-tokens\n" +
    "  FAL_KEY              — https://fal.ai/dashboard/keys"
  );
  process.exit(1);
}

console.log(`Primary provider: ${PRIMARY}\n`);

// ── Scene definitions ──────────────────────────────────────────────────────────

const ALL_SCENES = {
  intro: {
    prompt:
      "Extreme close-up of crystal-clear water rushing through polished copper pipes, " +
      "cinematic macro photography, deep blue ambient lighting, slow motion, " +
      "professional commercial quality, 4K, beautiful bokeh background",
    duration: 5,
  },
  services: {
    prompt:
      "Professional plumber in clean work uniform with tool belt confidently inspecting pipes " +
      "under a kitchen sink, warm natural interior lighting, skilled tradesperson, " +
      "modern home, documentary style, 4K, shallow depth of field",
    duration: 5,
  },
  stats: {
    prompt:
      "Smooth aerial drone footage over a peaceful sunny suburban neighbourhood, " +
      "golden hour warm light, tree-lined streets, neat well-kept houses, " +
      "slow cinematic pan, 4K, professional real estate drone photography",
    duration: 5,
  },
  cta: {
    prompt:
      "Professional plumber in blue uniform giving a satisfied thumbs up after completing " +
      "a repair job, smiling homeowner in background, bright welcoming kitchen interior, " +
      "warm lighting, commercial advertising quality, 4K",
    duration: 5,
  },
};

const scenesInput = (process.env.SCENES_INPUT || "all").trim();
const SCENES = scenesInput === "all"
  ? ALL_SCENES
  : Object.fromEntries(
      scenesInput.split(",").map(s => s.trim()).filter(s => ALL_SCENES[s])
        .map(s => [s, ALL_SCENES[s]])
    );

if (Object.keys(SCENES).length === 0) {
  console.error(`No valid scenes in "${scenesInput}". Valid: ${Object.keys(ALL_SCENES).join(", ")}`);
  process.exit(1);
}

// ── Provider: Replicate (Kling v2.0) ──────────────────────────────────────────

const REPLICATE_MODEL = "kwaivgi/kling-v2.0-standard-text-to-video";

async function replicateGenerate(scene) {
  const { prompt, duration } = SCENES[scene];
  const res = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",          // wait up to 60s before switching to polling
    },
    body: JSON.stringify({ input: { prompt, duration, aspect_ratio: "16:9" } }),
  });
  const pred = await res.json();
  if (!res.ok) throw new Error(`Replicate submit [${scene}]: ${res.status} ${JSON.stringify(pred)}`);
  console.log(`[${scene}] Replicate prediction: ${pred.id} (status: ${pred.status})`);

  // Poll if not immediately done
  let data = pred;
  while (data.status !== "succeeded" && data.status !== "failed") {
    await sleep(6000);
    const r = await fetch(data.urls.get, { headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` } });
    data = await r.json();
    console.log(`[${scene}] Replicate status: ${data.status}`);
  }
  if (data.status === "failed") throw new Error(`Replicate failed [${scene}]: ${data.error}`);
  const url = Array.isArray(data.output) ? data.output[0] : data.output;
  if (!url) throw new Error(`No output URL from Replicate: ${JSON.stringify(data)}`);
  return url;
}

// ── Provider: Kling direct (api.klingai.com) ──────────────────────────────────

async function klingGenerate(scene) {
  const { prompt, duration } = SCENES[scene];
  const res = await fetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KLING_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_name: "kling-v1-6",
      prompt,
      negative_prompt: "",
      cfg_scale: 0.5,
      mode: "pro",
      aspect_ratio: "16:9",
      duration: String(duration),
    }),
  });
  const body = await res.json();
  if (!res.ok || body.code !== 0) {
    throw new Error(`Kling submit [${scene}]: ${res.status} ${JSON.stringify(body)}`);
  }
  const taskId = body.data.task_id;
  console.log(`[${scene}] Kling task_id: ${taskId}`);

  while (true) {
    await sleep(8000);
    const r = await fetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { Authorization: `Bearer ${KLING_KEY}` },
    });
    const data = await r.json();
    const status = data?.data?.task_status;
    console.log(`[${scene}] Kling status: ${status}`);
    if (status === "succeed") {
      const url = data?.data?.task_result?.videos?.[0]?.url;
      if (!url) throw new Error(`No video URL in Kling result: ${JSON.stringify(data)}`);
      return url;
    }
    if (status === "failed") throw new Error(`Kling generation failed [${scene}]`);
  }
}

// ── Provider: fal.ai (Kling v1.6) ─────────────────────────────────────────────

const FAL_BASE = "https://queue.fal.run/fal-ai/kling-video/v1.6/pro/text-to-video";

async function falGenerate(scene) {
  const { prompt, duration } = SCENES[scene];
  const res = await fetch(FAL_BASE, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration: String(duration), aspect_ratio: "16:9" }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`fal submit [${scene}]: ${res.status} ${JSON.stringify(body)}`);
  const requestId = body.request_id;
  console.log(`[${scene}] fal request_id: ${requestId}`);

  while (true) {
    await sleep(8000);
    const sr = await fetch(`${FAL_BASE}/requests/${requestId}/status`, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    });
    const { status } = await sr.json();
    console.log(`[${scene}] fal status: ${status}`);
    if (status === "COMPLETED") {
      const rr = await fetch(`${FAL_BASE}/requests/${requestId}`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });
      const data = await rr.json();
      const url = data?.video?.url ?? data?.output?.video?.url;
      if (!url) throw new Error(`No video URL in fal result: ${JSON.stringify(data)}`);
      return url;
    }
    if (status === "FAILED") throw new Error(`fal generation failed [${scene}]`);
  }
}

// ── Provider: Runway Gen-3 ─────────────────────────────────────────────────────

async function runwayGenerate(scene) {
  const { prompt } = SCENES[scene];
  const res = await fetch("https://api.dev.runwayml.com/v1/text_to_video", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RUNWAY_KEY}`,
      "Content-Type": "application/json",
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify({ promptText: prompt, model: "gen3a_turbo", duration: 5, ratio: "1280:768" }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Runway submit [${scene}]: ${res.status} ${JSON.stringify(body)}`);
  const taskId = body.id;
  console.log(`[${scene}] Runway task_id: ${taskId}`);

  while (true) {
    await sleep(8000);
    const r = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${RUNWAY_KEY}`, "X-Runway-Version": "2024-11-06" },
    });
    const data = await r.json();
    console.log(`[${scene}] Runway status: ${data.status}`);
    if (data.status === "SUCCEEDED") {
      const url = data.output?.[0];
      if (!url) throw new Error(`No output URL from Runway: ${JSON.stringify(data)}`);
      return url;
    }
    if (data.status === "FAILED") throw new Error(`Runway failed [${scene}]: ${data.failure}`);
  }
}

// ── Per-scene orchestration ────────────────────────────────────────────────────

async function generateVideo(scene) {
  if (PRIMARY === "runway")    return runwayGenerate(scene);
  if (PRIMARY === "kling")     return klingGenerate(scene);
  if (PRIMARY === "replicate") return replicateGenerate(scene);
  if (PRIMARY === "fal")       return falGenerate(scene);
  throw new Error(`No provider available for [${scene}]`);
}

async function processScene(scene) {
  console.log(`[${scene}] starting…`);
  const videoUrl = await generateVideo(scene);
  console.log(`[${scene}] video ready, downloading…`);
  await download(videoUrl, join(OUT_DIR, `${scene}.mp4`));
  console.log(`[${scene}] ✓ done`);
  return scene;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url.slice(0, 80)}`);
  await pipeline(res.body, createWriteStream(dest));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateVideoAssets(succeededScenes) {
  const assetPath = join(__dirname, "..", "src", "videoAssets.ts");
  let src = readFileSync(assetPath, "utf-8");
  for (const scene of succeededScenes) {
    src = src.replace(
      new RegExp(`(${scene}:[\\s\\S]*?url:)\\s*null`, "m"),
      `$1 staticFile("ai-clips/${scene}.mp4")`
    );
  }
  writeFileSync(assetPath, src);
  console.log(`\nUpdated videoAssets.ts for: ${succeededScenes.join(", ")}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const sceneNames = Object.keys(SCENES);
  console.log(`Generating ${sceneNames.length} clip(s) in parallel: ${sceneNames.join(", ")}\n`);

  const results = await Promise.allSettled(sceneNames.map(processScene));

  const succeeded = [];
  const failed    = [];
  for (const [i, res] of results.entries()) {
    const scene = sceneNames[i];
    if (res.status === "fulfilled") { succeeded.push(scene); }
    else { failed.push(scene); console.error(`✗ ${scene}: ${res.reason.message}`); }
  }

  if (succeeded.length > 0) {
    updateVideoAssets(succeeded);
    console.log(`\n✓ Clips saved to remotion/public/ai-clips/`);
    console.log(`✓ videoAssets.ts updated`);
  }

  if (failed.length > 0) {
    console.error(`\nFailed: ${failed.join(", ")}`);
    process.exit(1);
  }
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
