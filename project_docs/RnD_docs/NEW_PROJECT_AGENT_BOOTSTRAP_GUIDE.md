# New Project Agent Bootstrap Guide

Created: 2026-04-02 11:05 EEST

Reusable methodology guide for starting a new software project with agent-friendly structure, traceability, verification discipline, and documentation-first workflow from day one.

Use this document when:
1. bootstrapping a brand-new repository
2. standardizing how agents should operate in that repository
3. creating the initial documentation and tracking structure
4. setting universal quality, testing, and performance expectations

This is not a day-to-day task checklist for one specific project. It is a project bootstrap standard that should be adapted once at project start and then used to shape the repo's `README.md`, `AGENTS.md`, `project_docs/`, and verification workflow.

## Purpose and usage

The goal is to make a new repository agent-ready immediately:
1. documentation exists before the codebase becomes large
2. active work is tracked and timestamped
3. tests are part of the implementation contract
4. performance work is measurable rather than speculative
5. agents can work autonomously without lowering safety or traceability

This guide is intended to work for:
1. server/client applications
2. backend services and Linux daemons
3. libraries and SDKs
4. CLI tools
5. containerized systems
6. mixed monorepos and modular systems

For the easiest agent experience, use this guide together with:
1. `project_docs/RnD_docs/NEW_PROJECT_AGENT_BOOTSTRAP_TEMPLATES.md`

The main guide defines the operating model and decisions. The companion templates document provides ready-to-fill file skeletons, tracker formats, and a mechanical bootstrap sequence.

## Bootstrap decision flow

Added: 2026-04-02 11:31 EEST

Use this framework as a strong default, not as something to force blindly.

The agent should follow this decision order:
1. inspect whether a basic plan, alpha structure, command surface, or partial docs already exist
2. classify the project as one of:
   - web app or client-server application
   - backend service or Linux daemon
   - library or SDK
   - CLI tool
   - container or infrastructure-heavy system
   - mixed monorepo
3. lock the early decisions:
   - primary project type
   - package manager
   - task runner or canonical command surface
   - runtime ownership roots
   - main verification commands
   - whether performance/load work needs opt-in commands from the start
4. if a known blueprint applies, propose it first
5. ask only for deviations from that proposal
6. if the user already has a plan or starter structure, compare it against this framework
7. choose the best-fit result:
   - framework as-is
   - existing approach as-is
   - deliberate hybrid

Minimum user-intake questions:
1. What type of project is this?
2. What runtime pieces should exist from the start?
3. Which language/framework choices are already fixed?
4. What package manager, build system, or task runner should be canonical?
5. What verification depth is expected initially?
6. What persistence technologies are intended?
7. Should containerization be part of the initial local workflow?
8. Are there any mandatory org or team rules that must be encoded immediately?

Comparison criteria:
1. fit for the actual project type
2. clarity of repo structure and ownership boundaries
3. clarity of command surface
4. completeness of documentation and tracking
5. verification and testability
6. performance and measurement readiness
7. maintainability and future extension
8. alignment with explicit user or org constraints

Default rule:
1. if the project is from scratch and similar to a React frontend + backend + database + containers app, use the full-stack blueprint from this framework unless the user asks for changes
2. if the project is from scratch but a different type, use only the parts of the framework that fit
3. if a clearly better existing approach already exists, use that instead

## Blueprint selection rules

Added: 2026-04-02 12:02 EEST

Use the blueprint family that matches the project classification.

Selection rules:
1. if the project is a React/frontend + backend + database + containers app, prefer the existing full-stack blueprint
2. if the project is a pure Linux project, prefer the Linux-family templates and do not use the React/full-stack blueprint unless the user explicitly wants a mixed system
3. if the project is mixed, combine only the relevant families deliberately
4. if an existing plan or alpha structure exists, compare it against the matching family template rather than against every family template at once

