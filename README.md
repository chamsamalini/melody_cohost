# Melody Co-Host Voice Agent

A minimal browser app for an event co-host named Melody. Melody listens through an OpenAI Realtime WebRTC session, stays silent while observing, and only speaks when the host activates her or someone calls her name.

## Requirements

- Node.js 20 or later
- An OpenAI API key with Realtime API access
- A modern browser with microphone access

## Setup

```powershell
Copy-Item .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY`.

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

## How Melody Works

- The Realtime session uses VAD to listen and commit speech turns.
- Automatic model replies are disabled with `create_response: false`.
- The browser app manually sends `response.create` only after Melody is activated.
- Input transcription is enabled so the app can detect the trigger name and show the event transcript.
- Melody's prompt asks for a warm, respectful, Asian professional hosting style without fake accent, ethnicity claims, or stereotypes.

## Host Controls

- `Connect`: starts the microphone and Realtime session.
- `Activate Melody`: asks Melody to welcome the guests.
- `Pause Melody`: returns Melody to silent observing.
- `New Session`: clears the conversation context.
- `Auto converse after activation`: lets Melody respond after each completed participant turn.

## Files

- `server.mjs`: static file server and `/session` endpoint for Realtime WebRTC.
- `public/index.html`: host console.
- `public/app.js`: WebRTC, trigger detection, and Melody response control.
- `public/styles.css`: UI styling.
