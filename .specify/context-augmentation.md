# Context Augmentation

Use this file to ground Spec Kit work in the real repository before writing or changing specs, plans, tasks, or implementation.

## Repository Snapshot

- Project: Melody Co-Host Voice Agent
- Purpose: Browser host console for an AI online-meeting co-host named Melody.
- Problem statement: Online meeting hosts need Melody to listen through a Realtime WebRTC session, process a meeting agenda supplied by document or verbal briefing, stay silent while observing, and speak only when activated by the host or addressed by the configured trigger name.
- Runtime: Node.js static server plus OpenAI Realtime WebRTC session endpoint.
- Main server file: `server.mjs`
- Browser UI: `public/index.html`
- Browser behavior: `public/app.js`
- Browser styling: `public/styles.css`
- Local launcher: `run-app.bat`
- Active Spec Kit feature: `specs/001-melody-cohost`

## Required Context Checks

Before `speckit.specify`:

- Read `README.md` for project purpose, online-meeting scope, agenda handling, and host controls.
- Inspect `public/app.js` when a feature touches activation, transcript, WebRTC, trigger detection, agenda context, or audio behavior.
- Inspect `server.mjs` when a feature touches session creation, environment variables, model, voice, VAD, transcription, prompt behavior, or static file serving.

Before `speckit.plan`:

- Read `.specify/memory/constitution.md`.
- Verify the plan preserves the current minimal Node and vanilla browser architecture unless the spec justifies a change.
- Identify validation steps, including `npm.cmd run check` and any required browser/manual audio checks.

Before `speckit.tasks`:

- Ensure tasks name exact project files.
- Keep `.env`, logs, credentials, transcript content, and agenda content out of version-controlled runtime artifacts.
- Separate independently testable UI, server, agenda, and documentation work.

Before `speckit.implement`:

- Confirm `spec.md`, `plan.md`, and `tasks.md` agree on online-meeting scope, agenda handling, activation behavior, privacy implications, and validation.
- Run or document the relevant checks before reporting completion.

## Current Assumptions

- `OPENAI_API_KEY` is supplied locally through `.env`.
- The app is expected to run at `http://localhost:8787`.
- This is a small local app, not a multi-service deployment.
- Functional and non-functional requirements for the baseline are captured in `specs/001-melody-cohost/spec.md`.
- Melody is scoped to online meetings only.
- The meeting agenda must be provided by the host through document content or verbal briefing before Melody can provide agenda-specific help.
