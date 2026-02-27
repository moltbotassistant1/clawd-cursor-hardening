<p align="center">
  <img src="docs/favicon.svg" width="80" alt="Clawd Cursor">
</p>

<h1 align="center">Clawd Cursor</h1>

<p align="center">
  <strong>AI Desktop Agent - Smart 3-Layer Pipeline</strong><br>
  Works with any AI provider · Runs free with local models · Self-healing doctor
</p>

<p align="center">
  <a href="https://discord.gg/YOUR_INVITE_CODE"><img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
</p>

<p align="center">
  <a href="https://clawdcursor.com">Website</a> · <a href="https://discord.gg/YOUR_INVITE_CODE">Discord</a> · <a href="#quick-start">Quick Start</a> · <a href="#how-it-works">How It Works</a> · <a href="#api-endpoints">API</a> · <a href="CHANGELOG.md">Changelog</a>
</p>

---

## What's New in v0.5.6

**Fluid LLM Decomposition, Interactive Doctor, Smart Vision Fallback.**

- **🧠 Fluid task decomposition** — LLM reasons about what ANY app needs instead of matching hardcoded patterns. "Write me a sentence about dogs" now generates actual content, not literal text.
- **🩺 Interactive doctor onboarding** — scans all providers (Ollama, Anthropic, OpenAI, Kimi), detects GPU/VRAM, shows TEXT and VISION LLM options with recommendations, lets you pick. Paste an API key inline to add a cloud provider.
- **🖥️ Smart vision fallback** — when cheap layers handle part of a compound task but fail midway, remaining subtasks are bundled and handed to Computer Use (vision). No more false-success trapping.
- **🔄 Ollama auto-detection** — brain auto-reconfigures to use local Ollama for decomposition when no cloud API key is set. No more "offline mode" when Ollama is running.
- **🖱️ Flexible click routing** — action router handles `click Blank document` (no quotes needed), preserves case for typed text and URLs.
- **⚡ Compound task guard** — action router detects multi-step tasks and skips to deeper layers instead of trying to handle them as single actions.

### v0.5.2 — Web Dashboard + Browser Foreground Focus Full web UI for controlling tasks, real-time logs, and the AI now brings the browser to the foreground so you see everything it does — like watching a cursor move.

- **🖥️ Web Dashboard** — open `http://localhost:3847` or run `clawdcursor dashboard`. Submit tasks, view real-time logs, approve/reject safety confirmations, kill switch. Dark theme, zero dependencies.
- **🪟 Browser foreground focus** — Playwright navigation now activates Chrome at the OS level. No more invisible background tabs.
- **🧠 Smart task handoff** — no more regex word lists. LLM plans multi-step browser tasks (e.g. "open youtube and play adele") instead of pattern matching.
- **Multi-provider** — Anthropic, OpenAI, Ollama (local/free), Kimi
- **95% cheaper** — simple tasks run for $0 with local Qwen
- **Self-healing** — if a model fails, the pipeline adapts automatically

### Performance

| Task | v0.4 (Anthropic only) | v0.5+ (Ollama, $0) | v0.5+ (Anthropic) |
|------|-----------------------|---------------------|-------------------|
| Calculator (255*38=) | 43s | **2.6s** | **20.1s** |
| Notepad (type hello) | 73s | **2.0s** | **54.2s** |
| File Explorer | 53s | **1.9s** | **22.1s** |
| Gmail compose | 162s (18 LLM calls) | — | **21.7s** (1 LLM call) |

---

## OpenClaw Integration

