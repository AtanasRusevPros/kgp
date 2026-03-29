# AGENTS.md

Guidance for agents working in this repository.

## Goal

Make safe, minimal, well-verified changes with as little context as necessary.

## Repo Shape

- Package manager: `pnpm`
- Workspaces: `apps/*`, `packages/*`, `games/*/backend-adapter`
- Main apps:
  - `apps/api`: Fastify API, migrations, seed scripts, API tests
  - `apps/web`: Vite/React web app, Vitest component tests, Playwright e2e
- Shared packages:
  - `packages/shared`: shared contracts/types, built to `dist/`
  - `packages/game-sdk`: reusable game SDK
- Current game module: `games/flashcards`
- Main task runner: `./dev.sh`

## Working Rules

1. Read only the files needed for the task. Do not scan the whole repo unless the task requires it.
2. Find the ownership path first: the feature file, its nearest test, and the immediate caller/config.
3. Prefer small, surgical edits over broad refactors.
4. Match existing patterns and style in the files you touch.
5. Do not silently fix unrelated issues while editing. Mention them separately if they matter.
6. Avoid new dependencies, renames, and large rewrites unless they are necessary.
7. If you touch shared contracts, SDK behavior, exports, or build/config plumbing, assume the blast radius is broader.
8. Work only inside this repository root. Do not modify files outside it.
9. Act autonomously for normal install, build, lint, typecheck, test, and local DB commands.
10. Pause only for architectural decisions, explicit user choices, or destructive actions.
11. Do not push to remotes, run `git reset --hard`, or perform destructive DB actions outside local dev/test without confirmation.
12. If a command or test cannot be run, say so clearly and explain why.
13. In the main Codex-user thread, do not stage files until the user explicitly asks. Ignore this rule for agents explicitly tasked to prepare a commit.
14. When the user explicitly asks for a plan-first workflow, stop after planning, list open questions, and do not execute until those questions are resolved.
15. Prefer renames over delete-and-recreate when moving or retitling files so history stays readable.
16. Main thread ambiguity handling: when an ambiguity can materially change scope, architecture, test plan, risk, or rollout, ask the user for clarification before proceeding, especially during planning.
17. Delegated/sub-agent ambiguity handling: do not require explicit user clarification by default; proceed autonomously with reasonable assumptions and report those assumptions clearly in handoff.
18. For low-impact ambiguity, prefer reasonable assumptions and continue execution.

### Collaboration Preference (timestamped)

Added: 2026-03-29 23:00 EET

## Code Conventions

1. Prefer editing existing files over creating new ones.
2. Avoid `any` unless it is necessary and justified.
3. When adding tests, keep them close to the code they verify.
4. Every append to any `.md` file must include a timestamp. This applies to all agents.
5. When a task changes user-facing behavior, workflows, status tracking, or verification expectations, update the relevant `.md` documents in the same task.
6. When promoting a tracker from `PENDING` to `IN_PROGRESS` or similar, update both the title/state and the remaining-work summary so the file reflects the new reality.

## Verification Rules

Always verify before and after making a change.

### Before changing code

Run the narrowest meaningful baseline for the affected area so you know whether it was already broken.

Examples:

- shared/package logic: `pnpm test:unit`
- API behavior with DB impact: `./dev.sh test:int`
- API behavior without DB impact: `pnpm test:unit`
- web UI/component behavior: `pnpm test:web`
- cross-package type or import changes: `pnpm typecheck`
- CI/config/script changes: run the closest relevant validation commands directly

If the baseline already fails, note that before editing and do not imply your change caused it.

### After changing code

1. Rerun the same baseline command or scenario.
2. Run any additional checks implied by the blast radius.

Common checks:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `./dev.sh test:int`
- `pnpm test:web`
- `./dev.sh test:e2e`

Blast-radius guide:

- `apps/api/src/db`, auth, request/response contracts, shared schemas: `pnpm typecheck`, `pnpm test:unit`, `./dev.sh test:int`
- `apps/web` routing, data loading, shared UI: `pnpm typecheck`, `pnpm test:web`
- `packages/shared`, `packages/game-sdk`, exports, build/config plumbing: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`
- e2e paths, startup flows, stack/container behavior: relevant e2e or stack verification

If full verification is not possible, run the best narrower checks available and state exactly what remains unverified.

### Review after autonomous work

After each autonomous implementation task:

1. Review the blast radius for stale docs, scripts, test setup, and runtime entrypoints affected by the change.
2. Confirm whether any additional verification is needed beyond the original narrow checks.
3. Report findings before treating the task as complete.

## Preferred Commands

Use `./dev.sh` when it provides the safer repo-standard workflow.

- setup: `./dev.sh init`
- lint + typecheck: `./dev.sh check`
- unit tests: `./dev.sh test:unit`
- integration tests: `./dev.sh test:int`
- web tests: `./dev.sh test:web`
- e2e tests: `./dev.sh test:e2e`
- full suite: `./dev.sh test:full`
- build: `./dev.sh build`

Direct `pnpm` commands are fine for intentionally narrow checks.

## Security

1. Never commit `.env` files; use `.env.example` for placeholders.
2. Never log or paste secrets, tokens, or password hashes.

## Context Reduction

When the task is narrow or context is tight:

1. Start with `package.json`, `./dev.sh`, and only the files directly related to the request.
2. Use `rg` to find the exact feature, route, component, script, or symbol instead of browsing broadly.
3. Prefer targeted reads: one file, one nearby test, one config, one caller.
4. Stop exploring once the ownership path is clear.
5. Widen only when the behavior crosses packages, shared types are involved, or infra/build/test config is part of the issue.

Good minimal context sets:

- UI bug: component, its test, parent, relevant API client
- API bug: route/controller, service, schema, nearest test
- CI issue: workflow file, invoked script, root `package.json`, failing package config
- build/import issue: importing file, exported file, package manifest, tsconfig/build config

## Check Early

- `package.json`
- `pnpm-workspace.yaml`
- `./dev.sh`
- `.github/workflows/ci.yml`
- `README.md`

For package-specific work, also check that package's `package.json` and closest tests first.

## Handoff

Keep the final handoff compact:

- what changed
- what ran before the change
- what ran after the change
- any pre-existing failures or remaining risks

A task is not complete until the relevant local checks pass and no previously working behavior has been knowingly broken.

Do not paste long logs unless they are necessary to explain a blocker.

## Commit and Cleanup

1. When the user asks to prepare a commit, first mark the task status in the relevant tracker/worklog/docs, then stage the intended files, then propose or use a commit message that matches the actual change scope.
2. After each commit, perform a short cleanup pass: confirm the worktree is clean, note any intentional follow-up left out of the commit, and mention any temporary resources or verification gaps that still need attention.
