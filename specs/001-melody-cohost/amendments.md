# Amendment Log: 001-melody-cohost

Use this file to capture user-requested amendments and track where they were applied.

## Entry Format

- Date: YYYY-MM-DD
- Request: Short summary of the user amendment
- Impacted Artifacts: List of updated files
- Notes: Optional implementation details or follow-up

## Amendments

- Date: 2026-06-07
- Request: Ensure any amendment request is automatically included in Spec Kit artifacts.
- Impacted Artifacts: AGENTS.md, .specify/context-augmentation.md, .specify/memory/constitution.md, specs/001-melody-cohost/amendments.md
- Notes: Added governance and workflow rules to require immediate amendment logging and synchronized artifact updates.

- Date: 2026-06-07
- Request: Wait 3 seconds after audience turns to allow continuation, digest and continue conversation, stay in context, and probe to clarify unclear audience responses.
- Impacted Artifacts: public/app.js, server.mjs, specs/001-melody-cohost/spec.md, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Added delayed response scheduling with follow-up cancellation and queued turn handling, plus stronger context and probing instructions.

- Date: 2026-06-07
- Request: Always stick to context with scope limited to event, event title, and audience conversation topic.
- Impacted Artifacts: public/app.js, server.mjs, specs/001-melody-cohost/spec.md, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Added explicit scope-boundary instructions and off-topic redirection behavior.

- Date: 2026-06-07
- Request: Package the project as a desktop application.
- Impacted Artifacts: package.json, desktop/main.cjs, README.md, .gitignore, specs/001-melody-cohost/spec.md, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Added Electron runtime and Windows portable packaging flow.

- Date: 2026-06-07
- Request: Implement dual-target setup with both desktop and web via AWS, and ensure amendments reflect in both.
- Impacted Artifacts: Dockerfile, .dockerignore, aws/apprunner.yaml, aws/README.md, package.json, README.md, AGENTS.md, .specify/context-augmentation.md, .specify/memory/constitution.md, specs/001-melody-cohost/spec.md, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Added AWS web deployment assets and dual-target amendment parity requirements across governance and feature artifacts.

- Date: 2026-06-07
- Request: Add a production-ready App Runner deployment checklist with exact settings guidance.
- Impacted Artifacts: aws/apprunner-production-checklist.md, aws/README.md, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Added operational checklist covering service creation, secrets, health checks, scaling, monitoring, and dual-target parity validation.

- Date: 2026-06-07
- Request: Fix desktop startup crash when port `8787` is already in use.
- Impacted Artifacts: desktop/main.cjs, specs/001-melody-cohost/implement.md, specs/001-melody-cohost/amendments.md
- Notes: Desktop runtime now reuses an already-running local Juno server on the same port instead of throwing EADDRINUSE.

- Date: 2026-06-07
- Request: Rename app branding from Melody to Juno and use provided Juno logo.
- Impacted Artifacts: public/assets/juno-logo-wordmark.svg, public/index.html, public/styles.css, public/app.js, server.mjs, desktop/main.cjs, package.json, package-lock.json, README.md, run-app.bat, tests/ui/host-console.spec.js, specs/001-melody-cohost/*.md
- Notes: Updated runtime/UI branding, default trigger name, desktop/app package names, and documentation references to Juno.

- Date: 2026-06-07
- Request: Update the application background to suit the Juno logo branding.
- Impacted Artifacts: public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Shifted background palette and radial gradient layers toward a deeper purple identity aligned with the Juno mark.

- Date: 2026-06-07
- Request: Make the logo portion match the provided card-style reference and use the provided purple gradient direction for the background.
- Impacted Artifacts: public/index.html, public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Replaced plain logo block with framed logo card and adjusted page background to a cleaner deep-violet gradient with top accent strip.

- Date: 2026-06-07
- Request: Add tagline text under the Juno logo: "your meeting cohost".
- Impacted Artifacts: public/index.html, specs/001-melody-cohost/amendments.md
- Notes: Added tagline under the logo card while preserving the current layout style.

- Date: 2026-06-07
- Request: Center the tagline and use a more suitable font style.
- Impacted Artifacts: public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Centered the tagline block and switched tagline styling to a Sora-based uppercase treatment for better brand fit.

- Date: 2026-06-07
- Request: Replace existing wireframe with a cleaner reference-aligned layout and visual style.
- Impacted Artifacts: public/index.html, public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Reworked page structure into a 4-panel dashboard layout and updated styling to a bold futuristic purple UI language while preserving existing control IDs and behaviors.

- Date: 2026-06-07
- Request: Do not let Juno stop speaking on incidental speech; only treat direct name-calls as interruptions.
- Impacted Artifacts: public/app.js, specs/001-melody-cohost/amendments.md
- Notes: Removed speech-start auto-interrupt behavior and now interrupt ElevenLabs playback only after completed transcription explicitly calls Juno.

- Date: 2026-06-07
- Request: Provide selectable app color themes.
- Impacted Artifacts: public/index.html, public/app.js, public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Added theme selector, multiple palette variants, and localStorage persistence for selected theme.

- Date: 2026-06-07
- Request: Add one theme inspired by the FDM Group website style.
- Impacted Artifacts: public/index.html, public/app.js, public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Added an FDM Corporate theme option using a deep navy and cyan-accent palette aligned to the target website's corporate visual direction.

- Date: 2026-06-07
- Request: Adjust the FDM theme to use black and fluorescent green.
- Impacted Artifacts: public/index.html, public/styles.css, specs/001-melody-cohost/amendments.md
- Notes: Replaced FDM palette with a black/neon-green visual system and updated the selector label to FDM Black Neon.