Linux-family triggering criteria:
1. daemon or service
2. native executable or tool
3. C or C++ library
4. IPC-based local multi-process system
5. POSIX or Linux runtime integration project

Linux-family user-intake additions:
1. should the project produce executables, libraries, or both?
2. if libraries exist, should they support static linking, dynamic linking, or both?
3. is IPC part of the intended design?
4. should CMake be the canonical build system?
5. should docs generation, static analysis, sanitizers, or profile builds be part of the initial command surface?

## Documentation-first project structure

Recommended baseline structure:

```text
project-root/
├── README.md
├── AGENTS.md
├── docs/
├── project_docs/
│   ├── RnD_docs/
│   ├── ongoing/
│   └── history/
└── <runtime code directories>
```

Use each area deliberately:

### `README.md`

Use for:
1. project purpose
2. quick-start setup
3. canonical high-level entrypoints
4. links to the most important deeper documents

### `AGENTS.md`

Use for:
1. repository-specific operating rules
2. verification expectations
3. safety boundaries
4. collaboration and ambiguity-handling rules
5. commit and cleanup expectations

### `docs/`

Use for:
1. focused implementation guides
2. integration guides
3. feature-specific reference docs
4. contributor workflows that are important but not universal

### `project_docs/RnD_docs`

Use for canonical long-lived reference material:
1. architecture
2. usage guide
3. implementation status
4. performance standards
5. reusable technical guidance
6. worklogs

### `project_docs/ongoing`

Use for active execution artifacts:
1. plans
2. trackers
3. phased execution docs
4. in-progress analysis
5. current task streams that are not yet historical

### `project_docs/history`

Use for completed or superseded artifacts:
1. retired plans
2. historical decisions
3. completed review docs
4. reference snapshots that should remain preserved but not active

## Required document set at project start

Minimum recommended starting set:
1. `README.md`
2. `AGENTS.md`
3. `project_docs/RnD_docs/USAGE.md`
4. `project_docs/RnD_docs/ARCHITECTURE.md`
5. `project_docs/RnD_docs/WORKLOG_initial.md`
6. `project_docs/RnD_docs/WORKLOG_curr.md`
7. first active tracker in `project_docs/ongoing`

Suggested starting responsibilities:
1. `README.md` explains what the project is and how to start it quickly
2. `AGENTS.md` defines how agents should work inside the repo
3. `USAGE.md` explains the canonical local workflows
4. `ARCHITECTURE.md` describes the intended system shape and ownership boundaries
5. `WORKLOG_initial.md` preserves the original project framing
6. `WORKLOG_curr.md` tracks meaningful ongoing progress
7. the first active tracker defines what is being built now and how completion is judged

Minimum completion criteria for the initial document set:
1. `README.md` includes project purpose, quick-start, and links to the canonical deeper docs
2. `AGENTS.md` includes repo shape, working rules, verification rules, and commit/cleanup rules
3. `USAGE.md` includes setup, run, verification, and troubleshooting entrypoints
4. `ARCHITECTURE.md` includes ownership boundaries, key runtime pieces, and data/control flow at a useful high level
5. both worklogs exist and use timestamped entries
6. the first tracker has explicit status, scope, references, and remaining work

## Tracking and timestamp rules

These rules should be project-wide defaults:
1. every append to any `.md` file must include a timestamp
2. active trackers must reflect their real state, for example `PENDING`, `IN_PROGRESS`, `DONE`
3. when a tracker state changes, update both its title/state and its remaining-work summary
4. when a task changes workflow, status expectations, verification expectations, or user-facing behavior, update the relevant documentation in the same task
5. before preparing a commit, reflect meaningful progress in the appropriate tracker or worklog

Recommended tracker structure:
1. title
2. status
3. created timestamp
4. owner
5. references
6. summary
7. phased or grouped tasks
8. remaining work
9. timestamped progress updates

Recommended worklog pattern:
1. keep one historical initial worklog
2. keep one current rolling worklog
3. append short timestamped entries for meaningful milestones
4. avoid turning the worklog into raw terminal output

