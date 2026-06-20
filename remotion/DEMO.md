# Remotion + HyperFrames MCP Demo

## What this shows

Two complementary approaches to **programmatic video creation**, demonstrated live by Claude Code via MCP.

---

## 1 · Remotion (Local / Code-Driven)

**Remotion** lets you write React components that become video frames. This folder is a working Remotion project.

### Structure

```
remotion/
├── src/
│   ├── index.ts            # Entry point — registers Root
│   ├── Root.tsx            # Defines Compositions (ProFlowPromo, ProFlowShort)
│   ├── ProFlowVideo.tsx    # Main video — sequences all scenes with cross-fades
│   ├── PreviewApp.tsx      # @remotion/player browser demo
│   ├── components/
│   │   ├── AnimatedText.tsx    # spring/interpolate text animations
│   │   └── WaterDrop.tsx       # physics-driven drop & pipe-flow decorations
│   └── scenes/
│       ├── Intro.tsx           # Scene 1 (0s–5s):  brand reveal, logo, tagline
│       ├── Services.tsx        # Scene 2 (5s–14s): 4 services cycle with spotlight
│       ├── Stats.tsx           # Scene 3 (14s–21s): count-up stat cards
│       └── CallToAction.tsx    # Scene 4 (21s–30s): phone + CTA button + rings
```

### Scene Timeline (30fps)

| Scene       | Frames    | Duration |
|-------------|-----------|----------|
| Intro       | 0 – 149   | 5 s      |
| Services    | 150 – 419 | 9 s      |
| Stats       | 420 – 629 | 7 s      |
| Call to Action | 630 – 899 | 9 s   |

### Core Remotion APIs used

| API | What it does |
|-----|--------------|
| `useCurrentFrame()` | Returns the current frame number — the single source of truth for animation |
| `useVideoConfig()` | Returns `fps`, `width`, `height`, `durationInFrames` |
| `interpolate(frame, [in], [out])` | Maps frame range → value range (opacity, position, scale) |
| `spring({ fps, frame, config })` | Physics-based spring animation — damping + stiffness |
| `<Sequence from={N} durationInFrames={D}>` | Renders a child only during its time window |
| `<AbsoluteFill>` | Full-size absolute-positioned container |
| `<Composition>` | Registers a renderable video with id, fps, dimensions |
| `<Player>` | In-browser preview without rendering to disk |

### Quick start

```bash
cd remotion
npm install

# Open Remotion Studio (live preview at localhost:3000)
npm start

# Render to MP4 (requires ffmpeg)
npm run build

# Render a thumbnail still at frame 30
npm run render:still
```

---

## 2 · HyperFrames MCP (Cloud / AI-Driven)

**HeyGen HyperFrames** is a hosted video creation platform. Via MCP, Claude can compose entire video projects in natural language — no code required.

### How it works

```
User prompt → MCP compose tool → HeyGen cloud agent → MP4 render → download link
```

### Available from Claude.ai (web / desktop)

```
User: "Create a 30-second ProFlow Plumbing promo — navy/blue palette, 
       show Emergency Repairs, Water Heater, Pipe Replacement, Drain Cleaning.
       End with a 24/7 call-to-action."

Claude → mcp__heygen__compose(prompt) → project_id: "xyz123"
Claude → mcp__heygen__get_project_status(project_id) → "completed"  
Claude → mcp__heygen__render_video(project_id) → video_url: "https://..."
```

### Why it's disabled in Claude Code CLI

HyperFrames `compose` + `render_video` are blocked for local CLI agents because those environments have a filesystem — use Remotion or local HyperFrames skills instead:

```bash
npx skills add heygen-com/hyperframes
# Then use /hyperframes slash command in Claude Code
```

### When to use each

| | Remotion | HyperFrames MCP |
|---|---|---|
| **Environment** | Local / CI | Claude.ai web |
| **Control** | Frame-precise React code | Natural language prompt |
| **Output** | Standalone HTML + MP4 | Hosted project + MP4 |
| **Editable** | Yes — git diff, commit | Yes — in HeyGen app |
| **Best for** | Data-driven, templated videos | Quick AI-generated promos |

---

## MCP tools demonstrated

| Tool | Status | Description |
|------|--------|-------------|
| `compose` | Blocked (CLI agent) | Create/edit a HyperFrames project |
| `render_video` | Blocked (CLI agent) | Trigger cloud MP4 render |
| `list_projects` | ✅ Works | List your HeyGen video projects |
| `get_project` | ✅ Works | Fetch project by ID with player |
| `get_project_status` | ✅ Works | Poll compose progress |
| `get_render_status` | ✅ Works | Get download URL when ready |
