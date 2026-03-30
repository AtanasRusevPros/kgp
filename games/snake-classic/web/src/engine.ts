export const SNAKE_CLASSIC_GRID_SIZE = 50
export const SNAKE_CLASSIC_DESKTOP_VIEWPORT = 50
export const SNAKE_CLASSIC_MOBILE_VIEWPORT = 22
export const SNAKE_CLASSIC_CAMERA_SMOOTHING = 0.18
export const SNAKE_CLASSIC_SPEED_UP_EVERY_APPLES = 5
export const SNAKE_CLASSIC_SPEED_UP_DELTA_MS = 5
export const SNAKE_CLASSIC_MIN_TICK_MS = 70
export const SNAKE_CLASSIC_INITIAL_LENGTH = 4

export const SNAKE_CLASSIC_TICK_MS = {
  slow: 180,
  normal: 140,
  fast: 110,
} as const

export type SnakeClassicDifficulty = keyof typeof SNAKE_CLASSIC_TICK_MS
export type SnakeClassicDirection = 'up' | 'down' | 'left' | 'right'
export type SnakeClassicControlHint = 'mouse' | 'keyboard' | 'touch'
export type SnakeClassicReducedMotionOverride = 'system' | 'on' | 'off'
export type SnakeClassicEndedBy = 'wall' | 'self'

export interface GridPoint {
  x: number
  y: number
}

export interface SnakeClassicSettings {
  difficulty: SnakeClassicDifficulty
  reducedMotionOverride: SnakeClassicReducedMotionOverride
  lastControlHint: SnakeClassicControlHint
}

export interface SnakeClassicRunState {
  difficulty: SnakeClassicDifficulty
  snake: GridPoint[]
  direction: SnakeClassicDirection
  queuedDirection: SnakeClassicDirection
  apple: GridPoint
  score: number
  applesEaten: number
  tickMs: number
  status: 'running' | 'game-over'
  endedBy: SnakeClassicEndedBy | null
  startedAtMs: number
  endedAtMs: number | null
}

function pointsEqual(a: GridPoint, b: GridPoint): boolean {
  return a.x === b.x && a.y === b.y
}

function isInsideBoard(point: GridPoint): boolean {
  return (
    point.x >= 0
    && point.x < SNAKE_CLASSIC_GRID_SIZE
    && point.y >= 0
    && point.y < SNAKE_CLASSIC_GRID_SIZE
  )
}

function isOppositeDirection(
  current: SnakeClassicDirection,
  next: SnakeClassicDirection,
): boolean {
  return (
    (current === 'up' && next === 'down')
    || (current === 'down' && next === 'up')
    || (current === 'left' && next === 'right')
    || (current === 'right' && next === 'left')
  )
}

function getDirectionDelta(direction: SnakeClassicDirection): GridPoint {
  switch (direction) {
    case 'up':
      return { x: 0, y: -1 }
    case 'down':
      return { x: 0, y: 1 }
    case 'left':
      return { x: -1, y: 0 }
    case 'right':
      return { x: 1, y: 0 }
  }
}

function createCenteredSnake(): GridPoint[] {
  const center = Math.floor(SNAKE_CLASSIC_GRID_SIZE / 2)
  return Array.from({ length: SNAKE_CLASSIC_INITIAL_LENGTH }, (_unused, index) => ({
    x: center - index,
    y: center,
  }))
}

function getAvailableCells(snake: GridPoint[]): GridPoint[] {
  const occupied = new Set(snake.map((segment) => `${segment.x},${segment.y}`))
  const cells: GridPoint[] = []

  for (let y = 0; y < SNAKE_CLASSIC_GRID_SIZE; y += 1) {
    for (let x = 0; x < SNAKE_CLASSIC_GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        cells.push({ x, y })
      }
    }
  }

  return cells
}

export function getTickMsForDifficulty(
  difficulty: SnakeClassicDifficulty,
  applesEaten: number,
): number {
  const speedSteps = Math.floor(applesEaten / SNAKE_CLASSIC_SPEED_UP_EVERY_APPLES)
  const baseTick = SNAKE_CLASSIC_TICK_MS[difficulty]
  return Math.max(baseTick - (speedSteps * SNAKE_CLASSIC_SPEED_UP_DELTA_MS), SNAKE_CLASSIC_MIN_TICK_MS)
}

