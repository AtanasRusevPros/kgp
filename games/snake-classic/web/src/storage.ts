import {
  createDefaultSnakeClassicSettings,
  type SnakeClassicSettings,
} from './engine.js'

export const SNAKE_CLASSIC_HIGH_SCORE_KEY = 'kgp.snakeClassic.highScore'
export const SNAKE_CLASSIC_SETTINGS_KEY = 'kgp.snakeClassic.settings.v1'

export function readSnakeClassicHighScore(storage: Storage = window.localStorage): number {
  const rawValue = storage.getItem(SNAKE_CLASSIC_HIGH_SCORE_KEY)
  const parsed = rawValue ? Number.parseInt(rawValue, 10) : 0
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export function writeSnakeClassicHighScore(
  highScore: number,
  storage: Storage = window.localStorage,
): void {
  storage.setItem(SNAKE_CLASSIC_HIGH_SCORE_KEY, String(Math.max(0, Math.floor(highScore))))
}

export function readSnakeClassicSettings(
  storage: Storage = window.localStorage,
): SnakeClassicSettings {
  const defaults = createDefaultSnakeClassicSettings()
  const rawValue = storage.getItem(SNAKE_CLASSIC_SETTINGS_KEY)

  if (!rawValue) {
    return defaults
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<SnakeClassicSettings>
    return {
      difficulty: parsed.difficulty ?? defaults.difficulty,
      reducedMotionOverride: parsed.reducedMotionOverride ?? defaults.reducedMotionOverride,
      lastControlHint: parsed.lastControlHint ?? defaults.lastControlHint,
    }
  } catch {
    return defaults
  }
}

export function writeSnakeClassicSettings(
  settings: SnakeClassicSettings,
  storage: Storage = window.localStorage,
): void {
  storage.setItem(SNAKE_CLASSIC_SETTINGS_KEY, JSON.stringify(settings))
}
