# Feature Specification: Melody Online Meeting Co-Host Voice Agent

**Feature Directory**: `specs/001-melody-cohost`
**Created**: 2026-06-06
**Status**: Updated specification for online-meeting scope and agenda intake
**Problem Statement Source**: `README.md` and user clarification on 2026-06-06

## Problem Statement

Online meeting hosts need a lightweight AI co-host that can listen to the meeting, maintain awareness of the conversation, understand the meeting agenda, and speak only when invited. Melody must support the host without taking over the meeting, respect participant trust, and avoid culturally insensitive behavior such as fake accents, stereotypes, or unsupported identity claims.

The meeting agenda must be conveyed to Melody either through a document provided by the host or verbally during the meeting. Melody must process that agenda as meeting context and use it to keep contributions relevant, track meeting flow, and help the host move through planned topics.

The application must run locally in a browser, use microphone input through a Realtime WebRTC session, provide a visible online-meeting host console, and allow the host to activate, pause, reset, and observe Melody's behavior.

## Users and Stakeholders

- **Meeting Host**: Operates the console, provides the agenda, and decides when Melody may speak.
- **Meeting Participants**: Join the online meeting, speak naturally while Melody observes, and may address Melody by name.
- **Local Operator**: Configures `.env`, starts the app, and verifies microphone/session readiness.

## Goals

- Provide a simple local host console for connecting an online meeting microphone to Melody.
- Let the host provide the meeting agenda through a document or verbal briefing.
- Process the agenda into usable meeting context for Melody.
- Keep Melody silent while observing unless activated by host control or trigger-name detection.
- Show transcript, activity, and agenda-status feedback so the host can understand current state.
- Keep setup approachable for a local operator using Node.js and an OpenAI API key.

## Non-Goals

- No cloud deployment workflow is required for the baseline.
- No persistent transcript or agenda storage is required.
- No multi-user authentication is required.
- No custom meeting-platform integration is required.
- No support for in-person, stage, webinar, or general live-event co-hosting is required unless a future spec expands scope.
- No replacement of the current vanilla browser UI with a frontend framework is required.

## User Scenarios

### US1: Host Starts an Online Meeting Session

The host opens the console, clicks **Connect**, grants microphone permission, and sees that Melody is connected and observing.

**Acceptance Criteria**

- The console shows an offline state before connection.
- The app requests microphone access only after the host clicks **Connect**.
- After successful connection, the console shows Melody as connected and observing.
- If setup fails, the host sees a clear activity message instead of a silent failure.

### US2: Host Provides Meeting Agenda

Before or during the online meeting, the host provides an agenda either as document content or as a spoken briefing. Melody processes the agenda so future responses can reference objectives, topic order, decisions, and expected outcomes.

**Acceptance Criteria**

- The host can provide agenda content through a document-based path.
- The host can provide agenda content verbally through the meeting microphone.
- The console indicates whether an agenda has been provided and how it was last updated.
- Melody uses the agenda only as meeting context and does not invent agenda items that were not provided.
- The host can replace or update the agenda if the meeting changes.

### US3: Host Activates Melody

The host clicks **Activate Melody** to invite Melody to speak. Melody gives a concise, warm opening and then participates according to the configured behavior and any known agenda context.

**Acceptance Criteria**

- Melody does not speak before activation.
- Activation changes the mode from observing to active.
- Melody's first spoken turn welcomes meeting participants and acknowledges the host briefly.
- If agenda context exists, Melody references it only when useful.
- If agenda context does not exist, Melody asks a concise agenda-clarifying question or offers general meeting support.
- Melody's response remains short and suitable for an online meeting.

### US4: Participant Calls Melody by Name

A participant says the configured trigger name. If Melody is not active, the app activates Melody and requests a response.

**Acceptance Criteria**

- Trigger detection uses the configured trigger name.
- Trigger matching is case-insensitive and respects word boundaries.
- The transcript shows the participant turn that caused activation.
- The event log records the activation source.
- Melody uses agenda context only if it has been provided.

### US5: Host Pauses or Resets the Session

The host can pause Melody, stop the session, clear visible transcript, or start a new session.

**Acceptance Criteria**

