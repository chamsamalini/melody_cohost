# Implementation Plan: Melody Online Meeting Co-Host Voice Agent

**Feature Directory**: `specs/001-melody-cohost`
**Date**: 2026-06-06
**Spec**: `specs/001-melody-cohost/spec.md`
**Status**: Updated plan for online-meeting scope and agenda intake

## Summary

Build and maintain a local browser console for Melody, an AI online-meeting co-host. The system uses a minimal Node.js server to serve static assets and create OpenAI Realtime WebRTC sessions. The browser controls microphone capture, data-channel events, transcript display, activation rules, host controls, and meeting agenda context supplied by document or verbal briefing.

## Technical Context

- **Language/Version**: JavaScript with Node.js 20 or later; browser JavaScript modules.
- **Primary Dependencies**: Node.js built-ins; browser WebRTC APIs; OpenAI Realtime API.
- **Storage**: No persistence; `.env` for local runtime configuration; agenda context is session-local.
- **Testing**: `npm.cmd run check`; manual browser validation at `http://localhost:8787`.
- **Target Platform**: Local Windows-friendly development environment and modern browser.
- **Project Type**: Local web app with server-side session endpoint.
- **Performance Goals**: Immediate UI state changes under normal local conditions; Realtime latency depends on network/model service.
- **Constraints**: API key remains server-side; app must not auto-speak without host/app response request; Melody is scoped to online meetings only.
- **Scale/Scope**: Single local host console for one online meeting at a time.

## Constitution Check

- **Spec-first**: This plan is derived from `spec.md`.
- **Host control and trust**: Activation behavior, response suppression, and agenda truthfulness are core requirements.
- **Minimal architecture**: Keep current Node plus vanilla browser files.
- **Privacy and secrets**: `.env` and `OPENAI_API_KEY` stay local and server-side; agenda and transcript content remain session-local.
- **Validation**: Use `npm.cmd run check` and manual browser checks.

No constitution violations are required for the baseline.

## Project Structure

### Documentation

```text
specs/001-melody-cohost/
+-- spec.md
+-- plan.md
+-- analysis.md
+-- tasks.md
+-- implement.md
```

### Source Code

```text
server.mjs
public/
+-- index.html
+-- app.js
+-- styles.css
run-app.bat
```

## Implementation Strategy

1. Preserve `server.mjs` as the only backend entrypoint.
2. Keep Realtime session creation behind `/session`.
3. Keep browser logic in `public/app.js`.
4. Keep host controls and semantic UI in `public/index.html`.
5. Keep visual polish and responsive layout in `public/styles.css`.
6. Keep local startup simple through `npm.cmd start` and `run-app.bat`.
7. Add agenda context state in the browser so document and verbal agenda inputs can feed Melody response instructions.
8. Keep agenda processing lightweight in the baseline: structure provided content into topics, objectives, order, decisions, and expected outcomes without adding persistence.

## Requirement Mapping

- **Server and configuration**: FR-001 through FR-007, FR-029, FR-030.
- **Connection and audio flow**: FR-008 through FR-011, FR-016, FR-027.
- **Host control and activation**: FR-012 through FR-024.
- **Transcript and logs**: FR-025 and FR-026.
- **Prompt safety**: FR-028, NFR-004.
- **Online meeting and agenda context**: FR-031 through FR-040, NFR-013 through NFR-017.
- **Security and privacy**: NFR-001, NFR-002, NFR-011.
- **Validation and maintainability**: NFR-008, NFR-009, NFR-012.

## Validation Plan

- Run `npm.cmd run check`.
- Run `npm.cmd start` or `run-app.bat`.
- Open `http://localhost:8787`.
- Verify `/health` returns non-secret readiness metadata.
- Connect with a browser microphone and confirm observing mode.
- Confirm Melody does not speak until activated.
- Provide agenda content through the document path and confirm agenda status updates.
- Provide agenda content verbally and confirm agenda status updates.
- Confirm Melody uses supplied agenda context when activated.
- Confirm Melody asks for agenda clarification or stays general when no agenda exists.
- Confirm **Activate Melody**, trigger-name activation, **Pause Melody**, **Stop**, **New Session**, and **Clear** behavior.
- Confirm missing `OPENAI_API_KEY` yields a readable error.

## Risks and Mitigations

- **Browser microphone permission failure**: Surface error in activity log.
- **Realtime service or credential failure**: Keep `/session` errors client-readable without exposing secrets.
- **Unwanted speech**: Preserve disabled automatic Realtime responses and app-controlled `response.create`.
- **Agenda hallucination**: Include agenda context explicitly in response instructions and require clarification when agenda details are missing.
- **Document parsing ambiguity**: Start with readable document text content; defer richer file parsing until a future spec if needed.
- **Prompt drift**: Keep Melody behavior requirements in constitution, spec, and server instructions.
- **Over-complexity**: Avoid adding dependencies for baseline requirements.
