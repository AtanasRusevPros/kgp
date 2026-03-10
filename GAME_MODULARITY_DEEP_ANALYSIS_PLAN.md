# Game Modularity Rework Master Plan

## 1) Intent and Target Architecture
This plan defines a full rework to a **closed, allowlisted game ecosystem** with strict frontend/backend decoupling.

Core decisions already locked:
1. Backend independence: backend is a standalone codebase boundary.
2. Closed ecosystem: only backend-allowlisted games are integrated.
3. Dual identity security: privileged game calls require both app identity and delegated user identity.
4. Backend gateway/BFF model: token-only direct privileged access is not trusted.
5. Game-owned backend adapters: each game contains its backend adapter directory, but backend loads only approved adapters.
6. Root structure target:
   - `server/` (all backend logic: API/auth/DB/integrations)
   - `frontend/web/` and `frontend/mobile/` (platform shells)
   - `games/<gameId>/{contracts,web,mobile,backend-adapter}`
   - `packages/` (shared cross-cutting contracts/tooling only)
7. Quality requirement: full sweep of tests and docs (update existing + add new).

What this is **not**:
- Not an open marketplace.
- Not runtime auto-discovery of third-party games.
- Not user-token-only authorization for privileged game actions.

---

## 2) Guiding Principles and Boundaries
1. FE/BE decoupling rule: frontend and backend communicate only through API contracts and predetermined message patterns.
2. Backend authority rule: backend is source of truth for allowlist, identity validation, and policy enforcement.
3. Least privilege rule: all game session tokens are scoped, audience-bound, and short-lived.
4. Deterministic onboarding rule: a game is live only after explicit allowlist + adapter validation at deploy/startup.
5. Migration safety rule: compatibility aliases and flags are allowed temporarily, then removed in final cleanup.

---

## 2.1) Execution Method (How this plan will be delivered)
1. Phase-gated execution only: `P0 -> P10`, no phase skipping.
2. Branching model: one branch per phase (`phase/p0-*`, `phase/p1-*`, etc.) with merge only after phase gate passes.
3. Control documents:
   - This file is the decision-complete architecture source of truth.
   - `GAME_MODULARITY_ITERATION_PLAN_SHORT.md` is the operational runbook for iterative implementation.
   - `PHASE_EXECUTION_TRACKER.md` records live status, commands run, evidence, and blockers.
4. Quality gate policy:
   - Each phase must deliver code artifacts, test updates/new tests, and doc updates for any changed behavior.
   - No “temporary skip” of affected tests/docs is accepted for phase completion.
5. Risk control policy:
   - Compatibility shims are permitted only until `P10`.
   - Flashcards parity is validated continuously from migration start.
   - Security hardening (`P4`) is completed before broad dynamic launch exposure.
6. Delivery waves:
   - Wave A: `P0-P2` (guard rails + structure + contracts)
   - Wave B: `P3-P5` (allowlist runtime + dual identity + web routing)
   - Wave C: `P6-P7` (mobile readiness + flashcards full migration)
   - Wave D: `P8-P10` (full test/docs sweep + cleanup)

---

## 3) Phase Plan (with artifacts, acceptance criteria, and testable results)

## Phase P0 — Baseline and Guard Rails
Goal: establish safety rails before structural changes.

Planned artifacts:
1. Architecture boundary policy doc (imports and layering rules).
2. CI checks for no forbidden cross-layer imports.
3. Baseline regression checklist for current flashcards/auth/progress flows.

Acceptance criteria:
1. Forbidden import rule exists and runs in CI.
2. Current baseline test suite passes before rework starts.
3. Baseline behavior reference for flashcards/auth is documented.

Testable results:
1. Run: `pnpm typecheck && pnpm lint && pnpm test:unit`
2. Run: `pnpm test:integration && pnpm test:web`
3. Expected: all pass; no boundary-rule violations.

---

## Phase P1 — Repository Topology Migration
Goal: create final target structure and ownership boundaries.

Planned artifacts:
1. New root directories: `server/`, `frontend/web`, `frontend/mobile`, `games/`.
2. Backend code moved from current API location into `server/`.
3. Platform web shell moved into `frontend/web`.
4. Mobile shell scaffold in `frontend/mobile`.
5. Flashcards module created under `games/flashcards/*`.
6. Temporary compatibility aliases for old paths/entry points.

Acceptance criteria:
1. New directory structure exists and is canonical.
2. Build and existing tests still run under compatibility mode.
3. No production behavior regression introduced by move-only changes.

Testable results:
1. Run: `pnpm build`
2. Run: `pnpm test:unit && pnpm test:integration && pnpm test:web`
3. Expected: pass with compatibility shims enabled.

