# Performance Status Report

Created: 2026-04-02T07:02:30.780Z

## Scope

- Frontend baseline source: `/tmp/kgp-perf/20260402-085012/frontend-baseline.json`
- API load source: `/tmp/kgp-perf/20260402-094954/api-load.json`
- DB analysis source: `/tmp/kgp-perf/20260402-072835/db-analysis.json`
- Stack comparison source: `/tmp/kgp-perf/20260402-094912/stack-api-load.json`

## Frontend baseline

- Menu route load: 363.36 ms
- Flashcards deck picker load: 225.75 ms
- Tic-Tac-Toe route load: 226.43 ms
- Tic-Tac-Toe hover sweep: 1503.38 ms
- Tic-Tac-Toe approximate animation FPS sample: 54.07
- Snake route load: 222.89 ms
- Snake approximate animation FPS sample: 60.66
- Browser trace artifact: `/tmp/kgp-perf/20260402-085012/frontend-trace.zip`

## API load summary

- games_list: 100 requests, p95 85.52 ms, throughput 823.12 req/s, error rate 0.00%
- flashcards_decks: 100 requests, p95 52.31 ms, throughput 1261.87 req/s, error rate 0.00%
- flashcards_cards: 100 requests, p95 16.84 ms, throughput 2097.96 req/s, error rate 0.00%
- auth_login_then_me: 100 requests, p95 1803.58 ms, throughput 16.64 req/s, error rate 0.00%
- flashcards_progress_read: 100 requests, p95 10.12 ms, throughput 3088.70 req/s, error rate 0.00%
- flashcards_progress_position_write: 100 requests, p95 140.00 ms, throughput 305.48 req/s, error rate 0.00%
- flashcards_progress_known_write: 100 requests, p95 151.69 ms, throughput 268.17 req/s, error rate 0.00%

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

- games_list: 100 requests, p95 92.08 ms, throughput 731.78 req/s, error rate 0.00%
- flashcards_decks: 100 requests, p95 16.50 ms, throughput 1686.02 req/s, error rate 0.00%
- flashcards_cards: 100 requests, p95 28.47 ms, throughput 992.62 req/s, error rate 0.00%
- auth_login_then_me: 100 requests, p95 7220.27 ms, throughput 4.17 req/s, error rate 0.00%
- flashcards_progress_read: 100 requests, p95 16.33 ms, throughput 1612.53 req/s, error rate 0.00%
- flashcards_progress_position_write: 100 requests, p95 146.28 ms, throughput 321.46 req/s, error rate 0.00%
- flashcards_progress_known_write: 100 requests, p95 241.52 ms, throughput 204.75 req/s, error rate 0.00%

## Early observations

- This baseline captures the current custom fetch client architecture without TanStack Query.
- This baseline captures the current HTTP request/response model without WebSockets.
- Before/after comparisons must reuse the same routes, user/load tiers, and environment notes.