Recommended naming patterns:
1. active trackers: `<TOPIC>_PENDING.md`, `<TOPIC>_IN_PROGRESS.md`, `<TOPIC>_DONE.md`
2. dated reports: `<TOPIC>_YYYY-MM-DD.md`
3. rolling worklogs: `WORKLOG_initial.md` and `WORKLOG_curr.md`
4. durable standards: uppercase descriptive names such as `ARCHITECTURE.md`, `USAGE.md`, `PERFORMANCE_REVIEW_STANDARD.md`

## Testing and verification discipline

Make verification part of the implementation contract, not an afterthought.

Default rules:
1. before changing code, run the narrowest meaningful baseline for the affected area
2. if the baseline already fails, record that clearly before editing
3. after changing code, rerun the same baseline
4. then run any additional checks implied by the blast radius
5. extend or enrich the test suite when new functionality arrives
6. keep tests close to the code they verify when the project structure allows it
7. state exactly what remains unverified if full verification is not possible

Examples of baseline thinking:
1. UI change: run the nearest component or web tests first
2. backend route change: run the nearest unit or integration test first
3. shared contract change: run typechecking and the nearest cross-boundary tests
4. startup, CI, or container change: run the closest direct validation scenario, not a random unrelated suite

Use blast-radius verification after the narrow baseline:
1. linting if shared code or conventions were affected
2. typechecking if interfaces or contracts changed
3. integration or end-to-end checks if runtime wiring changed
4. package or module build checks if export/build plumbing changed

For easier reuse, define a small verification matrix early:
1. change type
2. narrowest baseline command
3. required after-change rerun
4. blast-radius checks
5. optional deeper checks

Canonical command-surface rules for nontrivial projects:
1. define one wrapper command surface as the safe default workflow
2. provide a `help` entrypoint that lists the supported commands
3. provide a `deps` or equivalent dependency-summary entrypoint
4. allow direct low-level commands for narrow work, but keep the wrapper as the documented default

Test-harness preflight rules:
1. fail fast if conflicting manual or external runtime instances are active
2. avoid concurrent test runs when shared resources would collide
3. clean or isolate known runtime artifacts before and after tests
4. make test ownership of runtime lifecycle explicit

Real-runtime verification rule:
1. when the project runs real binaries, services, processes, or containers, include at least one black-box verification path against the real runtime

## Performance and measurement discipline

Keep performance work measurable and repeatable.

Universal rules:
1. measure before optimizing
2. compare before and after using the same scenario and environment notes
3. keep heavyweight performance and load workflows opt-in unless intentionally promoted into a standard gate
4. require a lightweight performance-risk review for any new feature or module that may affect runtime cost
5. require after-change verification for performance-sensitive work
6. record what was improved, what was deferred, and what was measured but not worth changing

Performance guidance should be layered:
1. keep one general project-wide performance standard
2. add dedicated framework or subsystem guides only when they provide focused value
3. keep those specialized guides referenced from the general standard, not duplicated everywhere

This applies beyond web apps:
1. daemons may need throughput, memory, or latency measurement
2. libraries may need benchmark and API-surface stability checks
3. CLI tools may need startup-time and large-input profiling
4. containerized systems may need direct-vs-proxied path comparison and startup/readiness measurement

Optional quality layers:
1. documentation generation
2. static analysis
3. sanitizer builds
4. debug or profile build variants

Keep these as explicit opt-in workflow surfaces unless the project intentionally promotes them into standard verification.

## Agent operating model

Agents should be fast, careful, and transparent.