---

## Phase P2 — Contracts and Metadata Expansion
Goal: make game discovery/routing/policy contract-driven.

Planned artifacts:
1. Extended shared game metadata types/schemas (route base, capabilities, client targets, auth policy, api version).
2. Backend metadata storage model for approved games/manifests.
3. `/games` response extended to drive shell routing and policy awareness.
4. Validation logic for invalid/incompatible metadata.

Acceptance criteria:
1. `/games` has complete routing+policy metadata needed by shells.
2. Invalid metadata fails fast with deterministic startup error.
3. Contract versioning strategy is explicit.

Testable results:
1. New unit tests for schema parsing and version compatibility.
2. Integration tests for `/games` payload shape and validation failures.
3. Run: `pnpm test:unit && pnpm test:integration`

---

## Phase P3 — Backend Allowlist Registry and Adapter Loader
Goal: enforce closed ecosystem in backend runtime.

Planned artifacts:
1. `server` game registry module (deploy-time allowlist source of truth).
2. Adapter loader for `games/*/backend-adapter` with strict validation.
3. Registry diagnostics endpoint (health/status of allowed games/adapters).
4. Hard rejection paths for unknown/unapproved game IDs.

Acceptance criteria:
1. Only allowlisted games are loaded and runnable.
2. Unknown game IDs are rejected before session creation.
3. Invalid adapter cannot silently load.
4. Registry health reports adapter status deterministically.

Testable results:
1. Integration tests: allowlisted success, unallowlisted rejection.
2. Unit tests: adapter contract validation and failure modes.
3. Run: `pnpm test:unit && pnpm test:integration`

---

## Phase P4 — Identity and Authorization Hardening (Dual Identity + BFF)
Goal: eliminate token-only trust for privileged game APIs.

Planned artifacts:
1. App identity verification flow in backend gateway/BFF.
2. Delegated short-lived game session token issuance.
3. Extended claims model (`aud`, `scope`, `gameId`, `clientId`, `typ`, `exp`).
4. Scope/audience middleware for privileged endpoints.
5. Deny-by-default policy for privileged game operations.

Acceptance criteria:
1. User token alone cannot access privileged game endpoints.
2. App identity alone cannot perform user-context actions.
3. Scope and audience mismatches are rejected.
4. Token TTL and revocation behavior are defined and enforced.

Testable results:
1. Integration tests for each auth failure/success matrix path.
2. Security regression tests for replay/mismatch scenarios.
3. Run: `pnpm test:integration`

---

## Phase P5 — Web Shell Dynamic Routing and Game Host
Goal: remove hardcoded game routing from core shell.

Planned artifacts:
1. Registry-driven route generation in `frontend/web`.
2. Game host orchestration layer for approved games.
3. Menu navigation based on metadata route mapping (not hardcoded flashcards paths).
4. Error boundaries for game load/runtime failures.
5. Temporary legacy aliases for old flashcards URLs.

Acceptance criteria:
1. Core shell has no hardcoded game route table.
2. Approved games launch through registry metadata.
3. Unsupported/disabled games are not launchable.

Testable results:
1. Web tests for dynamic route generation and menu navigation.
2. E2E tests for approved launch and blocked launch paths.
3. Run: `pnpm test:web && pnpm test:e2e`

---

## Phase P6 — Mobile Shell and Mobile-Ready Game Contract
Goal: ensure mobile-ready structure and integration contract.

Planned artifacts:
1. `frontend/mobile` shell skeleton wired to same game metadata model.
2. `games/<id>/mobile` module contract and conformance checks.
3. Flashcards mobile scaffold module under `games/flashcards/mobile`.

Acceptance criteria:
1. Every integrated game has a mobile directory and contract conformance tests.
2. Mobile shell can resolve approved game metadata.
3. Missing mobile contract implementation fails CI conformance checks.

Testable results:
1. Contract/conformance unit tests for mobile module registration.
2. Mobile-shell smoke tests (headless if full UI tooling deferred).
3. Run: `pnpm test:unit` (plus mobile test command when added).

---

## Phase P7 — Flashcards Full Migration (Reference Game)
Goal: prove end-to-end viability with current production game.

Planned artifacts:
1. Flashcards fully migrated to:
   - `games/flashcards/contracts`
   - `games/flashcards/web`
   - `games/flashcards/mobile`
   - `games/flashcards/backend-adapter`
2. Backend integration uses flashcards adapter only via allowlist registry.
3. Legacy codepaths retained only as temporary compatibility wrappers.

Acceptance criteria:
1. Flashcards behavior parity maintained (auth, decks, progress, offline queue, points behavior as currently intended).
2. No direct flashcards coupling left in core backend/web shells.

