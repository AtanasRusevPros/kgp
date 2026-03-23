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

## Code Conventions

1. Prefer editing existing files over creating new ones.
2. Avoid `any` unless it is necessary and justified.
3. When adding tests, keep them close to the code they verify.
4. Every append to any `.md` file must include a timestamp. This applies to all agents.

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
