# New Project Agent Bootstrap Templates

Created: 2026-04-02 11:15 EEST

Companion template pack for `NEW_PROJECT_AGENT_BOOTSTRAP_GUIDE.md`.

Use this file when you want an agent to bootstrap a new repository mechanically with minimal interpretation. The guide explains the operating model; this file provides reusable starting structures.

## Template usage rules

1. Start from the smallest template that is complete enough for the project type.
2. Replace placeholders before treating a file as complete.
3. Keep timestamps when creating or appending markdown content.
4. Remove sections that are not relevant to the project instead of leaving misleading placeholders.
5. Adapt command examples to the real toolchain immediately.

## Suggested bootstrap directory skeleton

```text
project-root/
├── README.md
├── AGENTS.md
├── docs/
├── project_docs/
│   ├── RnD_docs/
│   │   ├── ARCHITECTURE.md
│   │   ├── USAGE.md
│   │   ├── WORKLOG_initial.md
│   │   └── WORKLOG_curr.md
│   ├── ongoing/
│   │   └── <FIRST_TRACKER>_PENDING.md
│   └── history/
└── <runtime directories>
```

## Decision intake worksheet

Added: 2026-04-02 11:31 EEST

Use this before filling the templates.

Lock these inputs first:
1. primary project type
2. runtime ownership roots
3. package manager or build system
4. canonical command surface
5. narrowest baseline tests for major change types
6. whether performance commands should exist from the start

Ask only the unresolved questions:
1. What type of project is this?
2. What runtime pieces should exist from the start?
3. Which frameworks or language choices are already fixed?
4. Should the repo be single-app, multi-package, or monorepo?
5. Should containerization be part of local development immediately?
6. Which verification layers are required from day one?
7. What persistence layer is expected?
8. Are there org-specific rules that should be encoded in `AGENTS.md` immediately?

If a plan or starter structure already exists, compare it against the framework on:
1. project-type fit
2. repo structure clarity
3. runtime ownership boundaries
4. command surface clarity
5. documentation completeness
6. tracker/worklog readiness
7. verification and testability
8. performance readiness
9. maintainability and future extension

Then choose one:
1. framework as-is
2. existing approach as-is
3. hybrid approach

## Default blueprint prompt for a React frontend + backend + database + containers app

Use this prompt pattern when the target project resembles a modern full-stack app:

```text
I can bootstrap this as a documentation-first full-stack project with:
- React web frontend
- backend API service
- relational database
- local container stack
- root task runner script
- `project_docs` structure with worklogs and trackers
- unit, integration, web, and e2e verification layers

I will use that as the default unless you want any of these changed:
1. frontend framework
2. backend framework
3. database choice
4. container workflow
5. package manager / task runner
6. repo layout
7. test depth
```

If the user already has a draft plan or starter repo shape, prepend:

```text
Before applying this default, I will compare it against your existing plan or starter structure and keep whichever approach is better for the project. If the best result is a hybrid, I will use that and state the chosen parts clearly.
```

For this project family, default placeholder command names can be proposed as:
1. `init`
2. `help`
3. `deps`
4. `build`
5. `lint`
6. `typecheck`
7. `test:unit`
8. `test:int`
9. `test:web`
10. `test:e2e`
11. `test:full`
12. `stack:up`
13. `stack:down`
14. `stack:verify`
15. optional `docs`, `analyze`, `sanitize`, or `profile`

The agent should then map them to the actual chosen toolchain, for example:
1. root shell script
2. `npm` scripts
3. `pnpm` scripts
4. `make` targets
5. another org-standard command layer

## Default blueprint prompt for a pure Linux project

Added: 2026-04-02 12:02 EEST

Use this only when the project is classified as Linux-native and not as a full-stack React/backend app.

```text
I can bootstrap this as a documentation-first Linux-native project with:
- native executables and/or services
- optional libraries if needed
- a root command surface with help and dependency reporting
- runtime-aware tests
- optional docs, static analysis, sanitizer, and profile workflows

I will use that as the default unless you want any of these changed:
1. executable vs library outputs
2. build system
3. runtime model
4. IPC usage
5. test depth
6. optional quality layers
```

For Linux-classified projects, this blueprint replaces the React/full-stack one unless the user explicitly wants a mixed project.

## Linux daemon/service add-on template

Added: 2026-04-02 12:12 EEST

Use this only when the Linux project includes a long-running daemon or service.

Treat this as an idea set, not a mandatory checklist. The agent should evaluate which parts fit the actual project, add any other clearly useful service-oriented ideas, and ask the user only for blocker decisions.

Consider whether the project should define:
1. signal handling expectations such as `SIGINT`, `SIGTERM`, or reload behavior
2. startup and shutdown semantics such as graceful drain, immediate exit, or restart behavior
3. runtime ownership of PID files, sockets, lock files, or other service artifacts
4. health, readiness, or smoke-verification paths
5. duplicate-instance protection if only one service instance should run
6. logging, status-reporting, or lightweight diagnostics behavior
7. restart or recovery expectations after crashes or partial runtime cleanup
8. service-focused test-harness isolation needs