Default operating rules:
1. read minimally at first and widen only when needed
2. identify the ownership path before editing: feature file, nearest test, immediate caller, immediate config
3. prefer surgical changes over broad rewrites
4. avoid silent unrelated fixes
5. work autonomously for routine local commands such as install, build, lint, typecheck, and test
6. pause only for material ambiguity, destructive actions, or architectural choices with real tradeoffs
7. do not push to remotes or take destructive actions without explicit permission
8. if plan-first workflow is requested, stop after planning and open questions
9. make reasonable assumptions for low-impact ambiguity and report them clearly
10. when changes affect workflow, docs, or verification expectations, update the corresponding docs in the same task

Context-control rules:
1. avoid scanning the whole repo unless the task truly requires it
2. use targeted search to find exact ownership
3. stop exploring once the change boundary is clear
4. widen only when behavior crosses modules, packages, contracts, or runtime boundaries

## Commit and cleanup workflow

Use a deliberate sequence:
1. update trackers, worklogs, and user-facing docs first when the task affects them
2. stage only the intended files
3. use a commit message that matches the true change scope
4. after commit, perform a cleanup pass
5. confirm whether the worktree is clean
6. note any intentional follow-up left out of the commit
7. note any verification gaps that still remain

Good commit hygiene:
1. one milestone per commit when practical
2. avoid bundling unrelated refactors with the target task
3. do not hide unfinished risk behind a broad commit message

## Project-type adaptations

Use the same structure, but adapt the examples and checks to the project type.

### Web app or client-server application

Emphasize:
1. route and API ownership
2. UI/component tests
3. integration and end-to-end flows
4. performance guidance for frontend, backend, database, and stack

### Backend service or Linux daemon

Emphasize:
1. service lifecycle and supervision model
2. startup/shutdown behavior
3. IPC, sockets, or system integration points
4. logs, metrics, throughput, and reliability checks

### Library or SDK

Emphasize:
1. public API contracts
2. semantic versioning expectations
3. compatibility and export surface
4. examples and consumer-facing tests

### CLI tool

Emphasize:
1. command surface and flags
2. output stability
3. error messages and exit codes
4. startup time and large-input behavior

### Container or infrastructure-heavy project

Emphasize:
1. local orchestration workflow
2. health and readiness checks
3. direct-path vs proxied-path validation
4. logs, startup order, and recovery scenarios

## Reusable default blueprint for a React frontend + backend + database + containers app

Added: 2026-04-02 11:24 EEST

For projects that are broadly similar to this one, the agent can start from the following default blueprint and ask the user only for the deviations.

Applicability:
1. React web frontend
2. backend HTTP server
3. relational database
4. local containerized stack
5. documentation-first monorepo or structured repo

Recommended default structure:

```text
project-root/
├── README.md
├── AGENTS.md
├── docs/
├── project_docs/
│   ├── RnD_docs/
│   ├── ongoing/
│   └── history/
├── apps/
│   ├── web/
│   └── api/
├── packages/
└── infra/
    └── containers/
```

Recommended default command surface:
1. one root task runner script such as `./dev.sh` or `./scripts/dev.sh`
2. one root package manifest exposing:
   - setup/init
   - help
   - deps
   - build
   - lint
   - typecheck
   - unit tests
   - integration tests
   - e2e tests
   - stack up/down/rebuild
   - optional docs/analyze/sanitize/profile flows when justified
3. direct package-manager commands allowed for narrow checks, but the root task runner should be the canonical workflow

Recommended default documentation set:
1. `README.md`
2. `AGENTS.md`
3. `project_docs/RnD_docs/USAGE.md`
4. `project_docs/RnD_docs/ARCHITECTURE.md`
5. `project_docs/RnD_docs/WORKLOG_initial.md`
6. `project_docs/RnD_docs/WORKLOG_curr.md`
7. one active tracker in `project_docs/ongoing`
8. one performance standard if performance-sensitive work is likely

Recommended default verification layers:
1. unit tests for shared logic and small components
2. integration tests for backend plus database behavior
3. web/component tests for UI behavior
4. end-to-end tests for real user flows
5. typechecking and linting at the root
6. at least one black-box verification path against the real runtime when services, processes, or containers exist

