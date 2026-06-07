# Implementation Notes: Melody Online Meeting Co-Host Voice Agent

**Feature Directory**: `specs/001-melody-cohost`
**Status**: Current implementation supports online-meeting wording, document agenda text, verbal agenda capture, agenda status, agenda-aware response instructions, and paced participant turn handling.

## Current Implementation Coverage

- `server.mjs` serves static files, loads `.env`, exposes `/health`, and creates Realtime calls through `/session`.
- `server.mjs` keeps `OPENAI_API_KEY` server-side.
- `server.mjs` configures Realtime input transcription and disables automatic response creation.
- `server.mjs` scopes Melody to online meetings and instructs her not to invent agenda details.
- `public/index.html` exposes session, host, agenda, behavior, transcript, and activity controls.
- `public/app.js` handles microphone access, WebRTC peer connection, data-channel events, activation logic, trigger matching, agenda state, document agenda saving, verbal agenda capture, transcript entries, event logs, agenda-aware response instructions, and cleanup.
- `public/app.js` applies a 3-second response hold after participant turns, cancels pending replies on follow-up speech, and queues next-turn responses when Melody is already responding.
- `public/app.js` enforces scope boundaries to event context, event title (when present), and current audience topic, with brief redirect behavior for off-topic asks.
- `public/styles.css` provides the local console layout, agenda controls, and visual states.
- `run-app.bat` provides a Windows-friendly local launcher.
- `desktop/main.cjs` provides an Electron desktop wrapper that starts the local server and loads the host console in a desktop window.
- `Dockerfile` and `aws/apprunner.yaml` provide web deployment paths for AWS runtime targets.
- `aws/apprunner-production-checklist.md` provides production release checks for web deployment hardening.
- `public/index.html`, `public/app.js`, and `public/styles.css` include an explicit auto-converse status callout so hosts can see when active-mode conversational automation is on or off.

## Implementation Rules

- Do not expose `OPENAI_API_KEY` in client code or logs.
- Do not let Melody speak automatically from Realtime VAD alone.
- Keep `response.create` controlled by host activation, trigger detection, or active-mode conversation rules.
- Keep Melody scoped to online meetings only.
- Use only host-provided or participant-provided agenda information; ask for clarification when agenda details are missing.
- Keep Melody responses concise and aligned with the prompt safety requirements.
- Wait briefly after participant turns to allow natural continuation and avoid rushed interruptions.
- Keep Melody anchored to current meeting context and ask a concise probing clarification question when participant intent is unclear.
- Keep Melody constrained to event context, event title, and the current audience topic; redirect off-topic personal/social asks back to the event discussion.
- Keep desktop runtime behavior aligned with browser runtime behavior and local environment handling.
- Keep desktop and web/AWS targets aligned for user-visible behavior unless a requirement explicitly scopes to one target.
- Preserve microphone cleanup on stop/reset.

## Verification Commands

```powershell
npm.cmd run check
npm.cmd start
npm.cmd run desktop:start
npm.cmd run desktop:pack:win
npm.cmd run web:start
npm.cmd run web:docker:build
npm.cmd run web:docker:run
```

Then open:

```text
http://localhost:8787
```

## Manual Verification Checklist

- [ ] App loads at `http://localhost:8787`.
- [ ] `/health` returns readiness metadata and does not reveal the API key.
- [ ] **Connect** asks for microphone access and reaches observing mode.
- [ ] Melody remains silent before activation.
- [ ] Host can provide agenda content through the document path.
- [ ] Host can provide agenda content verbally.
- [ ] Agenda status updates after document and verbal agenda input.
- [ ] Melody uses supplied agenda context in an activated response.
- [ ] Melody asks for agenda clarification or stays general when no agenda has been supplied.
- [ ] **Activate Melody** requests one welcome response.
- [ ] Saying the configured trigger name activates Melody from observing mode.
- [ ] **Pause Melody** stops active auto-conversation behavior.
- [ ] Active mode waits about 3 seconds after each participant turn before responding.
- [ ] Follow-up participant speech during the wait window defers the pending response and uses the latest turn.
- [ ] Melody stays on current meeting context and asks a concise clarifying probe when participant meaning is unclear.
- [ ] Melody stays within event context, event title, and current audience topic, and redirects off-topic personal/social asks.
- [ ] Desktop app launches successfully with `npm.cmd run desktop:start`.
- [ ] Windows portable package is generated with `npm.cmd run desktop:pack:win`.
- [ ] Web runtime launches with `npm.cmd run web:start`.
- [ ] Web container build succeeds with `npm.cmd run web:docker:build`.
- [ ] AWS App Runner configuration is present and usable via `aws/apprunner.yaml`.
- [ ] AWS production readiness checklist is completed via `aws/apprunner-production-checklist.md`.
- [ ] Amendment updates are reflected for both desktop and web/AWS targets unless explicitly scoped otherwise.
- [ ] **Stop** releases the microphone and returns to offline/observing state.
- [ ] **New Session** clears the conversation context and agenda.
- [ ] Missing API key or Realtime failure is visible in the activity log.

## Completion Criteria

Implementation is complete when the functional requirements in `spec.md`, the non-functional requirements in `spec.md`, and the tasks in `tasks.md` are verified or explicitly marked for future work.

## Verification Snapshot (2026-06-06)

- `npm.cmd run check` passed.
- `GET /health` returned expected non-secret metadata.
- `POST /session` with whitespace SDP returned `400` and `{"error":"Missing SDP offer."}`.
- Unsupported method (`PUT /health`) returned `405` and `{"error":"Method not allowed"}`.
- `run-app.bat` launch was verified end-to-end on a free `8787` port.
- Manual browser checks passed for baseline non-microphone host controls and agenda interactions.
- Manual Connect attempt logged `Opening microphone.`, then `Permission denied`, then `Session stopped.`, demonstrating expected failure-path handling for blocked microphone permissions.
- Repeated manual Connect attempt produced the same sequence (`Opening microphone.` -> `Permission denied` -> `Session stopped.`), indicating a stable environment-level permission gate rather than an intermittent app error.
- Playwright smoke tests for non-microphone UI regressions passed (`3` tests).
- Remaining manual item: full microphone-permission and live speech-turn workflow. Use `specs/001-melody-cohost/microphone-validation.md`.
