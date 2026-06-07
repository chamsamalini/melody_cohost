# AWS Web Deployment

This project can run as a web service on AWS while keeping the same runtime behavior as desktop.

## Option A: AWS App Runner (recommended)

1. Push this repository to GitHub.
2. In AWS App Runner, create a new service from source code repository.
3. Use `aws/apprunner.yaml` as the build and run configuration.
4. Set secrets in App Runner environment variables:
   - `OPENAI_API_KEY` (required)
   - `ELEVENLABS_API_KEY` (optional)
   - `ELEVENLABS_VOICE_ID` (optional)
   - `ELEVENLABS_MODEL_ID` (optional)
5. Deploy and use the generated HTTPS URL.

Production checklist:

- `aws/apprunner-production-checklist.md`

## Option B: Docker image to ECS/Fargate

Build locally:

```powershell
npm.cmd run web:docker:build
```

Run locally:

```powershell
npm.cmd run web:docker:run
```

Then deploy the image to ECR and run it on ECS/Fargate behind an HTTPS load balancer.

## Notes

- WebRTC microphone flow requires HTTPS in production.
- Keep all API keys server-side only.
- Runtime port is provided through `PORT`.
- Use the production checklist before each release cutover.
