# Additional Game Agent Readiness Pending

Updated: 2026-03-25 00:23 EET

## Goal
Add the missing repository guidance so an independent AI agent can integrate any additional game into the platform without architectural guesswork.

## Why this is still pending
The platform runtime is now modular enough to host more games, but the documentation is still too implicit for a low-context independent agent to implement a new game flawlessly.

## What must be added
1. A canonical step-by-step "add a new game" workflow using current roots: `server/`, `frontend/web/`, `games/<id>/`.
2. A strict game module specification:
   - required directories
   - required files
   - required exports
   - naming/ID/route conventions
3. A backend adapter contract guide:
   - when a game needs a backend adapter
   - how adapter loading and allowlisting work
   - failure cases: missing adapter, duplicate adapter, blocked allowlist
4. A web integration contract guide:
   - required manifest/module shape
   - route integration expectations
   - blocked/unsupported behavior
5. A future mobile-readiness guide:
   - what `games/<id>/mobile` should preserve today
   - what is optional now
   - what must remain portable for future mobile support
6. A verification checklist for any new game:
   - required tests
   - required docs updates
   - exact commands to run
7. A decision note for game types:
   - web-only
   - backend-backed
   - privileged/backend-integrated
   - mobile-planned

## Suggested deliverables
1. Expand `docs/add-game-checklist.md`.
2. Expand `docs/game-module-spec.md`.
3. Expand `docs/backend-allowlist-security.md`.
4. Add or expand a web integration contract section in the docs.
5. Add a short mobile-readiness note for future games.
6. Update `README.md`, `project_docs/RnD_docs/USAGE.md`, and `project_docs/RnD_docs/ARCHITECTURE.md` so they point to the canonical add-game guidance.

## Done criteria
1. An independent AI agent can add a new game without asking for interface, adapter, routing, or allowlist clarification.
2. The docs distinguish mandatory requirements from future-facing mobile guidance.
3. The docs reference only canonical runtime roots and current commands.
4. Flashcards remains an example implementation, not an implicit special case template.
