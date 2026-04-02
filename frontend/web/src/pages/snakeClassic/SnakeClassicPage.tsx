import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from 'react'
import { motion } from 'motion/react'
import { RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { Layout } from '../../components/Layout.js'
import {
  SNAKE_CLASSIC_CAMERA_SMOOTHING,
  SNAKE_CLASSIC_DESKTOP_VIEWPORT,
  SNAKE_CLASSIC_GRID_SIZE,
  SNAKE_CLASSIC_MOBILE_VIEWPORT,
  createSnakeClassicRun,
  createDefaultSnakeClassicSettings,
  getRunDurationMs,
  queueDirection,
  resolveFollowDirection,
  resolveSwipeDirection,
  stepSnakeClassicRun,
  type GridPoint,
  type SnakeClassicDifficulty,
  type SnakeClassicReducedMotionOverride,
  type SnakeClassicRunState,
  type SnakeClassicSettings,
} from '../../../../../games/snake-classic/web/src/engine.js'
import {
  readSnakeClassicHighScore,
  readSnakeClassicSettings,
  writeSnakeClassicHighScore,
  writeSnakeClassicSettings,
} from '../../../../../games/snake-classic/web/src/storage.js'
import { emitRunSummary } from '../../../../../games/snake-classic/web/src/run-summary.js'

const BACKGROUND_COLORS = {
  pageStart: '#071426',
  pageEnd: '#0d2138',
  boardBase: '#09111f',
  boardGlow: '#2dd4bf',
  snakeHead: '#7ef9b8',
  snakeBody: '#22c55e',
  snakeShadow: '#14532d',
  appleOuter: '#fb7185',
  appleInner: '#ef4444',
  textPrimary: '#eff6ff',
  textSecondary: 'rgba(226, 232, 240, 0.72)',
  cardBorder: 'rgba(125, 211, 252, 0.14)',
} as const

const DIFFICULTY_OPTIONS: SnakeClassicDifficulty[] = ['slow', 'normal', 'fast']
const REDUCED_MOTION_OPTIONS: SnakeClassicReducedMotionOverride[] = ['system', 'on', 'off']

interface BoardMetrics {
  worldLeft: number
  worldTop: number
  viewportCells: number
  cellSize: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function lerp(from: number, to: number, factor: number): number {
  return from + ((to - from) * factor)
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setPrefersReducedMotion(query.matches)
    update()

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }

    query.addListener(update)
    return () => query.removeListener(update)
  }, [])

  return prefersReducedMotion
}