Ask the user only if these become blocker decisions:
1. should the service prioritize graceful shutdown, immediate shutdown, or support both?
2. should only one instance be allowed at a time?
3. does the service need a health or smoke endpoint/command from day one?
4. are there required supervisor or deployment assumptions that affect the bootstrap setup?

Good optional command additions when relevant:
1. `run`
2. `run:debug`
3. `smoke`
4. `status`

## Linkable library add-on template

Use this only when the Linux project must produce a reusable static library, shared library, or both.

Ask:
1. static library, shared library, or both?
2. what is the public header/include root?
3. does ABI compatibility or SOVERSION need to be planned from the start?
4. what consumer verification path should exist?

Document:
1. public headers and include ownership
2. API or ABI boundary expectations
3. versioning and SOVERSION policy if relevant
4. consumer-facing verification path

Suggested command additions:
1. `build`
2. `test`
3. optional `install` or `package`
4. optional `abi-check` if later needed

## IPC/shared-communication add-on template

Use this only when IPC is explicitly part of the intended Linux project design.

Ask:
1. which IPC family is intended:
   - local POSIX/shared memory/semaphores
   - sockets or pipes
   - message queues
   - other local IPC
2. what runtime artifacts need ownership and cleanup rules?
3. what real-process verification path is needed?

Document:
1. runtime artifact ownership
2. lifecycle and cleanup rules
3. test-harness preflight and isolation needs
4. black-box verification against real processes

Keep this generic. Do not assume any one IPC mechanism unless the user selects it.

## Optional CMake starter template

Use this only when CMake is chosen or strongly suitable for the Linux project.

Strong starter ideas:
1. explicit language standard
2. compile commands export
3. warnings enabled
4. optional sanitizer toggle
5. clean separation of library and executable targets
6. optional docs, static-analysis, and test targets when tools exist

Treat this as a starter pattern, not as a mandatory build-system rule.

## Bootstrap execution checklist

Use this when actually creating the initial project structure:
1. create the top-level directories and `project_docs` structure
2. create `README.md`
3. create `AGENTS.md`
4. create `ARCHITECTURE.md`
5. create `USAGE.md`
6. create `WORKLOG_initial.md`
7. create `WORKLOG_curr.md`
8. create the first active tracker in `project_docs/ongoing`
9. define setup/build/run/verification commands in the docs
10. define the initial verification matrix
11. add one timestamped bootstrap entry to the current worklog

## Test harness preflight checklist

Use this when tests interact with real services, processes, shared state, or containers:
1. detect conflicting external runtime instances and fail fast if needed
2. prevent concurrent test runs when shared resources would collide
3. clean or isolate known runtime artifacts before and after tests
4. state clearly which tests own the runtime lifecycle
5. define at least one black-box verification path against the real runtime when applicable

## Dependency summary starter snippet

Use this pattern when creating dependency guidance and `deps` command output:

```text
Required:
- <tool>
- <tool>

Optional:
- <tool>
- <tool>

Quick install:
- <platform command>

Dependency summary command:
- <deps command>
```

## Optional quality layers starter snippet

Add these only when they provide real value for the project:
1. docs generation command
2. static analysis command
3. sanitizer build command
4. debug or profile build command

## README.md starter template

```md
# <Project Name>

<One-sentence description.>

> Full developer guide: [`USAGE.md`](project_docs/RnD_docs/USAGE.md)

## Quick Links

- Architecture: [`project_docs/RnD_docs/ARCHITECTURE.md`](project_docs/RnD_docs/ARCHITECTURE.md)
- Current execution tracker: [`project_docs/ongoing/<FIRST_TRACKER>.md`](project_docs/ongoing/<FIRST_TRACKER>.md)
- Agent operating rules: [`AGENTS.md`](AGENTS.md)
- Bootstrap/process guide if desired: `<optional link>`

## Quick Start

```bash
<setup command>
<run command>
```

## Core Commands

- Setup: `<setup command>`
- Help: `<help command>`
- Dependencies: `<deps command>`
- Build: `<build command>`
- Check: `<check command>`
- Test: `<test command>`
- Run: `<run command>`

## Notes

- <Important environment or runtime note>
- <Important scope or architecture note>
```

## USAGE.md starter template

```md
# <Project Name> — Local Development Guide

Created: <timestamp>

## Purpose

Everything needed to set up, run, verify, and troubleshoot the project locally.

## Table of Contents

1. Prerequisites
2. Setup
3. Running the project
4. Verification
5. Common tasks
6. Troubleshooting

## Prerequisites

- <tool>
- <tool>

## Setup

```bash
<setup commands>
```

## Running the project

```bash
<run commands>
```

## Verification

- Narrow check: `<command>`
- Broader check: `<command>`

## Common tasks

- <task>: `<command>`

## Troubleshooting

- <common issue>: <resolution>
```

## ARCHITECTURE.md starter template