Testable results:
1. Existing flashcards tests updated and passing.
2. New parity test suite passes against migrated flow.
3. Run: `pnpm test:full`

---

## Phase P8 — Full Test Sweep and CI Gate Hardening
Goal: complete all required test updates and additions.

Planned artifacts:
1. Updated existing test suites across API/web/shared/sdk.
2. New test suites:
   - allowlist enforcement
   - adapter conformance
   - dual identity auth matrix
   - scope/audience/game/client mismatch handling
   - metadata-driven route behavior
3. CI gate updates to include new architecture and security test groups.

Acceptance criteria:
1. All old impacted tests are updated (none skipped due to refactor).
2. All new required tests exist and pass.
3. CI blocks merge on any modularity/security regression.

Testable results:
1. Run: `pnpm test:full`
2. Run: `pnpm test:e2e:stack` (when stack is up)
3. Expected: green pipeline with no flaky critical path tests.

---

## Phase P9 — Full Documentation Sweep and Architecture Rewrite
Goal: align all docs with final architecture and operations.

Planned artifacts:
1. Updated existing docs:
   - `ARCHITECTURE.md`
   - `IMPLEMENTATION_STATUS.md`
   - `README.md`
   - `USAGE.md`
   - `WORKLOG.md`
2. New docs:
   - `docs/game-module-spec.md`
   - `docs/backend-allowlist-security.md`
   - `docs/migration-guide.md`
   - `docs/add-game-checklist.md`
3. Updated diagrams and sequence flows (allowlist boot, dual identity, BFF token exchange, game host launch).

Acceptance criteria:
1. No stale references to deprecated structure/paths.
2. Architecture docs match implemented behavior and test gates.
3. Onboarding steps for adding approved games are deterministic.

Testable results:
1. Manual doc consistency review checklist complete.
2. Link/path validation over docs (no broken internal references).
3. Optional doc lint pass if enabled.

---

## Phase P10 — Cleanup and Compatibility Decommission
Goal: remove temporary migration scaffolding.

Planned artifacts:
1. Remove temporary compatibility aliases and migration flags.
2. Remove deprecated bootstrap/route wiring.
3. Finalize canonical startup paths and scripts.

Acceptance criteria:
1. Single-path architecture only (no dual old/new runtime codepaths).
2. Full suite passes without compatibility mode.
3. Docs updated to final-only model.

Testable results:
1. Run: `pnpm build && pnpm test:full`
2. Run: `pnpm test:e2e:stack`
3. Expected: all green in final architecture mode.

---

## 4) Required Test Inventory (Existing Updates + New Additions)

Update existing tests:
1. API unit/integration tests for moved paths and refactored bootstrapping.
2. Web tests for routing and menu behavior.
3. Flashcards tests for migrated module locations.
4. Shared/sdk tests for expanded contracts.

Add new tests:
1. Allowlist enforcement and rejection paths.
2. Adapter contract conformance and invalid adapter startup failure.
3. Dual identity auth matrix and claims enforcement.
4. BFF token exchange and delegated token lifetime/scoping.
5. Metadata-driven launch for web and mobile shells.
6. End-to-end approved vs blocked game launch scenarios.

Minimum release gate:
1. `pnpm test:full`
2. `pnpm test:e2e:stack` (for deployment-path verification)
3. CI architecture boundary checks

---

## 5) Documentation Deliverables and Updates
Updated docs must explain:
1. Why this is a closed curated ecosystem.
2. How allowlist and adapter loading works at startup.
3. Why dual identity is required and token-only is insufficient.
4. How web/mobile shells discover and launch approved games.
5. How to add a new approved game (contracts, adapter, tests, allowlist entry, docs).

---

## 6) Definition of Done (Program-Level)
This rework is complete only when all are true:
1. Backend is independent and only integrates allowlisted games.
2. FE/BE are decoupled strictly via contracts/APIs.
3. Privileged game APIs require dual identity and scoped delegated tokens.
4. Core shells do not hardcode per-game routes.
5. Flashcards is migrated as reference game under new structure.
6. All impacted existing tests updated; required new tests added and passing.
7. All major docs updated; no stale architecture or path references remain.

---

## 7) Notes on Sequencing Rationale
The order above is intentional:
1. Guard rails first (P0) to prevent unsafe drift.
2. Structure before behavior (P1) to avoid repeated path churn.
3. Contracts before runtime loaders (P2 before P3/P5).
4. Security hardening before broad dynamic routing exposure (P4 before full rollout).
5. Reference migration (P7) before system-wide cleanup (P10).

This sequence minimizes rework and keeps each phase independently verifiable.