function useIsCompactViewport(): boolean {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.innerWidth < 900
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const update = () => setIsCompact(window.innerWidth < 900)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return isCompact
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function screenToWorldPoint(
  event: ReactPointerEvent<HTMLDivElement>,
  metrics: BoardMetrics,
): GridPoint {
  const rect = event.currentTarget.getBoundingClientRect()
  const localX = event.clientX - rect.left
  const localY = event.clientY - rect.top
  return {
    x: metrics.worldLeft + (localX / metrics.cellSize),
    y: metrics.worldTop + (localY / metrics.cellSize),
  }
}

function touchToWorldPoint(
  event: ReactTouchEvent<HTMLDivElement>,
  metrics: BoardMetrics,
): GridPoint | null {
  const touch = event.touches[0]
  if (!touch) {
    return null
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const localX = touch.clientX - rect.left
  const localY = touch.clientY - rect.top
  return {
    x: metrics.worldLeft + (localX / metrics.cellSize),
    y: metrics.worldTop + (localY / metrics.cellSize),
  }
}

function createMotionProps(enabled: boolean, delay = 0) {
  if (!enabled) {
    return {
      initial: false,
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0 },
    } as const
  }

  return {
    initial: { opacity: 0, y: 16, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.35, delay },
  } as const
}

function readInitialSettings(): SnakeClassicSettings {
  if (typeof window === 'undefined') {
    return createDefaultSnakeClassicSettings()
  }
  return readSnakeClassicSettings(window.localStorage)
}

function readInitialHighScore(): number {
  if (typeof window === 'undefined') {
    return 0
  }
  return readSnakeClassicHighScore(window.localStorage)
}

export function SnakeClassicPage() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isCompactViewport = useIsCompactViewport()
  const [settings, setSettings] = useState<SnakeClassicSettings>(() => readInitialSettings())
  const [highScore, setHighScore] = useState(() => readInitialHighScore())
  const [run, setRun] = useState<SnakeClassicRunState>(() =>
    createSnakeClassicRun(readInitialSettings().difficulty),
  )
  const [isPointerFollowing, setIsPointerFollowing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const touchStartRef = useRef<GridPoint | null>(null)
  const metricsRef = useRef<BoardMetrics>({
    worldLeft: 0,
    worldTop: 0,
    viewportCells: SNAKE_CLASSIC_DESKTOP_VIEWPORT,
    cellSize: 1,
  })
  const cameraRef = useRef({
    centerX: SNAKE_CLASSIC_GRID_SIZE / 2,
    centerY: SNAKE_CLASSIC_GRID_SIZE / 2,
  })
  const runRef = useRef(run)
  const summarySentRef = useRef(false)

  runRef.current = run

  const animationsEnabled = useMemo(() => {
    if (settings.reducedMotionOverride === 'on') {
      return false
    }
    if (settings.reducedMotionOverride === 'off') {
      return true
    }
    return !prefersReducedMotion
  }, [prefersReducedMotion, settings.reducedMotionOverride])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    writeSnakeClassicSettings(settings, window.localStorage)
  }, [settings])

  useEffect(() => {
    if (run.status !== 'running') {
      return
    }

    const timer = window.setTimeout(() => {
      setRun((currentRun) => stepSnakeClassicRun(currentRun, Math.random, Date.now()))
    }, run.tickMs)

    return () => window.clearTimeout(timer)
  }, [run])

  useEffect(() => {
    if (run.status !== 'game-over') {
      summarySentRef.current = false
      return
    }

    if (summarySentRef.current) {
      return
    }

    summarySentRef.current = true
    emitRunSummary({
      score: run.score,
      applesEaten: run.applesEaten,
      durationMs: getRunDurationMs(run),
      difficulty: run.difficulty,
      endedBy: run.endedBy ?? 'wall',
    })

    if (run.score > highScore) {
      setHighScore(run.score)
      if (typeof window !== 'undefined') {
        writeSnakeClassicHighScore(run.score, window.localStorage)
      }
    }
  }, [highScore, run])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      }

      const nextDirection = keyMap[event.key]
      if (!nextDirection) {
        return
      }

      event.preventDefault()
      setSettings((currentSettings) => {
        if (currentSettings.lastControlHint === 'keyboard') {
          return currentSettings
        }
        return {
          ...currentSettings,
          lastControlHint: 'keyboard',
        }
      })
      setRun((currentRun) => queueDirection(currentRun, nextDirection))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    let frameId = 0

    const renderBoard = (timestamp: number) => {
      const canvas = canvasRef.current
      const board = boardRef.current
      const currentRun = runRef.current

      if (!canvas || !board) {
        frameId = window.requestAnimationFrame(renderBoard)
        return
      }

      const context = canvas.getContext('2d')
      if (!context) {
        frameId = window.requestAnimationFrame(renderBoard)
        return
      }

      const rect = board.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = Math.max(1, Math.floor(rect.width * dpr))
      const height = Math.max(1, Math.floor(rect.height * dpr))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      const viewportCells = isCompactViewport
        ? SNAKE_CLASSIC_MOBILE_VIEWPORT
        : SNAKE_CLASSIC_DESKTOP_VIEWPORT
      const cellSize = Math.min(width, height) / viewportCells
      const head = currentRun.snake[0] ?? { x: SNAKE_CLASSIC_GRID_SIZE / 2, y: SNAKE_CLASSIC_GRID_SIZE / 2 }

      if (isCompactViewport) {
        const halfViewport = viewportCells / 2
        const targetX = clamp(head.x + 0.5, halfViewport, SNAKE_CLASSIC_GRID_SIZE - halfViewport)
        const targetY = clamp(head.y + 0.5, halfViewport, SNAKE_CLASSIC_GRID_SIZE - halfViewport)
        cameraRef.current = {
          centerX: lerp(cameraRef.current.centerX, targetX, SNAKE_CLASSIC_CAMERA_SMOOTHING),
          centerY: lerp(cameraRef.current.centerY, targetY, SNAKE_CLASSIC_CAMERA_SMOOTHING),
        }
      } else {
        cameraRef.current = {
          centerX: SNAKE_CLASSIC_GRID_SIZE / 2,
          centerY: SNAKE_CLASSIC_GRID_SIZE / 2,
        }
      }

      const worldLeft = isCompactViewport
        ? clamp(cameraRef.current.centerX - (viewportCells / 2), 0, SNAKE_CLASSIC_GRID_SIZE - viewportCells)
        : 0
      const worldTop = isCompactViewport
        ? clamp(cameraRef.current.centerY - (viewportCells / 2), 0, SNAKE_CLASSIC_GRID_SIZE - viewportCells)
        : 0

      metricsRef.current = {
        worldLeft,
        worldTop,
        viewportCells,
        cellSize,
      }

      context.clearRect(0, 0, width, height)
      const gradient = context.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, BACKGROUND_COLORS.boardBase)
      gradient.addColorStop(1, '#0f1e31')
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)

      context.strokeStyle = 'rgba(148, 163, 184, 0.11)'
      context.lineWidth = 1
      for (let line = 0; line <= viewportCells; line += 1) {
        const offset = line * cellSize
        context.beginPath()
        context.moveTo(offset, 0)
        context.lineTo(offset, height)
        context.stroke()
        context.beginPath()
        context.moveTo(0, offset)
        context.lineTo(width, offset)
        context.stroke()
      }

      const applePulse = animationsEnabled ? 0.9 + (0.08 * Math.sin(timestamp / 180)) : 0.94
      const appleX = (currentRun.apple.x - worldLeft) * cellSize
      const appleY = (currentRun.apple.y - worldTop) * cellSize
      const appleRadius = (cellSize * 0.34) * applePulse
      const appleGradient = context.createRadialGradient(
        appleX + (cellSize / 2),
        appleY + (cellSize / 2),
        cellSize * 0.12,
        appleX + (cellSize / 2),
        appleY + (cellSize / 2),
        appleRadius,
      )
      appleGradient.addColorStop(0, BACKGROUND_COLORS.appleOuter)
      appleGradient.addColorStop(1, BACKGROUND_COLORS.appleInner)
      context.fillStyle = appleGradient
      context.beginPath()
      context.arc(appleX + (cellSize / 2), appleY + (cellSize / 2), appleRadius, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#86efac'
      context.fillRect(appleX + (cellSize * 0.48), appleY + (cellSize * 0.15), cellSize * 0.08, cellSize * 0.16)

      currentRun.snake
        .slice()
        .reverse()
        .forEach((segment, reverseIndex) => {
          const actualIndex = currentRun.snake.length - reverseIndex - 1
          const segmentX = (segment.x - worldLeft) * cellSize
          const segmentY = (segment.y - worldTop) * cellSize
          const inset = actualIndex === 0 ? cellSize * 0.06 : cellSize * 0.12
          const widthWithInset = cellSize - (inset * 2)
          const heightWithInset = cellSize - (inset * 2)
          const segmentGradient = context.createLinearGradient(
            segmentX,
            segmentY,
            segmentX + cellSize,
            segmentY + cellSize,
          )
          segmentGradient.addColorStop(0, actualIndex === 0 ? BACKGROUND_COLORS.snakeHead : BACKGROUND_COLORS.snakeBody)
          segmentGradient.addColorStop(1, actualIndex === 0 ? '#bbf7d0' : BACKGROUND_COLORS.snakeShadow)
          context.fillStyle = segmentGradient
          drawRoundedRect(
            context,
            segmentX + inset,
            segmentY + inset,
            widthWithInset,
            heightWithInset,
            cellSize * 0.22,
          )
          context.fill()

          if (actualIndex === 0) {
            context.fillStyle = '#082f1e'
            const eyeRadius = cellSize * 0.06
            context.beginPath()
            context.arc(segmentX + (cellSize * 0.36), segmentY + (cellSize * 0.38), eyeRadius, 0, Math.PI * 2)
            context.arc(segmentX + (cellSize * 0.64), segmentY + (cellSize * 0.38), eyeRadius, 0, Math.PI * 2)
            context.fill()
          }
        })

      if (currentRun.status === 'game-over') {
        context.fillStyle = 'rgba(7, 20, 38, 0.38)'
        context.fillRect(0, 0, width, height)
      }

      frameId = window.requestAnimationFrame(renderBoard)
    }

    frameId = window.requestAnimationFrame(renderBoard)
    return () => window.cancelAnimationFrame(frameId)
  }, [animationsEnabled, isCompactViewport])

  const updateLastControlHint = (nextControlHint: SnakeClassicSettings['lastControlHint']) => {
    setSettings((currentSettings) => {
      if (currentSettings.lastControlHint === nextControlHint) {
        return currentSettings
      }
      return {
        ...currentSettings,
        lastControlHint: nextControlHint,
      }
    })
  }

  const queueFollowPoint = (worldTarget: GridPoint) => {
    setRun((currentRun) => {
      const head = currentRun.snake[0]
      if (!head) {
        return currentRun
      }

      return queueDirection(
        currentRun,
        resolveFollowDirection(head, worldTarget, currentRun.direction),
      )
    })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    updateLastControlHint('mouse')
    setIsPointerFollowing(true)
    queueFollowPoint(screenToWorldPoint(event, metricsRef.current))
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerFollowing && event.buttons === 0) {
      return
    }
    queueFollowPoint(screenToWorldPoint(event, metricsRef.current))
  }

  const handlePointerUp = () => {
    setIsPointerFollowing(false)
  }

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    if (!touch) {
      return
    }
    updateLastControlHint('touch')
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (event: ReactTouchEvent<HTMLDivElement>) => {
    const worldTarget = touchToWorldPoint(event, metricsRef.current)
    if (!worldTarget) {
      return
    }

    updateLastControlHint('touch')
    queueFollowPoint(worldTarget)
  }

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!start || !touch) {
      return
    }

    const swipeDirection = resolveSwipeDirection(
      start,
      { x: touch.clientX, y: touch.clientY },
      runRef.current.direction,
    )

    updateLastControlHint('touch')
    setRun((currentRun) => queueDirection(currentRun, swipeDirection))
  }

  const startNewRun = (difficulty: SnakeClassicDifficulty = settings.difficulty) => {
    setRun(createSnakeClassicRun(difficulty, Math.random, Date.now()))
  }

  const handleDifficultyChange = (difficulty: SnakeClassicDifficulty) => {
    setSettings((currentSettings) => {
      if (currentSettings.difficulty === difficulty) {
        return currentSettings
      }
      return {
        ...currentSettings,
        difficulty,
      }
    })
    if (settings.difficulty === difficulty) {
      return
    }
    setRun(createSnakeClassicRun(difficulty, Math.random, Date.now()))
  }

  const handleReducedMotionChange = (reducedMotionOverride: SnakeClassicReducedMotionOverride) => {
    setSettings((currentSettings) => {
      if (currentSettings.reducedMotionOverride === reducedMotionOverride) {
        return currentSettings
      }
      return {
        ...currentSettings,
        reducedMotionOverride,
      }
    })
  }

  const controlHintLabel = {
    keyboard: 'Keyboard ready',
    mouse: 'Mouse follow active',
    touch: 'Touch controls ready',
  }[settings.lastControlHint]

  const statusTitle = run.status === 'game-over'
    ? run.endedBy === 'wall'
      ? 'Game over: wall collision'
      : 'Game over: self collision'
    : `Score ${run.score}`

  const subtitle = run.status === 'game-over'
    ? `You ate ${run.applesEaten} apple${run.applesEaten === 1 ? '' : 's'} this run.`
    : isPointerFollowing
      ? 'Hold the mouse button and drag the cursor to guide the snake.'
      : 'Use keyboard, hold-to-follow mouse, or swipe on touch screens.'

  return (
    <Layout title="Snake Classic" showBack>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <motion.section
          {...createMotionProps(animationsEnabled)}
          className="overflow-hidden rounded-[2rem] border p-6 shadow-[0_30px_80px_rgba(8,47,73,0.28)]"
          style={{
            background: `radial-gradient(circle at top left, rgba(45, 212, 191, 0.18), transparent 36%), linear-gradient(135deg, ${BACKGROUND_COLORS.pageStart}, ${BACKGROUND_COLORS.pageEnd})`,
            borderColor: BACKGROUND_COLORS.cardBorder,
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-7 w-7 text-emerald-300" />
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/80">
                  browser-local modern arcade
                </p>
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-50 sm:text-5xl">
                Snake Classic
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200/80 sm:text-base">
                A 50x50 Nokia-inspired snake board with adaptive camera behavior, hold-to-follow mouse guidance, keyboard and swipe controls, and reduced-motion-aware presentation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startNewRun()}
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
            >
              <RotateCcw className="h-4 w-4" />
              New run
            </button>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          <motion.section
            {...createMotionProps(animationsEnabled, 0.05)}
            className="overflow-hidden rounded-[2rem] border p-4 shadow-[0_30px_80px_rgba(8,47,73,0.24)] sm:p-6"
            style={{
              background: 'linear-gradient(180deg, rgba(8, 47, 73, 0.92), rgba(7, 20, 38, 0.96))',
              borderColor: BACKGROUND_COLORS.cardBorder,
            }}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300/70">
                  live board
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-50">{statusTitle}</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                {controlHintLabel}
              </div>
            </div>

            <div
              ref={boardRef}
              role="application"
              aria-label="Snake Classic board"
              data-status={run.status}
              data-score={run.score}
              data-direction={run.direction}
              data-control-hint={settings.lastControlHint}
              data-motion-mode={animationsEnabled ? 'full' : 'reduced'}
              data-head-x={run.snake[0]?.x ?? -1}
              data-head-y={run.snake[0]?.y ?? -1}
              data-apple-x={run.apple.x}
              data-apple-y={run.apple.y}
              className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/80 shadow-inner"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <canvas ref={canvasRef} className="h-full w-full touch-none" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent px-4 py-3 text-xs text-slate-100/75">
                {subtitle}
              </div>
            </div>
          </motion.section>

          <motion.aside
            {...createMotionProps(animationsEnabled, 0.1)}
            className="grid gap-4 rounded-[2rem] border p-5 shadow-[0_28px_70px_rgba(8,47,73,0.18)]"
            style={{
              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.78))',
              borderColor: BACKGROUND_COLORS.cardBorder,
            }}
          >
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Score</p>
                <p className="mt-2 text-3xl font-black text-white">{run.score}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">High score</p>
                <p className="mt-2 text-3xl font-black text-white">{highScore}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Apples</p>
                <p className="mt-2 text-3xl font-black text-white">{run.applesEaten}</p>
              </div>
            </div>

            <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Difficulty</p>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">tick {run.tickMs}ms</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map((difficulty) => (
                  <button
                    key={difficulty}
                    type="button"
                    aria-pressed={settings.difficulty === difficulty}
                    onClick={() => handleDifficultyChange(difficulty)}
                    className={[
                      'rounded-xl px-3 py-2 text-sm font-semibold capitalize transition',
                      settings.difficulty === difficulty
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-900/80 text-slate-100 hover:bg-slate-800',
                    ].join(' ')}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-4 w-4 text-amber-300" />
                <p className="text-sm font-semibold">Effects and motion</p>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {REDUCED_MOTION_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={settings.reducedMotionOverride === option}
                    onClick={() => handleReducedMotionChange(option)}
                    className={[
                      'rounded-xl px-3 py-2 text-sm font-semibold capitalize transition',
                      settings.reducedMotionOverride === option
                        ? 'bg-cyan-300 text-slate-950'
                        : 'bg-slate-900/80 text-slate-100 hover:bg-slate-800',
                    ].join(' ')}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-300/75">
                System mode follows the browser reduced-motion preference. Override it here when you want stronger or quieter visuals.
              </p>
            </section>

            <section className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200/78">
              <p className="font-semibold text-white">Controls</p>
              <p className="mt-2">Keyboard: arrows or WASD.</p>
              <p>Mouse: hold button and drag toward the apple.</p>
              <p>Touch: swipe to turn; dragging also works as hold-follow.</p>
            </section>
          </motion.aside>
        </div>
      </div>
    </Layout>
  )
}
