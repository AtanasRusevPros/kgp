# Server Boundary (Phase P1)

This directory is the target canonical home for all backend concerns.

## Target ownership
- API runtime and route composition
- Auth and security policies
- DB schema, migrations, repositories, seed logic
- Integration registry for allowlisted games

## Current status
`server/` is now the canonical backend runtime root.
It owns the API package, DB scripts, repositories, tests, and backend integration wiring.

## Remaining follow-up
Compatibility-era references outside this directory are cleaned up later in the broader docs/cleanup phases.
