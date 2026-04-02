# Performance Baseline Report

Created: 2026-04-02T04:29:18.336Z

## Scope

- Frontend baseline source: `/tmp/kgp-perf/20260402-072835/frontend-baseline.json`
- API load source: `/tmp/kgp-perf/20260402-072835/api-load.json`
- DB analysis source: `/tmp/kgp-perf/20260402-072835/db-analysis.json`
- Stack comparison source: `not captured in this run`

## Frontend baseline

- Menu route load: 395.06 ms
- Flashcards deck picker load: 208.42 ms
- Tic-Tac-Toe route load: 219.16 ms
- Tic-Tac-Toe hover sweep: 1434.72 ms
- Tic-Tac-Toe approximate animation FPS sample: 42.67
- Snake route load: 200.17 ms
- Snake approximate animation FPS sample: 60.67
- Browser trace artifact: `/tmp/kgp-perf/20260402-072835/frontend-trace.zip`

## API load summary

- games_list: 100 requests, p95 68.56 ms, throughput 1004.94 req/s, error rate 0.00%
- flashcards_decks: 100 requests, p95 59.07 ms, throughput 1164.64 req/s, error rate 0.00%
- flashcards_cards: 100 requests, p95 14.83 ms, throughput 1869.25 req/s, error rate 0.00%
- auth_login_then_me: 100 requests, p95 7409.22 ms, throughput 4.22 req/s, error rate 0.00%
- flashcards_progress_read: 100 requests, p95 11.13 ms, throughput 2741.55 req/s, error rate 0.00%
- flashcards_progress_position_write: 100 requests, p95 112.90 ms, throughput 313.54 req/s, error rate 0.00%
- flashcards_progress_known_write: 100 requests, p95 112.18 ms, throughput 353.56 req/s, error rate 0.00%

## Database analysis summary

- games_enabled_list: planning 0.52 ms, execution 0.11 ms, root node Sort
- decks_by_game_and_lang: planning 0.21 ms, execution 0.50 ms, root node Sort
- cards_by_deck: planning 0.04 ms, execution 0.20 ms, root node Sort
- deck_progress_read: planning 0.32 ms, execution 0.04 ms, root node Index Scan
- known_cards_read: planning 0.43 ms, execution 0.04 ms, root node Index Scan
- progress_position_upsert: planning 0.01 ms, execution 0.61 ms, root node ModifyTable
- known_card_upsert: planning 0.01 ms, execution 0.40 ms, root node ModifyTable
- known_count_aggregate: planning 0.05 ms, execution 0.06 ms, root node Aggregate

## Stack API comparison

- Skipped in this run because the Podman+Caddy stack was not already healthy.

## Early observations

- This baseline captures the current custom fetch client architecture without TanStack Query.
- This baseline captures the current HTTP request/response model without WebSockets.
- Before/after comparisons must reuse the same routes, user/load tiers, and environment notes.

