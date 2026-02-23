---
name: clawd-cursor
version: 0.4.0
description: >
  AI desktop agent that controls Windows/Mac natively via @nut-tree-fork/nut-js. Gives your agent eyes and full cursor control —
  direct screen capture, mouse clicks, keyboard input, drag operations, and GUI automation.
  Use when the user wants desktop automation, native AI control, or GUI testing.
  No external server required. Requires: AI API key (Anthropic or OpenAI) for vision features.
  Installs: Node.js dependencies via npm.
  Privacy note: screenshots are sent to AI provider APIs (Anthropic/OpenAI) for vision processing.
metadata:
  openclaw:
    requires:
      env:
        - AI_API_KEY
      bins:
        - node
        - npm
    primaryEnv: AI_API_KEY
    install:
      - git clone https://github.com/AmrDab/clawd-cursor.git
      - cd clawd-cursor && npm install && npm run build
    privacy:
      - Screenshots sent to external AI provider (Anthropic/OpenAI)
---

# Clawd Cursor

**One skill, multiple endpoints.** Instead of integrating dozens of APIs, give your agent a screen. Gmail, Slack, Jira, Figma — if you can click it, your agent can too. Desktop automation skill for OpenClaw via native OS-level control.

## Required Credentials

| Variable | Sensitivity | Purpose |
|----------|------------|---------|
| `AI_API_KEY` | **High** — enables external API calls | Anthropic or OpenAI key for vision/planning |

**Privacy:** Screenshots of your desktop are sent to the configured AI provider (Anthropic or OpenAI) for processing. Only use on machines without sensitive data visible, or in a sandbox/VM.

**Optional variables:** `AI_PROVIDER` (anthropic\|openai)

## Installation

Requires **Node.js 20+**.

```bash
git clone https://github.com/AmrDab/clawd-cursor.git
cd clawd-cursor
npm install && npm run build
```

No external server or setup script required — native desktop control works out of the box.

## Configuration

Create `.env` in project root:

```env
AI_API_KEY=sk-ant-api03-...
AI_PROVIDER=anthropic
```

## Running

```bash
# Computer Use (Anthropic — recommended for complex tasks)
npm start -- --provider anthropic

# Action Router (OpenAI/offline — fast for simple tasks)
npm start -- --provider openai
```

## Execution Paths

### Path A: Computer Use API (Anthropic)
Full task → Claude with native `computer_20250124` tools → screenshots, plans, executes autonomously.
Best for complex multi-app workflows. ~100–156s. Very reliable.

### Path B: Decompose + Route (OpenAI/Offline)
Task → subtasks → UI Automation tree → direct element interaction. Zero LLM for common patterns.
Best for simple tasks. ~2s. Works offline.

## Safety Tiers

| Tier | Actions | Behavior |
|------|---------|----------|
| 🟢 Auto | Navigation, reading, opening apps | Runs immediately |
| 🟡 Preview | Typing, form filling | Logs before executing |
| 🔴 Confirm | Sending messages, deleting, purchases | Pauses for `/confirm` approval |

## API Endpoints

`http://localhost:3847`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/task` | POST | `{"task": "Open Chrome"}` |
| `/status` | GET | Agent state |
| `/confirm` | POST | `{"approved": true}` |
| `/abort` | POST | Stop current task |

## Security Considerations

- **Screenshots are NOT saved to disk by default.** They are held in memory only and sent to the AI provider for processing. Use `--debug` flag to enable disk saves for troubleshooting.
- AI API keys allow **sending screenshots to external APIs** — use scoped/temporary keys, rotate after testing.
- The Express API **binds to 127.0.0.1 only** — not accessible from other machines on the network.
- The `/confirm` endpoint enforces the 🔴 safety tier for destructive actions (send messages, delete files, purchases).
- Run in a **sandbox or VM** when testing with sensitive data visible on screen.
- **No postinstall scripts** — `npm install` only fetches dependencies, no code runs automatically.

## Changelog

### v0.4.0
- **Native desktop control** via @nut-tree-fork/nut-js — no VNC server required
- 17× faster screenshots (~50ms vs ~850ms)
- 5× faster connect time (~38ms vs ~200ms)
- Simplified onboarding: `npm install && npm start`

### v0.3.3
- Bulletproof headless setup — setup.ps1 runs end-to-end in non-interactive shells

### v0.3.0
- 6 performance optimizations (~70% faster task execution, 90% fewer redundant LLM calls)

### v0.2.0
- Anthropic Computer Use API as primary execution path
- Action Router (zero-LLM) for simple tasks
