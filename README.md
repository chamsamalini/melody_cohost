# Melody Co-Host Voice Agent

A minimal browser app for an online-meeting co-host named Melody. Melody listens through an OpenAI Realtime WebRTC session, processes the meeting agenda when the host provides it by document or verbal briefing, stays silent while observing, and only speaks when the host activates her or someone calls her name.

## Requirements

- Node.js 20 or later
- An OpenAI API key with Realtime API access
- A modern browser with microphone access
- For desktop packaging: Windows with build tools supported by `electron-builder`

## Setup

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`.

Optional low-latency ElevenLabs voice mode (server-side key only):

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID` (optional, default: `eleven_turbo_v2_5`)

For PowerShell sessions, you can also set the key directly:

```powershell
$env:OPENAI_API_KEY="sk-your-key-here"
npm.cmd start
```

You can also run the server without npm:

```powershell
node server.mjs
```

Open:

```text
http://localhost:8787
```

## Desktop App (Electron)

Run Melody as a desktop app:

```powershell
npm.cmd run desktop:start
```

Build a Windows portable desktop package:

```powershell
npm.cmd run desktop:pack:win
```

Build outputs:

- Portable package: `dist/Melody-CoHost-<version>.exe`
- Unpacked executable: `dist/win-unpacked/Melody Co-Host.exe`

## Web App (AWS)

Run web mode locally:

```powershell
npm.cmd run web:start
```

Build Docker image for web deployment:

```powershell
npm.cmd run web:docker:build
```

Run Docker image locally:

```powershell
npm.cmd run web:docker:run
```

AWS deployment configuration:

- App Runner config: `aws/apprunner.yaml`
- Deployment guide: `aws/README.md`

## Dual-Target Amendment Rule

When amendment requests are accepted, apply and verify the impact for both targets:

- Desktop target (Electron runtime and packaging)
- Web target (Node service and AWS deployment path)

Record both-target impact in `specs/<feature>/amendments.md`.

## How Melody Works

- The Realtime session uses VAD to listen and commit speech turns.
- Automatic model replies are disabled with `create_response: false`.
- The browser app manually sends `response.create` only after Melody is activated.
- When ElevenLabs is configured, Melody requests text responses from Realtime and synthesizes playback through the server `/tts` endpoint.
- The browser uses chunked audio playback when supported, so Melody can start speaking before full synthesis completes.
- The meeting agenda must be provided by the host through document content or a verbal briefing before Melody can provide agenda-specific support.
- Input transcription is enabled so the app can detect the trigger name, capture a verbal agenda briefing, and show the meeting transcript.
- Melody's prompt asks for a warm, respectful, Asian professional hosting style without fake accent, ethnicity claims, or stereotypes.

## Host Controls

- `Connect`: starts the microphone and Realtime session.
- `Activate Melody`: asks Melody to welcome the guests.
- `Pause Melody`: returns Melody to silent observing.
- `New Session`: clears the conversation context.
- `Save Agenda`: stores pasted agenda document content for Melody's meeting context.
- `Capture Verbal Agenda`: captures completed transcript turns as agenda context until stopped.
- `Auto converse after activation`: lets Melody respond after each completed participant turn.

## Spec Kit Workflow

This repo includes local GitHub Spec Kit scaffolding for Codex:

- Project constitution: `.specify/memory/constitution.md`
- Context augmentation: `.specify/context-augmentation.md`
- Command templates: `.specify/templates/commands/`
- Codex skill wrappers: `.agents/skills/speckit-*/SKILL.md`

Use the flow: `$speckit-constitution` -> `$speckit-specify` -> `$speckit-plan` -> `$speckit-tasks` -> `$speckit-analyze` -> `$speckit-implement`.

Amendment handling rule: when a user provides an amendment request for the active feature, log it in `specs/<feature>/amendments.md` and update impacted Spec Kit artifacts in the same session.

## Files

- `server.mjs`: static file server and `/session` endpoint for Realtime WebRTC.
- `server.mjs`: static file server, `/session` Realtime WebRTC endpoint, and `/tts` ElevenLabs synthesis endpoint.
- `public/index.html`: host console.
- `public/app.js`: WebRTC, trigger detection, and Melody response control.
- `public/styles.css`: UI styling.