export function spawnApple(
  snake: GridPoint[],
  random: () => number = Math.random,
): GridPoint {
  const cells = getAvailableCells(snake)
  const selectedIndex = Math.min(
    cells.length - 1,
    Math.floor(random() * Math.max(cells.length, 1)),
  )

  return cells[selectedIndex] ?? { x: 0, y: 0 }
}

export function createDefaultSnakeClassicSettings(): SnakeClassicSettings {
  return {
    difficulty: 'normal',
    reducedMotionOverride: 'system',
    lastControlHint: 'keyboard',
  }
}

export function createSnakeClassicRun(
  difficulty: SnakeClassicDifficulty,
  random: () => number = Math.random,
  nowMs: number = Date.now(),
): SnakeClassicRunState {
  const snake = createCenteredSnake()
  return {
    difficulty,
    snake,
    direction: 'right',
    queuedDirection: 'right',
    apple: spawnApple(snake, random),
    score: 0,
    applesEaten: 0,
    tickMs: getTickMsForDifficulty(difficulty, 0),
    status: 'running',
    endedBy: null,
    startedAtMs: nowMs,
    endedAtMs: null,
  }
}

export function queueDirection(
  state: SnakeClassicRunState,
  nextDirection: SnakeClassicDirection,
): SnakeClassicRunState {
  if (state.status !== 'running') {
    return state
  }

  if (isOppositeDirection(state.direction, nextDirection)) {
    return state
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  }
}

export function resolveFollowDirection(
  head: GridPoint,
  worldTarget: GridPoint,
  currentDirection: SnakeClassicDirection,
): SnakeClassicDirection {
  const dx = worldTarget.x - head.x
  const dy = worldTarget.y - head.y
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  if (absDx === 0 && absDy === 0) {
    return currentDirection
  }

  if (absDx > absDy) {
    return dx >= 0 ? 'right' : 'left'
  }

  if (absDy > absDx) {
    return dy >= 0 ? 'down' : 'up'
  }

  if (currentDirection === 'left' || currentDirection === 'right') {
    return dx >= 0 ? 'right' : 'left'
  }

  return dy >= 0 ? 'down' : 'up'
}

export function resolveSwipeDirection(
  start: GridPoint,
  end: GridPoint,
  currentDirection: SnakeClassicDirection,
): SnakeClassicDirection {
  return resolveFollowDirection(start, end, currentDirection)
}

export function stepSnakeClassicRun(
  state: SnakeClassicRunState,
  random: () => number = Math.random,
  nowMs: number = Date.now(),
): SnakeClassicRunState {
  if (state.status !== 'running') {
    return state
  }

  const direction = isOppositeDirection(state.direction, state.queuedDirection)
    ? state.direction
    : state.queuedDirection

  const delta = getDirectionDelta(direction)
  const head = state.snake[0]

  if (!head) {
    return {
      ...state,
      status: 'game-over',
      endedBy: 'self',
      endedAtMs: nowMs,
    }
  }

  const nextHead = { x: head.x + delta.x, y: head.y + delta.y }

  if (!isInsideBoard(nextHead)) {
    return {
      ...state,
      direction,
      status: 'game-over',
      endedBy: 'wall',
      endedAtMs: nowMs,
    }
  }

  const ateApple = pointsEqual(nextHead, state.apple)
  const occupiedBody = ateApple ? state.snake : state.snake.slice(0, -1)
  if (occupiedBody.some((segment) => pointsEqual(segment, nextHead))) {
    return {
      ...state,
      direction,
      status: 'game-over',
      endedBy: 'self',
      endedAtMs: nowMs,
    }
  }

  const nextSnake = [nextHead, ...state.snake]
  if (!ateApple) {
    nextSnake.pop()
  }

  const applesEaten = state.applesEaten + (ateApple ? 1 : 0)

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    apple: ateApple ? spawnApple(nextSnake, random) : state.apple,
    score: state.score + (ateApple ? 1 : 0),
    applesEaten,
    tickMs: getTickMsForDifficulty(state.difficulty, applesEaten),
    endedBy: null,
    endedAtMs: null,
  }
}

export function getRunDurationMs(state: SnakeClassicRunState, nowMs: number = Date.now()): number {
  const endTime = state.endedAtMs ?? nowMs
  return Math.max(0, endTime - state.startedAtMs)
}
