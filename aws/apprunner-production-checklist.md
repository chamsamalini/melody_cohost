# App Runner Production Checklist

Use this checklist when deploying the web target to AWS App Runner.

## 1. Service Creation

- [ ] Region selected for users and compliance needs.
- [ ] Source type set to repository.
- [ ] Branch pinned to release branch.
- [ ] Configuration source set to repository config file.
- [ ] Config file path set to `aws/apprunner.yaml`.

## 2. Build and Runtime

- [ ] Runtime uses Node.js 20.
- [ ] Build command resolves dependencies with production install.
- [ ] Start command is `node server.mjs`.
- [ ] Port is `8080` and mapped to environment variable `PORT`.

## 3. Environment Variables and Secrets

Required:

- [ ] `OPENAI_API_KEY` stored as secret (not plain text).

Recommended runtime values:

- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `OPENAI_REALTIME_MODEL=gpt-realtime`
- [ ] `OPENAI_REALTIME_VOICE=marin`
- [ ] `OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe`

Optional voice settings:

- [ ] `ELEVENLABS_API_KEY` set as secret when ElevenLabs is used.
- [ ] `ELEVENLABS_VOICE_ID` set when ElevenLabs is used.
- [ ] `ELEVENLABS_MODEL_ID` set if non-default model is required.

## 4. Instance and Scaling

- [ ] CPU/Memory size selected for expected realtime and audio load.
- [ ] Minimum instances set to at least 1 for reduced cold starts.
- [ ] Maximum instances set based on cost envelope and expected peaks.
- [ ] Concurrency limits reviewed for low-latency response behavior.

## 5. Health and Availability

- [ ] Health check path set to `/health`.
- [ ] Health check protocol uses HTTP.
- [ ] Health check timeout/interval/threshold values reviewed.
- [ ] Rollback behavior understood before production cutover.

## 6. Networking and Security

- [ ] HTTPS endpoint is active (App Runner managed TLS).
- [ ] Custom domain mapped if required.
- [ ] Access logs and application logs enabled.
- [ ] IAM role least-privilege scope validated.
- [ ] No API keys or secrets committed in repository files.

## 7. Observability and Alarms

- [ ] CloudWatch log group retention set.
- [ ] Alarm for elevated 5xx count.
- [ ] Alarm for high latency.
- [ ] Alarm for unhealthy instance count.
- [ ] Alarm notifications wired to team channel/email.

## 8. Functional Validation (Post-Deploy)

- [ ] `GET /health` returns non-secret readiness metadata.
- [ ] Host console loads over HTTPS.
- [ ] Microphone permission flow works in supported browsers.
- [ ] Realtime session creation works through `/session`.
- [ ] Trigger/activation and response pacing behaviors match spec.
- [ ] Event/title/topic context constraints match desktop behavior.

## 9. Dual-Target Parity Gate

- [ ] Desktop and web targets validated against the same amendment set.
- [ ] Any target-specific differences documented in `specs/001-melody-cohost/implement.md`.
- [ ] Amendment impact for both targets logged in `specs/001-melody-cohost/amendments.md`.

## 10. Release Sign-off

- [ ] Deployment record captured with date, commit, and operator.
- [ ] Rollback approach validated.
- [ ] Stakeholders informed of production endpoint and status.