- **Pause Melody** returns the mode to paused and disables additional automatic active responses.
- **Stop** closes the data channel, peer connection, microphone tracks, and audio meter.
- **New Session** clears the conversation context and reconnects if the previous session was active.
- **Clear** removes visible transcript entries without requiring a reconnect.

## Functional Requirements

- **FR-001**: The system MUST serve the browser host console at `http://localhost:8787` by default.
- **FR-002**: The system MUST expose a `/health` endpoint that reports readiness metadata without revealing secrets.
- **FR-003**: The system MUST load local environment variables from `.env` when present.
- **FR-004**: The system MUST require `OPENAI_API_KEY` before creating a Realtime session.
- **FR-005**: The system MUST create Realtime sessions through a server-side `/session` endpoint so the browser never receives the API key.
- **FR-006**: The system MUST configure Realtime automatic response creation as disabled so Melody speaks only when the app sends a response request.
- **FR-007**: The system MUST enable input transcription so participant speech can appear in the transcript and be used for trigger detection and verbal agenda intake.
- **FR-008**: The browser MUST request microphone access only after the host starts a connection.
- **FR-009**: The browser MUST stream microphone audio into a WebRTC peer connection.
- **FR-010**: The browser MUST play Melody's returned audio through an audio element.
- **FR-011**: The browser MUST maintain visible connection and mode status indicators.
- **FR-012**: The browser MUST support observing, active, and paused modes.
- **FR-013**: Melody MUST remain silent in observing mode unless the host activates her or a participant says the configured trigger name.
- **FR-014**: The host MUST be able to activate Melody manually.
- **FR-015**: The host MUST be able to pause Melody after activation.
- **FR-016**: The host MUST be able to stop the active session and release microphone resources.
- **FR-017**: The host MUST be able to start a new session that clears current conversation context.
- **FR-018**: The host MUST be able to clear the visible transcript log.
- **FR-019**: The host MUST be able to configure the trigger name from the console.
- **FR-020**: Trigger-name detection MUST be case-insensitive and match whole words.
- **FR-021**: The app MUST request a Melody response when the trigger name is detected outside active mode.
- **FR-022**: When active, the app MUST request Melody responses according to the auto-converse setting.
- **FR-023**: When auto-converse is disabled, Melody MUST respond only to direct address, invitation-like wording, or explicit questions.
- **FR-024**: The app MUST prevent overlapping Melody responses while a prior response is still in progress.
- **FR-025**: The transcript MUST show participant turns and Melody turns.
- **FR-026**: The activity log MUST show session, speech, activation, response, agenda, and error events.
- **FR-027**: The UI MUST show live microphone activity while connected.
- **FR-028**: Melody's instructions MUST require concise, warm, respectful online-meeting co-host behavior and prohibit fake accents, unsupported ethnicity claims, stereotypes, singing, humming, sound effects, and meeting domination.
- **FR-029**: The server MUST reject missing SDP offers with a client-readable error.
- **FR-030**: The server MUST reject unsupported HTTP methods with a client-readable error.
- **FR-031**: The product scope MUST be limited to online meetings and MUST NOT present Melody as a general live-event or in-person co-host.
- **FR-032**: The host MUST be able to provide a meeting agenda through a document-based input path.
- **FR-033**: The host MUST be able to provide or update a meeting agenda verbally through the microphone and transcript flow.
- **FR-034**: The system MUST process agenda input into meeting context containing known topics, order, objectives, decisions to reach, and expected outcomes when those details are provided.
- **FR-035**: The console MUST show whether agenda context is missing, provided from a document, provided verbally, or updated.
- **FR-036**: Melody MUST use the processed agenda to keep activated responses relevant to the current online meeting.
- **FR-037**: Melody MUST NOT invent agenda items, decisions, owners, or outcomes that were not provided by the host or participants.
- **FR-038**: If Melody is activated before any agenda has been provided, Melody MUST ask a concise agenda-clarifying question or give only general meeting support.
- **FR-039**: The host MUST be able to replace the current agenda during the same meeting session.
- **FR-040**: Agenda context MUST be included in Melody response requests when available.

## Non-Functional Requirements

