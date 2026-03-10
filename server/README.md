# Server Boundary (Phase P1)

This directory is the target canonical home for all backend concerns.

## Target ownership
- API runtime and route composition
- Auth and security policies
- DB schema, migrations, repositories, seed logic
- Integration registry for allowlisted games

## Current status (compatibility mode)
Implementation is still running from `apps/api` while migration proceeds.
`server/` is introduced in P1 to establish ownership boundaries and migration direction.

## Migration rule
Backend logic will be moved incrementally from `apps/api` into `server/` with compatibility shims until final cleanup phase.
