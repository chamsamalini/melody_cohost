# Melody Co-Host Project Instructions

This project uses GitHub Spec Kit for spec-driven development. Treat `.specify/memory/constitution.md` as the governing project rules for future feature work.

<!-- SPEC-KIT:START -->
## Spec Kit Workflow

Use the local Spec Kit artifacts in this order:

1. `$speckit-constitution` updates `.specify/memory/constitution.md`.
2. `$speckit-specify` creates or updates `specs/<feature>/spec.md`.
3. `$speckit-plan` creates `specs/<feature>/plan.md` plus design artifacts.
4. `$speckit-tasks` creates `specs/<feature>/tasks.md`.
5. `$speckit-analyze` reviews `spec.md`, `plan.md`, and `tasks.md` before implementation.
6. `$speckit-implement` executes tasks according to the plan.

Core command markdown lives in `.specify/templates/commands/`.
Document templates live in `.specify/templates/`.
PowerShell support scripts live in `.specify/scripts/powershell/`.
Project-specific context augmentation lives in `.specify/context-augmentation.md`.

When a command references a script path such as `scripts/powershell/setup-plan.ps1`, resolve it as `.specify/scripts/powershell/setup-plan.ps1` from the repository root.

## Current Feature Context

Active baseline feature: `specs/001-melody-cohost`.

Use:

- `specs/001-melody-cohost/spec.md` for functional and non-functional requirements.
- `specs/001-melody-cohost/plan.md` for the technical plan.
- `specs/001-melody-cohost/tasks.md` for verification and implementation tasks.
- `specs/001-melody-cohost/analysis.md` for consistency review.
- `specs/001-melody-cohost/implement.md` for execution notes.
<!-- SPEC-KIT:END -->

## Project Notes

- Runtime: Node.js 20 or later.
- Server entrypoint: `server.mjs`.
- App UI: `public/index.html`, `public/app.js`, and `public/styles.css`.
- Validation command: `npm.cmd run check`.
- Local run command: `npm.cmd start` or `run-app.bat`.
- Secrets: keep `.env` local and never commit `OPENAI_API_KEY`.
