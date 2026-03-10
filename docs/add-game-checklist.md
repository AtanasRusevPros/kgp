# Add Game Checklist (Allowlisted Model)

1. Create `games/<gameId>/{contracts,web,mobile,backend-adapter}`.
2. Add game record in DB seed and metadata fields.
3. Add/verify allowlist entry (`ALLOWED_GAME_IDS`).
4. Add app client credentials and scopes for privileged flows.
5. Register web game module manifest/registry entry.
6. Add backend adapter registration path.
7. Add tests:
   - game metadata and routing
   - allowlist behavior
   - auth/session scope behavior (if privileged writes)
8. Run `pnpm games:conformance`.
9. Run `pnpm test:full`.
