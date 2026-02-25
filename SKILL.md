---
name: clawd-cursor
version: 0.5.1
description: >
  AI desktop agent — control any app on Windows/macOS from your OpenClaw agent.
  Send natural language tasks to the Clawd Cursor API and it handles everything:
  opening apps, clicking buttons, typing text, navigating browsers, filling forms.
  If you can click it, your agent can too.
privacy: >
  All screenshots and data stay local on the user's machine. AI calls go only to the user's own configured
  API provider and key — no data is sent to third-party servers or skill authors. With Ollama, everything
  runs 100% locally with zero external network calls.
metadata:
  openclaw:
    requires:
      bins:
        - node
        - npm
    install:
      - git clone https://github.com/AmrDab/clawd-cursor.git
      - cd clawd-cursor && npm install && npm run build
      - cd clawd-cursor && npx clawd-cursor doctor
      - cd clawd-cursor && npm start
    privacy:
      - Screenshots processed by user's own configured AI provider only
      - With Ollama, fully offline — no external API calls
credentials:
  - name: AI_API_KEY
    sensitivity: high
    description: API key for AI provider (Anthropic, OpenAI, or Kimi). Not needed if using Ollama locally.
    required: false
---

# Clawd Cursor

**One skill, every app.** Give your agent a screen instead of integrating dozens of APIs.

---

## Agent Instructions (READ THIS FIRST)

When the user asks you to do something on their desktop — open an app, click a button, navigate a browser, type text, fill a form, send an email — route it to the Clawd Cursor API.

### The API

Clawd Cursor runs locally at `http://127.0.0.1:3847`. All communication is via REST.

### Sending a Task

```bash
curl -s -X POST http://127.0.0.1:3847/task \
  -H "Content-Type: application/json" \
  -d '{"task": "YOUR_TASK_HERE"}'
```

PowerShell:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:3847/task -Method POST -ContentType "application/json" -Body '{"task": "YOUR_TASK_HERE"}'
```

### Checking Status

```bash
curl -s http://127.0.0.1:3847/status
```

### Confirming Safety-Gated Actions

Some actions (sending messages, deleting) require approval:
```bash
curl -s -X POST http://127.0.0.1:3847/confirm \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

### Aborting a Task

```bash
curl -s -X POST http://127.0.0.1:3847/abort
```

### Task Writing Guidelines

1. **Be specific** — include app names, URLs, exact text to type, button names
2. **One task at a time** — wait for completion before sending the next
3. **Describe the goal, not the clicks** — say "Send an email to john@example.com about the meeting" not "click compose, click to field, type john..."
4. **Check status** if a task seems to hang
5. **Don't include credentials in task text** — tasks are logged

### Task Examples

| User says | Task to send |
|---|---|
| "Open Chrome and go to github.com" | `Open Chrome and go to github.com` |
| "Send an email to john about tomorrow's meeting" | `Open Gmail, compose email to john@example.com, subject: Meeting Tomorrow, body: Hi John, confirming our meeting tomorrow at 2pm. Best regards.` |
| "Open Calculator and compute 42 * 58" | `Open Calculator and compute 42 times 58` |
| "Type hello world in Notepad" | `Open Notepad and type hello world` |
| "Close all browser tabs" | `Close all browser tabs` |
| "Take a screenshot" | `Take a screenshot` |
| "Open VS Code" | `Open VS Code` |
| "Go to Settings" | `Open Settings` |

### Response Format

Success:
```json
{"status": "completed", "result": {"handled": true, "description": "Opened Chrome and navigated to github.com"}}
```

Running:
```json
{"status": "running", "task": "Open Chrome and go to github.com", "step": 3}
```

Waiting for confirmation:
```json
{"status": "confirming", "task": "Send email to john@example.com", "action": "Sending email"}
```

### Troubleshooting

- **Connection refused** → Clawd Cursor isn't running. Start it: `cd clawd-cursor && npm start`
- **Task fails repeatedly** → Rephrase with more specifics (app name, button name, exact text)
- **Needs confirmation** → Check `/status`, then POST `/confirm` with `{"approved": true}`
- **Wrong app focused** → Send "Focus [app name]" first, then your task

---

## Setup (for the user, not the agent)

```bash
git clone https://github.com/AmrDab/clawd-cursor.git
cd clawd-cursor
npm install && npm run build
npx clawd-cursor doctor    # auto-detects and configures everything
npm start                  # starts the API server on port 3847
```

### macOS Users
Grant **Accessibility permission** to your terminal app:
**System Settings → Privacy & Security → Accessibility → add Terminal/iTerm**

See `docs/MACOS-SETUP.md` for full guide.

### Provider Setup

| Provider | Setup | Cost |
|----------|-------|------|
| **Ollama (free)** | `ollama pull qwen2.5:7b` | $0 |
| **Anthropic** | Set `AI_API_KEY=sk-ant-...` | ~$3/M tokens |
| **OpenAI** | Set `AI_API_KEY=sk-...` | ~$5/M tokens |
| **Kimi** | Set `AI_API_KEY=sk-...` | ~$1/M tokens |

The `doctor` command auto-detects which provider is available.

---

## How It Works — 4-Layer Pipeline

| Layer | What | Speed | Cost |
|-------|------|-------|------|
| **0: Browser Layer** | URL detection → direct navigation | Instant | Free |
| **1: Action Router** | Regex + UI Automation | Instant | Free |
| **1.5: Smart Interaction** | 1 LLM plan → CDP/UIDriver executes | ~2-5s | 1 LLM call |
| **2: Accessibility Reasoner** | UI tree → text LLM decides | ~1s | Cheap |
| **3: Computer Use** | Screenshot → vision LLM | ~5-8s | Expensive |

80%+ of tasks handled by Layer 0-1 (free, instant). Vision model is last resort only.

## Safety Tiers

| Tier | Actions | Behavior |
|------|---------|----------|
| 🟢 Auto | Navigation, reading, opening apps | Runs immediately |
| 🟡 Preview | Typing, form filling | Logs before executing |
| 🔴 Confirm | Sending messages, deleting | Pauses — agent must POST `/confirm` |

## Security

- API binds to 127.0.0.1 only — not network accessible
- Screenshots stay in memory, never saved to disk (unless `--debug`)
- With Ollama, 100% local — zero external API calls