- **NFR-001 Security**: The OpenAI API key MUST remain server-side and must never be exposed to browser JavaScript, logs, transcript text, agenda content, or committed files.
- **NFR-002 Privacy**: Microphone access MUST be explicitly user-initiated and must stop when the host stops or resets the session.
- **NFR-003 Trust**: The app MUST make Melody's current state and agenda status visible to the host at all times.
- **NFR-004 Cultural Safety**: Melody's prompt and response controls MUST avoid stereotypes, fake accent behavior, and unsupported personal identity claims.
- **NFR-005 Reliability**: Connection, session creation, Realtime, agenda, and document-processing errors MUST be surfaced in the activity log.
- **NFR-006 Performance**: Console interactions should update within one second under normal local conditions, excluding network/model latency.
- **NFR-007 Accessibility**: Important connection, mode, transcript, agenda, and activity changes SHOULD be exposed through live regions or semantic page structure.
- **NFR-008 Maintainability**: The project SHOULD preserve the minimal Node.js and vanilla HTML/CSS/JavaScript architecture unless a future spec justifies added dependencies.
- **NFR-009 Portability**: The app SHOULD run on Windows with Node.js 20 or later using `npm.cmd start` or `run-app.bat`.
- **NFR-010 Observability**: Runtime health and user-visible activity logs SHOULD be sufficient to diagnose local setup, agenda, and session failures.
- **NFR-011 Data Retention**: The baseline app SHOULD keep transcript and agenda state in the current browser session only and avoid persistence.
- **NFR-012 Validation**: Server changes MUST pass `npm.cmd run check`; browser-facing changes SHOULD be manually verified at `http://localhost:8787`.
- **NFR-013 Meeting Scope**: User-facing labels, prompts, and documentation SHOULD consistently refer to online meetings rather than live events.
- **NFR-014 Agenda Privacy**: Agenda content SHOULD remain local to the current browser/server session unless a future persistence spec explicitly changes this.
- **NFR-015 Agenda Accuracy**: Melody SHOULD distinguish supplied agenda facts from inferred context and should ask for clarification instead of guessing missing agenda details.
- **NFR-016 Agenda Update Latency**: Agenda status changes SHOULD appear in the host console within one second after the host submits document or verbal agenda content.
- **NFR-017 Document Safety**: Document agenda intake SHOULD reject unsupported or unreadable content with a clear message rather than silently misprocessing it.

## Key Entities

- **Session**: A live WebRTC connection between the browser and Realtime service.
- **Mode**: Melody state: observing, active, or paused.
- **Transcript Turn**: A visible speaker/text entry from a participant or Melody.
- **Activity Event**: A timestamped console event describing connection, speech, agenda, response, or error status.
- **Trigger Name**: Host-configurable word or phrase that can activate Melody.
- **Response Request**: App-sent instruction asking Melody to produce audio.
- **Meeting Agenda**: Host-provided document or verbal briefing that defines topics, order, objectives, decisions, and expected outcomes.
- **Agenda Source**: The method that last supplied agenda context: none, document, verbal, or updated.

## Assumptions

- The local operator has an OpenAI API key with Realtime access.
- The browser supports WebRTC, microphone permissions, and autoplay behavior suitable for returned audio.
- The meeting host accepts ephemeral local transcript and agenda display without persistence.
- The app is intended for a single local host console in the baseline.
- A document agenda can be supplied as readable text content in the baseline unless a future implementation plan adds richer file parsing.

## Success Criteria

- **SC-001**: A host can start the app, connect a microphone, and see connected/observing status in under five minutes after `.env` setup.
- **SC-002**: Melody produces no spoken output before activation in a normal session.
- **SC-003**: Manual activation produces one concise online-meeting welcome response.
- **SC-004**: Saying the configured trigger name activates Melody when she is observing.
- **SC-005**: Stopping the session releases the microphone and returns the console to offline/observing state.
- **SC-006**: Missing API key and session-creation failures produce clear user-visible errors.
- **SC-007**: A host can provide an agenda through document content and see agenda status update before activating Melody.
- **SC-008**: A host can verbally brief Melody on the agenda and see agenda status update after transcription.
- **SC-009**: Melody can answer an agenda-relevant prompt without inventing agenda items that were not provided.
