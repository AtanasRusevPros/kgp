Created: 2026-04-02 09:00 EEST

# Performance Backend and Database Analysis

## Scope

This checkpoint captures the backend/database analysis phase after the initial baseline and the first auth optimization.

It answers:
1. which backend paths are actually hot
2. whether the database is the main bottleneck
3. which changes are justified now
4. which changes should be deferred

## Current measured picture

From the baseline and follow-up API runs:
1. `auth_login_then_me` was the dominant backend hotspot before tuning auth hashing.
2. Flashcards read paths were already relatively fast.
3. Flashcards progress writes were slower than reads, but still much less severe than the original auth path.

From the DB analysis report:
1. `games_enabled_list` executed in `0.109 ms`
2. `decks_by_game_and_lang` executed in `0.496 ms`
3. `cards_by_deck` executed in `0.199 ms`
4. progress reads executed in roughly `0.038-0.045 ms`
5. progress upserts executed in roughly `0.398-0.606 ms`

## Conclusions

### 1. The database is not the main bottleneck for the currently measured read paths

The query plans and execution times are already small. The largest measured problem before optimization was auth, and that was dominated by password hashing cost rather than SQL.

### 2. Auth tuning was the one clearly justified backend optimization

`BCRYPT_SALT_ROUNDS` is now configurable, with:
1. development/test default: `10`
2. production default: `12`

That change materially improved the measured login flow without requiring schema or route refactors.

### 3. Additional backend changes beyond auth are not yet justified for merge based on current evidence

The team evaluated further changes in this phase, including flashcards progress-write rewrites and small registry caching ideas, but did not keep them because the evidence was not strong enough:
1. flashcards write rewrites did not produce a stable, clearly better API perf result
2. registry micro-caching did not produce a trustworthy enough win in the broader perf reruns to justify added complexity

## Keep / Fix Now / Defer

### Keep

1. Current flashcards read-path structure
2. Current direct SQL repository approach
3. Current DB pool size for now

### Fix now

1. Auth hashing cost split by environment, which is already implemented

### Defer

1. Flashcards progress-write refactors until route-specific write benchmarking is tighter and less noisy
2. Registry caching until `/games` is shown to be a meaningful real-world bottleneck
3. Larger DB/index changes until data volume and concurrency are high enough to make the current plans materially worse

## Recommended next backend-focused work

1. Improve measurement quality for flashcards write scenarios before changing repository logic again.
2. Revisit backend changes only after direct-vs-stack data is available, since some of the apparent overhead may sit outside the query layer.
3. Keep the DB analysis script as the main guard against speculative query/index work.