Recommended default container shape:
1. frontend container
2. backend container
3. database container
4. optional reverse proxy container
5. health/readiness checks and a smoke-validation path

Recommended default agent behavior for similar projects:
1. propose this blueprint explicitly
2. ask the user which parts should change
3. generate the initial docs and structure from the companion templates
4. adapt command placeholders to the selected toolchain
5. create a first tracker that captures the bootstrap scope

For this project family, the agent should be able to generate strong placeholder commands even before full implementation exists, for example:
1. setup
2. help
3. deps
4. build
5. lint
6. typecheck
7. test:unit
8. test:int
9. test:e2e
10. stack:up
11. stack:down
12. stack:verify
13. optional docs, analyze, sanitize, or profile commands when justified

If the actual project differs, the agent should keep the naming discipline but replace the commands with the real equivalents.

## First bootstrap sequence for an agent

Use this exact order for the first project bootstrap pass:

1. classify the project type and lock the initial command surface
2. inspect whether a basic plan, alpha structure, or competing proposal already exists
3. if a known blueprint applies, propose it first and ask only for the deviations
4. compare the framework proposal against any existing proposal or structure
5. choose the best-fit approach: framework, existing approach, or a hybrid
6. create the top-level documentation and `project_docs/` directories
7. create `README.md` with purpose, quick-start, and links to core docs
8. create `AGENTS.md` using the template in this guide
9. create `USAGE.md`, `ARCHITECTURE.md`, `WORKLOG_initial.md`, and `WORKLOG_curr.md`
10. create the first active tracker in `project_docs/ongoing`
11. define the canonical setup, build, verification, and runtime commands
12. define the baseline verification matrix
13. define the performance-risk and measurement policy
14. add any project-type-specific companion docs that are justified
15. verify naming consistency and cross-links
16. record the bootstrap milestone in the tracker and current worklog

When a user-intake phase is needed, the agent should:
1. ask only the project-shaping questions that remain unresolved after inspection
2. present one recommended blueprint if the project resembles a known pattern
3. ask for deviations from that blueprint instead of asking the user to design the structure from scratch
4. if an existing partial plan or structure exists, explain briefly whether the framework, the existing approach, or a hybrid was chosen and why
5. record the chosen defaults in the first tracker and worklog

## What "bootstrap complete" means

A new repository is bootstrap-complete when:
1. the documentation structure exists and is internally consistent
2. `README.md` points to the canonical deeper docs
3. `AGENTS.md` is adapted to the repo's real commands and shape
4. the first tracker exists and accurately describes current work
5. verification expectations are defined before major implementation begins
6. timestamp and worklog discipline are established
7. performance and traceability expectations are documented even if no optimization work has started yet
8. another agent can enter the repo and understand how to work safely without inventing process from scratch

## Appendix A — Reusable AGENTS.md template

Added: 2026-04-02 11:05 EEST

The template below keeps the spirit of the current repo's `AGENTS.md` while separating universal rules from project-specific slots.

