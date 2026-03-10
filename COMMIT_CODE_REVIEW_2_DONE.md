# Code Review 2 Done

Completed: 2026-03-11 00:09 EET

Reviewed commit: `cc8a89d4db1b04973a490f5643b0ceba0ceb4609`

## Findings

### 1. High: `/auth/game-session` trusts caller-supplied scopes and can mint permissions the integration client was never granted

Files:
- [apps/api/src/routes/auth.ts](/home/luke/git/kgp1/apps/api/src/routes/auth.ts#L235)
- [apps/api/src/modules/app-client-auth.ts](/home/luke/git/kgp1/apps/api/src/modules/app-client-auth.ts#L21)
- [apps/api/src/tests/auth.integration.test.ts](/home/luke/git/kgp1/apps/api/src/tests/auth.integration.test.ts#L154)
- [apps/api/src/tests/points.integration.test.ts](/home/luke/git/kgp1/apps/api/src/tests/points.integration.test.ts#L18)

What changed:
- `POST /auth/game-session` now accepts `scopes` from the request body and copies them directly into the delegated token.
- The app-client verifier already has a `requiredScope` parameter, but the route never uses it.

Why this is a problem:
- Any authenticated user with any valid app client for that game can request arbitrary scopes.
- The current implementation does not intersect requested scopes with the integration client's stored scopes.
- The route also does not enforce the game's metadata policy (`requiredScopes`, `requiresAppIdentity`, `tokenAudience`) before minting the token.
- That means the new delegated-token layer is only partially enforced: issuance is permissive, while only `POST /points/add` validates one specific scope afterward.

Why the current tests miss it:
- The new tests only cover the happy path and the missing-header case.
- There is no test proving that an unsupported requested scope is rejected.
- There is no test proving that a token cannot be minted with scopes outside the integration client's allowlist.

Suggested follow-up:
- Validate requested scopes against the integration client's scopes before signing.
- Prefer deriving the allowed scopes from game metadata for privileged flows.
- Add negative integration tests for unsupported scopes and for scope escalation attempts.

### 2. Medium: the published game metadata contradicts the enforced security behavior

Files:
- [apps/api/src/db/seed-data/english-deck.json](/home/luke/git/kgp1/apps/api/src/db/seed-data/english-deck.json#L13)
- [apps/api/src/routes/auth.ts](/home/luke/git/kgp1/apps/api/src/routes/auth.ts#L214)
- [apps/api/src/routes/points.ts](/home/luke/git/kgp1/apps/api/src/routes/points.ts#L42)
- [apps/web/src/tests/MenuPage.test.tsx](/home/luke/git/kgp1/apps/web/src/tests/MenuPage.test.tsx#L30)

What changed:
- `/games` now exposes `authPolicy`.
- The seeded flashcards metadata says `requiresAppIdentity: false` and `requiredScopes: ["flashcards:play"]`.
- The actual privileged write flow requires app identity plus a `points:add` game-session token.

Why this is a problem:
- Clients consuming `/games` are given an auth contract that does not match runtime enforcement.
- That creates false confidence for future web/mobile integrations and makes the metadata unreliable as a source of truth.
- The mismatch is already reflected in tests: the mocked game metadata in the web tests repeats the stale policy, so the inconsistency is being codified rather than detected.

Why the current tests miss it:
- `games.integration.test.ts` only checks field presence and basic shapes, not semantic agreement with route behavior.
- No contract test asserts that the security metadata for flashcards matches the requirements enforced by `/auth/game-session` and `/points/add`.

Suggested follow-up:
- Decide whether `authPolicy` describes the whole game or only base gameplay routes.
- If it is authoritative, update the seed data and tests to reflect the enforced rules.
- Add a contract test that fails when exposed metadata and protected-route behavior diverge.

### 3. Medium: the docs and env template were not updated for the new allowlist and app-client configuration

Files:
- [apps/api/.env.example](/home/luke/git/kgp1/apps/api/.env.example#L1)
- [README.md](/home/luke/git/kgp1/README.md#L259)
- [apps/api/src/config.ts](/home/luke/git/kgp1/apps/api/src/config.ts#L18)
- [apps/api/src/db/seed.ts](/home/luke/git/kgp1/apps/api/src/db/seed.ts#L130)

What changed:
- Runtime now supports `ALLOWED_GAME_IDS`.
- Seeding now depends on `FLASHCARDS_CLIENT_SECRET` when overriding the default integration-client secret.

Why this is a problem:
- Neither variable is documented in `apps/api/.env.example`.
- The README environment block also omits both variables.
- The commit claims a full docs sweep and new allowlist/security model, but the primary setup path does not tell operators how to configure either feature.

Why this matters operationally:
- A user following the documented setup cannot discover how to change the game allowlist.
- A user cannot rotate the seeded flashcards client secret from the documented env template.
- That leaves security-sensitive configuration implicit and scattered across source files instead of documented entry points.

Suggested follow-up:
- Add both variables to `apps/api/.env.example` with comments.
- Mirror them in the README/USAGE environment sections.
- Document how `ALLOWED_GAME_IDS` interacts with `/games` and `/internal/games/health`.

### 4. Medium: the new boundary/conformance guard rails do not protect the new topology, and an actual reverse dependency is already present

Files:
- [games/flashcards/backend-adapter/src/index.ts](/home/luke/git/kgp1/games/flashcards/backend-adapter/src/index.ts#L1)
- [scripts/check-boundaries.sh](/home/luke/git/kgp1/scripts/check-boundaries.sh#L14)
- [docs/ARCHITECTURE_BOUNDARY_POLICY_PENDING.md](/home/luke/git/kgp1/docs/ARCHITECTURE_BOUNDARY_POLICY_PENDING.md#L1)

What changed:
- The commit introduces `server/`, `frontend/*`, and `games/*` as the target modular topology.
- The new boundary script only scans `apps` and `packages`.
- The canonical game-module path currently re-exports the backend adapter from `apps/api`.

Why this is a problem:
- The repo now contains a dependency from the supposed target module layer back into the legacy app layer.
- The new guard rail does not even look at `games/`, `server/`, or `frontend/`, so it cannot catch this coupling.
- As a result, the reported "clean separation" is not enforceable yet.

Why the current checks miss it:
- `pnpm boundary:check` passes because `games/**` is outside the script's search roots.
- `pnpm games:conformance` only checks directory existence, so placeholder folders and legacy re-exports still pass.

Suggested follow-up:
- Expand the boundary policy and script to cover `games/`, `server/`, and `frontend/`.
- Either move the adapter implementation into the canonical module path or explicitly mark the current re-export as temporary in the enforcement rules.
- Add at least one guard that fails on `games/** -> apps/**` imports if that dependency is no longer acceptable.

## Verification run

Commands run locally during review:
- `pnpm boundary:check`
- `pnpm games:conformance`
- `pnpm test:unit`
- `pnpm test:web`
- `pnpm test:integration`

All of the above passed in the current workspace, so the findings are about logic, contract alignment, and incomplete guard-rail/docs coverage rather than an immediately failing test suite.

## Plan Alignment Review

I reviewed the findings against:
- [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L3)
- [GAME_MODULARITY_ITERATION_PLAN_SHORT.md](/home/luke/git/kgp1/GAME_MODULARITY_ITERATION_PLAN_SHORT.md#L3)
- [IMPLEMENTATION_STATUS.md](/home/luke/git/kgp1/IMPLEMENTATION_STATUS.md#L10)
- [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)

### Finding 1 status against plan: valid

The scope-escalation finding is fully valid against the declared plan.

Why:
- The master plan requires backend authority and least privilege for delegated game-session tokens, including scoped and audience-bound claims: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L26)
- P4 explicitly requires deny-by-default privileged operations and rejection of scope mismatches: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L145)
- The short plan repeats that P4 must enforce audience/scope/game/client claims: [GAME_MODULARITY_ITERATION_PLAN_SHORT.md](/home/luke/git/kgp1/GAME_MODULARITY_ITERATION_PLAN_SHORT.md#L48)

Current code does not meet that bar because `POST /auth/game-session` signs caller-requested scopes without validating them against the integration client's scopes or the game's metadata policy.

### Finding 2 status against plan: valid

The metadata mismatch is also valid against the declared plan.

Why:
- P2 says `/games` must provide complete routing and policy metadata needed by shells, and validation must fail for invalid/incompatible metadata: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L102)
- The short plan states `/games` metadata should drive routing and policy awareness: [GAME_MODULARITY_ITERATION_PLAN_SHORT.md](/home/luke/git/kgp1/GAME_MODULARITY_ITERATION_PLAN_SHORT.md#L37)

Current flashcards seed metadata advertises `requiresAppIdentity: false` and `requiredScopes: ["flashcards:play"]`, while the implemented privileged flow requires app identity and a `points:add` session scope. That makes the exposed metadata incomplete or semantically misleading.

### Finding 3 status against plan: valid

The incomplete env/docs update is valid against the declared plan.

Why:
- The master plan requires a full docs sweep with updated docs for changed behavior in every phase: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L35)
- P9 is explicitly a full documentation sweep: [GAME_MODULARITY_ITERATION_PLAN_SHORT.md](/home/luke/git/kgp1/GAME_MODULARITY_ITERATION_PLAN_SHORT.md#L73)
- The tracker previously marked P9 as done: [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)

Given that `ALLOWED_GAME_IDS` and `FLASHCARDS_CLIENT_SECRET` materially affect the new allowlist/security model, omitting them from the env template and README is a real miss, not acceptable residual debt under the stated phase criteria.

### Finding 4 status against plan: valid, and stronger after reviewing the tracker

The guard-rail and canonical-topology finding remains valid, and the plan review makes it stronger.

Why:
- P1 says backend code moves into `server/` and the new directory structure is canonical: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L79)
- P3 calls for adapter loading from `games/*/backend-adapter` with strict validation: [GAME_MODULARITY_ITERATION_PLAN_SHORT.md](/home/luke/git/kgp1/GAME_MODULARITY_ITERATION_PLAN_SHORT.md#L42)
- P7 says flashcards must be fully migrated and backend integration must use the flashcards adapter only via the allowlist registry path: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L210)
- Compatibility shims are allowed only until P10: [GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md](/home/luke/git/kgp1/GAME_MODULARITY_DEEP_ANALYSIS_PLAN.md#L45)
- The tracker previously overstated P7/P10 completion before follow-up corrections: [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)

Current code still uses a compatibility bridge:
- [games/flashcards/backend-adapter/src/index.ts](/home/luke/git/kgp1/games/flashcards/backend-adapter/src/index.ts#L1) re-exports from `apps/api`.
- The boundary script does not scan `games/`, `server/`, or `frontend/`: [scripts/check-boundaries.sh](/home/luke/git/kgp1/scripts/check-boundaries.sh#L14)

That means the codebase does not yet support the tracker's claim that cleanup is complete and the topology is canonical.

### Additional finding from plan/status review: documentation and tracker overstate completion or contain stale evidence

Files:
- [IMPLEMENTATION_STATUS.md](/home/luke/git/kgp1/IMPLEMENTATION_STATUS.md#L10)
- [IMPLEMENTATION_STATUS.md](/home/luke/git/kgp1/IMPLEMENTATION_STATUS.md#L35)
- [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)
- [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)
- [PHASE_EXECUTION_TRACKER_2_PENDING.md](/home/luke/git/kgp1/PHASE_EXECUTION_TRACKER_2_PENDING.md#L1)

Why this is a real issue:
- `IMPLEMENTATION_STATUS.md` says completed phases are `P0-P6` plus major `P8`, while the tracker says `P0-P10` are done.
- The tracker still contains stale P4 evidence that `POST /points/add` requires `x-game-client-id` and `x-game-client-secret`, which is no longer true after the delegated-token slice.
- The tracker says flashcards backend runtime moved to the game adapter layer, but the actual `games/.../backend-adapter` entrypoint is still just a re-export of code in `apps/api`.
- `IMPLEMENTATION_STATUS.md` says documentation is complete, but the env/config docs are not fully aligned with the implemented allowlist/security model.

Impact:
- These docs are supposed to be evidence-backed source-of-truth records.
- Right now they are mixing transitional architecture, final-completion claims, and stale implementation notes.
- That makes it harder to reason about what is actually complete versus what is only scaffolded or bridged.

## Fix Plan

### 1. Close the delegated-scope authorization gap

Objective:
- Make `POST /auth/game-session` enforce least privilege exactly as P4 describes.

Plan:
1. Extend app-client verification to return the client's allowed scopes, not only `clientId`.
2. In [apps/api/src/routes/auth.ts](/home/luke/git/kgp1/apps/api/src/routes/auth.ts#L235), compute `requestedScopes` as:
   - explicit body scopes if provided
   - otherwise a game-defined default for the requested privileged flow
3. Reject the request with `403` if any requested scope is not present in the integration client's stored scopes.
4. Reject the request if the game metadata policy forbids delegated issuance for that scope set.
5. Keep the delegated token payload minimal and signed only after all checks pass.

Tests to add:
1. `POST /auth/game-session` rejects a requested scope the client does not have.
2. `POST /auth/game-session` rejects a mixed scope request when one scope is unauthorized.
3. `POST /points/add` rejects a validly signed token whose scope list omits `points:add`.
4. `POST /points/add` rejects user mismatch and game mismatch explicitly if not already covered.

### 2. Make exposed game metadata truthful and enforceable

Objective:
- Make `/games` policy metadata match the actual behavior it is meant to describe.

Plan:
1. Decide the contract meaning of `authPolicy`:
   - either game-global policy
   - or base-gameplay policy only, with privileged operation policies modeled separately
2. If keeping a single `authPolicy`, update flashcards seed metadata to reflect current privileged requirements or remove misleading fields until they can be represented correctly.
3. If the current schema is too coarse, add an operation-level policy model such as `capabilityPolicies.points.add`.
4. Add validation so seeded metadata cannot silently contradict required backend flows.

Tests to add:
1. Integration test asserting flashcards metadata matches expected auth semantics.
2. Schema/unit tests for any new operation-level policy contract.
3. Web test proving the menu/router consumes the correct entry path field if `entryWeb` is intended to be canonical.

### 3. Finish the P9 env/docs sweep

Objective:
- Document the allowlist and integration-client configuration where operators actually look first.

Plan:
1. Update [apps/api/.env.example](/home/luke/git/kgp1/apps/api/.env.example#L1) with:
   - `ALLOWED_GAME_IDS=flashcards`
   - `FLASHCARDS_CLIENT_SECRET=...`
2. Update the environment sections in `README.md` and `USAGE.md` to explain:
   - how allowlisting affects `/games`
   - how the seeded flashcards integration client secret is configured
   - which values are dev defaults versus must-change secrets
3. Update `docs/backend-allowlist-security.md` to explain scope issuance constraints once item 1 is fixed.

### 4. Bring the topology and boundary enforcement in line with P1/P3/P7/P10

Objective:
- Stop claiming final modular separation until the repo enforces it.

Plan:
1. Expand [scripts/check-boundaries.sh](/home/luke/git/kgp1/scripts/check-boundaries.sh#L1) to scan `games/`, `server/`, and `frontend/`.
2. Add rules for:
   - `games/**` must not import `apps/**` once the corresponding phase is marked complete
   - `server/**` must not import `frontend/**`
   - `frontend/**` must not import `server/**`
3. Either:
   - move the flashcards backend adapter implementation into `games/flashcards/backend-adapter`, then import it from there, or
   - explicitly mark the current re-export as a temporary compatibility shim and roll back the P7/P10 completion claims until the move is finished
4. Consider adding an adapter-loading or adapter-validation test so P3 is enforced by behavior, not only by directory shape.

Tests/checks to add:
1. Boundary check failure case for `games/** -> apps/**` imports.
2. Unit/integration coverage for adapter registration/loading expectations.
3. Conformance checks that require actual entry files, not only directory presence.

### 5. Correct the source-of-truth docs so they reflect the real state

Objective:
- Make the tracker/status docs trustworthy again.

Plan:
1. Update `IMPLEMENTATION_STATUS.md` so its completed phases and documented gaps match the tracker and actual code.
2. Fix stale P4 tracker text that still describes the pre-game-session credential flow on `POST /points/add`.
3. Downgrade any claimed `done` phase back to `partial` or `compatibility mode` where the code still depends on bridges.
4. Add an explicit “transitional compatibility debt” subsection if some shims are intentionally retained.
5. Reconcile the docs only after code and guard rails are aligned, not before.

Recommended ordering:
1. Fix scope issuance and tests.
2. Fix metadata contract and seed/test alignment.
3. Update boundary/conformance enforcement and adapter placement.
4. Then update tracker/status/docs to describe the resulting real state.

## Execution Status

Implemented from the fix plan:
1. Delegated scope issuance is now least-privilege:
   - `POST /auth/game-session` defaults to the game's declared required scopes when scopes are omitted.
   - requested scopes are rejected unless they are a subset of the integration client's stored scopes.
2. `POST /points/add` now checks the game's declared required scopes instead of relying on a stray hardcoded assumption.
3. Flashcards metadata, mapper expectations, and tests were aligned to the delegated points flow:
   - `requiresAppIdentity: true`
   - `requiredScopes: ["points:add"]`
   - `tokenAudience: "game:flashcards"`
4. Missing auth/points regression tests were added for:
   - unauthorized scope requests
   - default delegated scopes
   - missing required scope on the session token
   - user mismatch
   - game mismatch
5. Env/docs were updated to document `ALLOWED_GAME_IDS` and `FLASHCARDS_CLIENT_SECRET`.
6. Boundary and game-structure checks were strengthened and now cover the target topology roots plus required game module entry files.
7. Flashcards backend adapter was extracted into a real workspace package:
   - `games/flashcards/backend-adapter/package.json`
   - `games/flashcards/backend-adapter/src/index.ts`
   - `apps/api/src/routes/flashcards.ts` now consumes the package instead of a source-tree copy
   - deleted `apps/api/src/games/flashcards/backend-adapter.ts`
8. `IMPLEMENTATION_STATUS.md` and `PHASE_EXECUTION_TRACKER_2_PENDING.md` were corrected so they no longer overstate the current compatibility-mode architecture.

Remaining partial item:
1. The broader `server/` / `frontend/*` migration is still not complete.
2. The flashcards backend-adapter compatibility copy is removed, but the overall repo still has not completed the larger package/topology cutover described for `server/` and `frontend/*`.

Post-fix verification:
- `pnpm boundary:check`
- `pnpm games:conformance`
- `pnpm test:unit`
- `pnpm test:web`
- `./dev.sh test:int`
- `pnpm lint`
- `pnpm typecheck`

All of the above passed after the fixes.
