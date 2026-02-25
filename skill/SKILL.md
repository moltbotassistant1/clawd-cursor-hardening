---
name: clawd-cursor-bridge
version: 0.5.1
description: >
  Bridge skill that lets your OpenClaw agent control your desktop via Clawd Cursor.
  Talk to your agent naturally ("open Chrome and go to github.com") and it routes
  desktop tasks to the Clawd Cursor API running locally.
---

# Clawd Cursor Bridge — OpenClaw Skill

This skill lets your OpenClaw agent send desktop automation tasks to a running Clawd Cursor instance.

## Prerequisites

Clawd Cursor must be running locally:
```bash
cd clawd-cursor
npm start
```
Server runs at `http://127.0.0.1:3847` by default.

## How to Use

When the user asks you to do something on their desktop (open an app, click something, navigate a browser, type text, fill a form, etc.), send it to Clawd Cursor via its REST API.

### Sending a Task

Use the `exec` tool to POST to the local Clawd Cursor API:

```bash
curl -s -X POST http://127.0.0.1:3847/task -H "Content-Type: application/json" -d '{"task": "YOUR_TASK_HERE"}'
```

PowerShell equivalent:
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:3847/task -Method POST -ContentType "application/json" -Body '{"task": "YOUR_TASK_HERE"}'
```

### Checking Status

```bash
curl -s http://127.0.0.1:3847/status
```

### Confirming Actions (for safety-gated tasks)

When Clawd Cursor pauses for confirmation (sending messages, deleting files):
```bash
curl -s -X POST http://127.0.0.1:3847/confirm -H "Content-Type: application/json" -d '{"approved": true}'
```

### Aborting a Task

```bash
curl -s -X POST http://127.0.0.1:3847/abort
```

## Task Examples

| User says | Task to send |
|---|---|
| "Open Chrome and go to github.com" | `{"task": "Open Chrome and go to github.com"}` |
| "Send an email to john@example.com about the meeting" | `{"task": "Open Gmail, compose email to john@example.com, subject: Meeting, body: Hi John, just confirming our meeting tomorrow. Best regards."}` |
| "Open Calculator and compute 42 * 58" | `{"task": "Open Calculator and compute 42 times 58"}` |
| "Take a screenshot" | `{"task": "Take a screenshot"}` |
| "Close all browser tabs" | `{"task": "Close all browser tabs"}` |

## Guidelines

1. **Be specific in task descriptions** — include app names, URLs, text to type, buttons to click
2. **One task at a time** — wait for completion before sending the next
3. **Check status** if a task seems to hang — `GET /status` shows current state
4. **Confirm when prompted** — some actions require explicit approval
5. **Don't send sensitive credentials as task text** — Clawd Cursor logs tasks

## Response Format

The API returns JSON:
```json
{
  "status": "completed",
  "result": {
    "handled": true,
    "description": "Opened Chrome and navigated to github.com"
  }
}
```

If the task is still running:
```json
{
  "status": "running",
  "task": "Open Chrome and go to github.com",
  "step": 3
}
```

## Troubleshooting

- **Connection refused** — Clawd Cursor isn't running. Start it with `npm start` in the clawd-cursor directory.
- **Task fails repeatedly** — Try rephrasing. Be more specific about which app/button/field.
- **Needs confirmation** — Check `/status`, then POST to `/confirm` with `{"approved": true}`.
