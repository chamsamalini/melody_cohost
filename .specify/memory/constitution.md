# Melody Co-Host Constitution

## Core Principles

### I. Spec-First Changes

Every meaningful feature or behavior change must start with a clear specification before implementation begins. Specifications must describe user value, online-meeting behavior, agenda context, activation boundaries, success criteria, and expected failure behavior without jumping directly to code structure.

### II. Online Meeting Scope, Host Control, and Participant Trust

Melody is only for online meetings. Melody must only speak when the host activates her or when the application explicitly decides a response is appropriate. Features must protect meeting trust by avoiding surprise speech, hidden recording behavior, misleading identity claims, fake accents, stereotypes, or responses that dominate the human host.

### III. Agenda Grounding

Meeting agenda context must come from the host through document content or a verbal briefing. Melody must use supplied agenda details to support the meeting flow and must ask for clarification instead of inventing agenda items, decisions, owners, or outcomes.

### IV. Minimal, Inspectable Architecture

Prefer the current small Node.js and vanilla browser structure unless a spec justifies additional dependencies. Keep `server.mjs`, `public/app.js`, `public/index.html`, and `public/styles.css` understandable to a maintainer reading them directly.

### V. Privacy and Secret Hygiene

OpenAI credentials and runtime secrets must remain in `.env` or environment variables and must not be committed. Specs and plans must call out microphone, transcript, agenda, audio, and session-data handling when a feature touches those surfaces.

### VI. Validation Before Delivery

At minimum, run `npm.cmd run check` before considering server changes complete. Browser-facing changes require a local run at `http://localhost:8787` and a manual interaction check for the affected host-console workflow.

### VII. Amendment Traceability

When a user provides an amendment to active feature scope, requirements, behavior, or validation, the amendment must be logged and reflected in Spec Kit artifacts in the same working cycle. The canonical amendment log is `specs/<feature>/amendments.md`.

### VIII. Dual-Target Parity

When a feature supports both desktop and web/AWS runtime targets, amendments must be evaluated and reflected for both targets unless the user explicitly scopes the amendment to one target.

## Technical Constraints

- The app targets a modern browser with microphone access.
- The server must continue serving static assets and the `/session` endpoint from the local Node process.
- The default local port is `8787` unless a plan explicitly documents another choice.
- Runtime logs and `.env` remain local-only artifacts.
- Changes to Realtime session configuration must document model, voice, VAD, transcription, and response-trigger implications.
- Agenda content must remain session-local unless a future spec explicitly adds persistence.

## Development Workflow

- Use Spec Kit artifacts under `specs/<feature>/` for new feature work.
- Keep feature artifacts reviewable: `spec.md` for what and why, `plan.md` for how, `tasks.md` for executable work.
- Prefer small, independently verifiable tasks that name exact files.
- Do not add dependencies, build tools, or deployment machinery unless the active spec and plan justify them.
- Preserve the current local run path: `npm.cmd start` and `run-app.bat`.
- For amendment requests, update `specs/<feature>/amendments.md` and synchronize all impacted artifacts before closing the request.
- For dual-target requests, keep desktop runtime artifacts and web/AWS deployment artifacts in parity for applicable behavior and configuration.

## Governance

This constitution supersedes conflicting implementation preferences in specs, plans, tasks, or ad-hoc prompts. Governance amendments require updating this file, checking related templates for consistency, and documenting why the governance change is needed. Feature amendments require updating the feature amendment log and synchronized artifacts.

**Version**: 1.3.0 | **Ratified**: 2026-06-06 | **Last Amended**: 2026-06-07
