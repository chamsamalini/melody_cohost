# Tasks: Juno Online Meeting Co-Host Voice Agent

**Feature Directory**: `specs/001-melody-cohost`
**Input**: `spec.md`, `plan.md`, and current project files

## Phase 1: Spec Kit Setup

- [x] T001 Review `.specify/memory/constitution.md` against the Juno online-meeting problem statement.
- [x] T002 Review `.specify/context-augmentation.md` for complete repository grounding.
- [x] T003 Confirm `AGENTS.md` points to the active feature artifacts.

## Phase 2: Functional Requirement Verification and Implementation

- [x] T004 Verify local static serving and `/health` behavior in `server.mjs`.
- [x] T005 Verify `/session` rejects missing SDP and missing `OPENAI_API_KEY` safely in `server.mjs`.
- [x] T006 Verify Realtime session config disables automatic responses in `server.mjs`.
- [x] T007 Verify microphone connection and WebRTC setup in `public/app.js`.
- [x] T008 Verify observing, active, and paused modes in `public/app.js`.
- [x] T009 Verify manual activation, pause, stop, new session, and clear controls in `public/app.js`.
- [x] T010 Verify trigger-name matching is case-insensitive and whole-word based in `public/app.js`.
- [x] T011 Verify transcript and activity log behavior in `public/app.js` and `public/index.html`.
- [x] T012 Verify Juno prompt safety instructions in `server.mjs`.
- [x] T013 Update user-facing copy from live-event framing to online-meeting framing in `README.md`, `server.mjs`, and `public/index.html`.
- [x] T014 Add document-based agenda input controls and agenda status display in `public/index.html`.
- [x] T015 Add agenda state, document agenda processing, agenda replacement, and status updates in `public/app.js`.
- [x] T016 Add verbal agenda capture flow using transcript events in `public/app.js`.
- [x] T017 Include agenda context in Juno response instructions in `public/app.js`.
- [x] T018 Add safeguards so Juno asks for agenda clarification instead of inventing agenda details in `public/app.js` and `server.mjs`.

## Phase 3: Non-Functional Requirement Verification

- [x] T019 Verify `.gitignore` keeps `.env` and logs out of version control.
- [x] T020 Verify stopping the session releases microphone tracks in `public/app.js`.
- [x] T021 Verify status indicators, agenda status, and live regions are present in `public/index.html`.
- [x] T022 Verify agenda content remains session-local and is not written to `.env`, logs, or persistent files.
- [x] T023 Verify the app can be launched with `run-app.bat`.
- [x] T024 Run `npm.cmd run check`.
- [x] T025 Manually validate the host-console workflow at `http://localhost:8787`.

## Phase 4: Documentation Polish

- [x] T026 Update `README.md` with online-meeting-only scope and agenda input instructions.
- [x] T027 Record any unresolved browser/device or agenda-document limitations in `specs/001-melody-cohost/analysis.md`.

## Phase 5: Amendment Alignment (2026-06-08)

- [x] T028 Add host-driven system-audio capture with microphone fallback behavior in `public/app.js`.
- [x] T029 Add agenda upload control plus written context details in `public/index.html` and `public/styles.css`.
- [x] T030 Compose agenda context from uploaded agenda, written notes, and observation-derived context fallback in `public/app.js`.
- [x] T031 Enforce English-first response behavior unless explicit language switch is requested in `public/app.js`.
- [x] T032 Enforce single-line concise Juno output and anti-paraphrase commentary fallback in `public/app.js`.
- [x] T033 Update Spec Kit artifacts for the 2026-06-08 amendments in `specs/001-melody-cohost/*.md`.

## Dependencies

- T001 through T003 should complete before requirement verification.
- T004 through T018 can be reviewed or implemented independently where they touch different files.
- T019 through T025 can run after the functional review.
- T026 and T027 depend on validation findings.
- T028 through T033 depend on completion of baseline host control and agenda flows (T008 through T018).

## MVP Scope

The MVP is satisfied when T004 through T018 and T024 pass.
