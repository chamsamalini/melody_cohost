# Microphone Validation Runbook

Use this runbook on a machine/browser profile where microphone permission can be granted.

## Preconditions

- App is running at `http://localhost:8787`.
- Browser can prompt for microphone access.
- A local microphone device is available and enabled.

## Steps

1. Open `http://localhost:8787`.
2. Click **Connect**.
3. When prompted, choose **Allow** microphone access.
4. Confirm status changes to **Connected** and mode remains **Observing**.
5. Confirm activity includes session/data-channel events and does not show permission errors.
6. Click **Capture Verbal Agenda** and speak one short agenda line.
7. Stop capture and verify agenda status changes from missing to verbal/updated.
8. Click **Activate Juno** and confirm one short welcome response is generated.
9. Say the trigger name once in observing mode and confirm voice-trigger activation.
10. Click **Stop** and verify status returns to **Offline** and mode to **Observing**.

## Expected Pass Signals

- Connect succeeds without `Permission denied`.
- Activity log shows normal realtime/session lifecycle events.
- Transcript includes guest and Juno turns after activation.
- Agenda status updates after verbal capture.
- Stop returns app to offline state and disables active controls.

## If It Fails

- `Permission denied`: check browser site permissions and OS-level microphone privacy settings.
- Stuck on `Connecting`: verify network access and `/health` endpoint.
- No Juno audio after activation: verify output device and browser autoplay/audio permissions.
- No transcript updates: verify mic input device selection and input volume.