```md
# AGENTS.md

Guidance for agents working in this repository.

## Goal

Make safe, minimal, well-verified changes with as little context as necessary.

## Repo Shape

- Package manager: `<package-manager>`
- Main runtime or task runner: `<task-runner>`
- Key apps/packages/modules:
  - `<path-or-module>`: `<purpose>`
  - `<path-or-module>`: `<purpose>`

## Working Rules

1. Read only the files needed for the task. Do not scan the whole repo unless the task requires it.
2. Find the ownership path first: the feature file, its nearest test, and the immediate caller/config.
3. Prefer small, surgical edits over broad refactors.
4. Match existing patterns and style in the files you touch.
5. Do not silently fix unrelated issues while editing. Mention them separately if they matter.
6. Avoid new dependencies, renames, and large rewrites unless they are necessary.
7. If you touch shared contracts, exports, build/config plumbing, or public APIs, assume the blast radius is broader.
8. Work only inside this repository root unless the user explicitly asks otherwise.
9. Act autonomously for normal local install, build, lint, typecheck, test, and dev-runtime commands.
10. Pause only for architectural decisions, explicit user choices, or destructive actions.
11. Do not push to remotes, run destructive reset commands, or perform destructive data actions without confirmation.
12. If a command or test cannot be run, say so clearly and explain why.
13. In the main user thread, do not stage files until the user explicitly asks. Ignore this rule for agents explicitly tasked to prepare a commit.
14. When the user explicitly asks for a plan-first workflow, stop after planning, list open questions, and do not execute until those questions are resolved.
15. Prefer renames over delete-and-recreate when moving or retitling files so history stays readable.
16. For high-impact ambiguity, ask before proceeding. For low-impact ambiguity, make reasonable assumptions and report them clearly.

## Code Conventions

1. Prefer editing existing files over creating new ones.
2. Avoid `any` or equivalent unsafe shortcuts unless necessary and justified.
3. When adding tests, keep them close to the code they verify when practical.
4. Every append to any `.md` file must include a timestamp.
5. When a task changes workflows, status tracking, verification expectations, or user-facing behavior, update the relevant docs in the same task.
6. When promoting a tracker from `PENDING` to `IN_PROGRESS` or similar, update both the title/state and the remaining-work summary.

## Verification Rules

Always verify before and after making a change.

### Before changing code

Run the narrowest meaningful baseline for the affected area.

Examples:
- unit-level logic: `<unit-test-command>`
- integration/runtime behavior: `<integration-test-command>`
- UI or interactive behavior: `<ui-test-command>`
- cross-package or public API change: `<typecheck-command>`
- CI/config/script change: run the closest relevant validation directly

If the baseline already fails, note that before editing and do not imply your change caused it.

### After changing code

1. Rerun the same baseline command or scenario.
2. Run any additional checks implied by the blast radius.

Common checks:
- `<lint-command>`
- `<typecheck-command>`
- `<unit-test-command>`
- `<integration-test-command>`
- `<e2e-or-system-test-command>`

If full verification is not possible, run the best narrower checks available and state exactly what remains unverified.

## Context Reduction

1. Start with the root manifest, the main task runner, and only the files directly related to the request.
2. Use targeted search to find the exact feature, route, service, script, or symbol instead of browsing broadly.
3. Prefer targeted reads: one file, one nearby test, one config, one caller.
4. Stop exploring once the ownership path is clear.
5. Widen only when the behavior crosses modules, packages, shared types, or infra/build/test config.

## Security

1. Never commit secrets or real environment files.
2. Never log or paste credentials, tokens, or sensitive data.

## Handoff

Keep the final handoff compact:
- what changed
- what ran before the change
- what ran after the change
- any pre-existing failures or remaining risks

## Commit and Cleanup

1. When the user asks to prepare a commit, first mark task status in the relevant tracker/worklog/docs, then stage the intended files, then use a commit message that matches the real change scope.
2. After each commit, perform a short cleanup pass: confirm the worktree state, note any intentional follow-up left out of the commit, and mention any remaining verification gaps.
```

## Appendix B — Near-verbatim AGENTS.md source pattern

Added: 2026-04-02 11:05 EEST

When cloning the operating model from an existing strong repository, it is often useful to keep one appendix that preserves the original rule flavor closely, then adapt only the repo-shape and command placeholders. The current project's `AGENTS.md` is a good example source for that kind of adaptation because it already combines:
1. minimal-context exploration
2. before/after verification rules
3. tracker/worklog discipline
4. commit cleanup rules
5. safe autonomy with explicit escalation boundaries

When reusing a source `AGENTS.md` from another project:
1. keep the universal safety and verification rules
2. replace repo-shape and command examples with the new project's real commands
3. remove product-specific assumptions that do not transfer
4. keep ambiguity-handling and handoff expectations explicit
5. keep markdown timestamp rules if the new project also uses documentation-first tracking