```md
# <Project Name> Architecture

Created: <timestamp>

## Summary

<Short description of system shape and goals.>

## Runtime ownership roots

1. `<path>` — <responsibility>
2. `<path>` — <responsibility>

## Core flows

1. <request or control flow>
2. <data flow>

## Boundaries and rules

1. <ownership rule>
2. <dependency or communication rule>
3. <safety or scope rule>

## Verification implications

1. <what should be tested where>
2. <what counts as high blast radius>
```

## WORKLOG_initial.md starter template

```md
# Initial Worklog

Created: <timestamp>

## <timestamp>

Project bootstrap started.

Initial intent:
1. <goal>
2. <goal>

Initial structure decisions:
1. <decision>
2. <decision>
```

## WORKLOG_curr.md starter template

```md
# Current Worklog

Created: <timestamp>

## <timestamp>

Bootstrap milestone completed.

Completed:
1. <item>
2. <item>

Next:
1. <item>
2. <item>
```

## First tracker template

Use one of these naming patterns:
1. `<TOPIC>_PENDING.md`
2. `<TOPIC>_IN_PROGRESS.md`
3. `<TOPIC>_DONE.md`

```md
# <Topic Title>

Status: PENDING
Created: <timestamp>
Owner: <owner>
References:
- `README.md`
- `AGENTS.md`
- `project_docs/RnD_docs/USAGE.md`
- `project_docs/RnD_docs/ARCHITECTURE.md`

## Summary

<What this tracker covers and why it exists.>

## Goals

1. <goal>
2. <goal>

## Tasks

### P0 — <phase name>

1. <task>
2. <task>

Acceptance criteria:
1. <criterion>
2. <criterion>

## Remaining work

1. <remaining item>
2. <remaining item>

## Progress updates

### <timestamp>

<Progress note.>
```

## Verification matrix template

```md
# Verification Matrix

Created: <timestamp>

| Change type | Narrow baseline | Required rerun | Blast-radius checks | Optional deeper checks |
|-------------|-----------------|----------------|---------------------|------------------------|
| UI/component change | `<command>` | `<command>` | `<command>` | `<command>` |
| Backend/service change | `<command>` | `<command>` | `<command>` | `<command>` |
| Shared contract change | `<command>` | `<command>` | `<command>` | `<command>` |
| Build/config/CI change | `<command>` | `<command>` | `<command>` | `<command>` |
```

## Similar-project default command proposal

For a React/frontend + backend + database + container stack, the agent may start with this structure and then adapt it:

```text
Setup
- init
- help
- deps

Development
- web
- api
- build

Quality
- lint
- typecheck
- check

Tests
- test:unit
- test:web
- test:int
- test:e2e
- test:full

Stack
- stack:up
- stack:down
- stack:rebuild
- stack:verify

Optional quality layers
- docs
- analyze
- sanitize
- profile
```

This proposal is useful because:
1. it gives the new project a clear command language immediately
2. it matches the common needs of similar full-stack apps
3. the agent can preserve the command names even if the implementation behind them differs

Use this proposal only when:
1. the project is broadly similar to the full-stack React/backend/database/container pattern
2. no better existing command model is already defined
3. the user has not mandated a different org-standard command surface

## Linux-family default command proposal

Use this only for Linux-classified projects. It replaces the React/full-stack command proposal unless the user explicitly wants a mixed project.

```text
Core
- help
- deps
- build
- test
- clean
- rebuild

Optional build modes
- debug
- release
- sanitize
- profile or reldbg

Optional quality layers
- docs
- analyze

Optional runtime commands
- run
- run:debug
- smoke

Optional runtime verification
- test:integration
- test:runtime
```

Use this proposal only when:
1. the project is Linux-native
2. no better existing command model is already defined
3. the user has not mandated a different org-standard command surface
4. the project is not intentionally combining Linux-native and full-stack app command families

## Performance standard starter template

```md
# Performance Review Standard

Created: <timestamp>

## Core rules

1. Measure before optimizing.
2. Use before/after evidence.
3. Keep heavyweight perf workflows opt-in unless intentionally promoted.

## Required measurement surfaces

1. <surface>
2. <surface>

## Required artifacts

1. baseline report
2. after-change report
3. keep/fix/defer decision log
```

## Real-runtime verification note

When the project runs real binaries, services, processes, or containers, define at least one verification path that exercises the real runtime directly instead of relying only on unit or mocked checks.

## AGENTS.md quick-fill checklist

Before finalizing `AGENTS.md`, make sure you replaced:
1. package manager
2. task runner
3. repo shape
4. baseline verification commands
5. blast-radius verification commands
6. repo-specific safety notes
7. commit workflow specifics if they differ from the default

## Definition of bootstrap-ready

The bootstrap pack is fully applied when:
1. all core docs exist
2. placeholders are replaced with project-specific values
3. the first tracker exists and is accurate
4. verification commands are real and runnable
5. the docs cross-link correctly
6. an incoming agent can understand how to work in the repo without inventing process
