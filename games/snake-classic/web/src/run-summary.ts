import type {
  SnakeClassicDifficulty,
  SnakeClassicEndedBy,
} from './engine.js'

export interface SnakeClassicRunSummary {
  score: number
  applesEaten: number
  durationMs: number
  difficulty: SnakeClassicDifficulty
  endedBy: SnakeClassicEndedBy
}

export function emitRunSummary(_summary: SnakeClassicRunSummary): void {
  // Reserved for a future platform points integration.
}