Clawd Cursor ships as an [OpenClaw](https://openclaw.ai) skill. Install it and any OpenClaw agent — yours or community-built — can control your desktop through natural language.

The [`SKILL.md`](SKILL.md) teaches agents **when and how** to use Clawd Cursor: REST API for full desktop control, CDP direct for fast browser reads. Agents learn to be independent — no more asking you to screenshot or copy-paste things they can do themselves.

```bash
# Install as OpenClaw skill
openclaw skills install clawd-cursor
```

---

## Quick Start

### Windows

```powershell
git clone https://github.com/AmrDab/clawd-cursor.git
cd clawd-cursor
npm install
npm run setup      # builds + registers 'clawdcursor' command globally
clawdcursor doctor
clawdcursor start
```

### macOS

```bash
git clone https://github.com/AmrDab/clawd-cursor.git
cd clawd-cursor && npm install && npm run setup

# Grant Accessibility permissions to your terminal first!
# System Settings → Privacy & Security → Accessibility → Add Terminal/iTerm

# Make macOS scripts executable
chmod +x scripts/mac/*.sh scripts/mac/*.jxa

clawdcursor doctor
clawdcursor start
```

### Linux

```bash
git clone https://github.com/AmrDab/clawd-cursor.git
cd clawd-cursor && npm install && npm run setup

# Linux: browser control via CDP only (no native desktop automation)
clawdcursor doctor
clawdcursor start
```

> 📖 See [docs/MACOS-SETUP.md](docs/MACOS-SETUP.md) for the full macOS onboarding guide.

The doctor will:
1. Test your screen capture and accessibility bridge
2. Scan all AI providers (Anthropic, OpenAI, Ollama, Kimi) and detect GPU/VRAM
3. Test each model and show you what works with latency
4. Let you pick your TEXT LLM and VISION LLM (or accept the recommended defaults)
5. Show setup instructions for any unconfigured cloud providers
6. Build your optimal pipeline and save it

Send a task:
```bash
clawdcursor task "Open Notepad and type hello world"

# Or via API:
curl http://localhost:3847/task -H "Content-Type: application/json" \
  -d '{"task": "Open Notepad and type hello world"}'
```

> **Note:** `npm run setup` runs `npm run build && npm link`, which registers `clawdcursor` as a global command. If you prefer not to link globally, run `npm run build` instead and use `npx clawdcursor` or `node dist/index.js` to run commands.

### Provider Quick Setup

**Free (no API key needed):**
```bash
# Just need Ollama running locally
ollama pull qwen2.5:7b
clawdcursor doctor --provider ollama
clawdcursor start --provider ollama
```

**Anthropic (recommended for complex tasks):**
```bash
echo "AI_API_KEY=sk-ant-api03-..." > .env
clawdcursor doctor
clawdcursor start
```

**OpenAI:**
```bash
echo "AI_API_KEY=sk-..." > .env
clawdcursor doctor --provider openai
clawdcursor start --provider openai
```

---

## How It Works

### The 5-Layer Pipeline

Every task flows through up to 5 layers. Each layer is cheaper and faster than the next. Most tasks never reach Layer 3.

```
┌─────────────────────────────────────────────────────┐
│  Layer 0: Browser (Playwright — free, instant)       │
│  Direct browser control via CDP. page.goto(),        │
│  brings Chrome to foreground. Zero vision tokens.     │
├─────────────────────────────────────────────────────┤
│  Layer 1: Action Router (instant, free)              │
│  Regex + UI Automation. "Open X", "type Y", "click Z"│
│  Handles ~80% of simple tasks with ZERO LLM calls    │
├─────────────────────────────────────────────────────┤
│  Layer 1.5: Smart Interaction (1 LLM call)           │
│  CDPDriver (browser) or UIDriver (desktop apps).     │
│  LLM plans steps → executes via selectors/a11y.      │
├─────────────────────────────────────────────────────┤
│  Layer 2: Accessibility Reasoner (fast, cheap/free)   │
│  Reads the accessibility tree, sends to cheap LLM     │
│  (Haiku, Qwen, GPT-4o-mini). No screenshots needed   │
├─────────────────────────────────────────────────────┤
│  Layer 3: Screenshot + Vision (powerful, expensive)   │
│  Full screenshot → vision LLM. Computer Use for       │
│  Anthropic, vision fallback for OpenAI/others         │
└─────────────────────────────────────────────────────┘
```

**The doctor decides which layers are available** based on your setup. No API key? Layers 0-2 with Ollama. Anthropic key? All layers with Computer Use.

### Provider-Specific Behavior

| Provider | Layer 1 | Layer 2 (text) | Layer 3 (vision) | Computer Use |
|----------|---------|----------------|-------------------|-------------|
| Anthropic | ✅ | Haiku or Qwen | Sonnet | ✅ Native |
| OpenAI | ✅ | GPT-4o-mini | GPT-4o | ❌ |
| Ollama | ✅ | Qwen 7B (free) | Limited | ❌ |
| Kimi | ✅ | Moonshot-8k | Moonshot-8k | ❌ |
| No key | ✅ | ❌ | ❌ | ❌ |

### Self-Healing

The pipeline adapts at runtime:
- **Model fails?** → Circuit breaker trips, falls to next layer
- **API rate limited?** → Exponential backoff + automatic retry
- **Doctor detects issues?** → Falls back to available alternatives (e.g., Haiku unavailable → Ollama Qwen)

---

## Doctor

```bash
npm run doctor
```

```
🩺 Clawd Cursor Doctor - diagnosing your setup...

📸 Screen capture...
   ✅ 2560x1440, 110ms
♿ Accessibility bridge...
   ✅ 20 windows detected, 822ms

🔍 Scanning providers...
   Anthropic:           ✅ key found (sk-ant-a...)
   OpenAI:              ❌ no key
   Kimi (Moonshot):     ❌ no key
   Ollama (Local):      ✅ running (qwen3:8b, qwen2.5:7b, deepseek-r1:8b)

   💡 Cloud providers not configured (add API keys to unlock):
      OpenAI: set OPENAI_API_KEY — https://platform.openai.com (GPT-4o vision)
      Kimi: set MOONSHOT_API_KEY — https://platform.moonshot.cn (256k context, affordable)

   Testing models...
   Text:   claude-haiku-4-5 (Anthropic) ✅ 498ms
   Vision: claude-sonnet-4 (Anthropic) ✅ 1217ms
   Text:   qwen2.5:7b (Ollama) ✅ 4117ms

🎮 GPU detected: NVIDIA GeForce RTX 3080 (10240 MB VRAM)

🧩 Choose your pipeline models (press Enter for recommended).
   TEXT LLM (Layer 2):
   1. claude-haiku-4-5 (Anthropic, 498ms)
   2. qwen2.5:7b (Ollama, 4117ms) ★ recommended
   Pick 1-2 (Enter=2):

   VISION LLM (Layer 3):
   1. claude-sonnet-4 (Anthropic, 1217ms) ★ recommended
   Pick 1 (Enter=1):

🧠 Selected pipeline:
   Layer 1: Action Router (offline) ✅
   Layer 2: qwen2.5:7b via Ollama ✅
   Layer 3: claude-sonnet-4 via Anthropic ✅
   🖥️  Computer Use API: enabled

💾 Config saved to .clawd-config.json
```

Options:
```
--provider <name>   Force a provider (anthropic|openai|ollama|kimi)
--api-key <key>     Override API key
--no-save           Don't save config to disk
```

---

## API Endpoints

`http://localhost:3847`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web dashboard UI |
| `/task` | POST | Execute a task: `{"task": "Open Chrome"}` |
| `/status` | GET | Agent state and current task |
| `/logs` | GET | Last 200 log entries (JSON array) |
| `/confirm` | POST | Approve/reject pending action |
| `/abort` | POST | Stop the current task |
| `/stop` | POST | Graceful server shutdown |
| `/health` | GET | Server health + version |

---

## Architecture

```
┌───────────────────────────────────────────────────┐
│           Your Desktop (Native Control)            │
│     @nut-tree-fork/nut-js · Playwright · OS-level  │
└──────────────────────┬────────────────────────────┘
                       │
┌──────────────────────┴────────────────────────────┐
│              Clawd Cursor Agent                    │
│                                                    │
│  ┌────────┐ ┌────────┐ ┌───────┐ ┌─────┐ ┌─────┐│
│  │Layer 0 │ │Layer 1 │ │L 1.5  │ │ L2  │ │ L3  ││
│  │Browser │→│Action  │→│Smart  │→│A11y │→│Vision││
│  │Playwrt │ │Router  │ │Interac│ │Tree │ │+CU   ││
│  │(free)  │ │(free)  │ │(1 LLM)│ │(cheap│ │(full)││
│  └────────┘ └────────┘ └───────┘ └─────┘ └─────┘│
│       ↑                                            │
│  ┌──────────┐  ┌────────────────┐                 │
│  │ Doctor   │  │ Web Dashboard  │                 │
│  │ Auto-cfg │  │ localhost:3847 │                 │
│  └──────────┘  └────────────────┘                 │
│                                                    │
│  Safety Layer · REST API · Circuit Breaker         │
└────────────────────────────────────────────────────┘
```

---

## Safety Tiers

| Tier | Actions | Behavior |
|------|---------|----------|
| 🟢 Auto | Navigation, reading, opening apps | Runs immediately |
| 🟡 Preview | Typing, form filling | Logs before executing |
| 🔴 Confirm | Sending messages, deleting, purchases | Pauses for approval |

## CLI Options

```
clawdcursor start        Start the agent
clawdcursor doctor       Diagnose and auto-configure
clawdcursor task <t>     Send a task to running agent
clawdcursor dashboard    Open the web dashboard in your browser
clawdcursor kill         Stop the running server
clawdcursor stop         Stop the running server

Options:
  --port <port>          API port (default: 3847)
  --provider <provider>  anthropic|openai|ollama|kimi
  --model <model>        Override vision model
  --api-key <key>        AI provider API key
  --debug                Save screenshots to debug/ folder
```

## Platform Support

| Platform | UI Automation | Browser (CDP) | Status |
|----------|---------------|---------------|--------|
| **Windows** | PowerShell + .NET UI Automation | ✅ Chrome/Edge | ✅ Full support |
| **macOS** | JXA + System Events (Accessibility API) | ✅ Chrome/Edge | ✅ Full support |
| **Linux** | — | ✅ Chrome/Edge (CDP only) | 🔶 Browser only |

### Platform Notes

- **Windows**: Uses `powershell.exe` + `.NET UIAutomationClient` for native app interaction. Shell chaining: `cd dir; npm start`
- **macOS**: Uses `osascript` + JXA (JavaScript for Automation) + System Events. Requires Accessibility permissions. Shell chaining: `cd dir && npm start`. See [docs/MACOS-SETUP.md](docs/MACOS-SETUP.md).
- **Both**: CDPDriver (browser automation) works identically — connects via WebSocket to `localhost:9222`.

### Browser CDP Setup

```bash
# Windows (PowerShell)
Start-Process chrome --ArgumentList "--remote-debugging-port=9222"

# macOS (Bash)
open -a "Google Chrome" --args --remote-debugging-port=9222

# Edge on macOS
open -a "Microsoft Edge" --args --remote-debugging-port=9222
```

## Prerequisites

- **Node.js 18+** (20+ recommended)
- **Windows**: PowerShell (included with Windows)
- **macOS 13+**: osascript (included), Accessibility permissions granted
- **AI API Key** - optional. Works offline with Ollama or Action Router only.

## Tech Stack

TypeScript · Node.js · @nut-tree-fork/nut-js · sharp · Express · Anthropic Computer Use API · Windows UI Automation · macOS Accessibility (JXA) · Ollama

## License

MIT

---

<p align="center">
  <a href="https://clawdcursor.com">clawdcursor.com</a>
</p>
