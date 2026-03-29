import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { Layout } from '../../components/Layout.js';

type Player = 'X' | 'O';
type CellValue = Player | null;
type BoardState = CellValue[];
type ScoreState = Record<Player | 'draws', number>;

const WINNING_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

const X_CONFETTI_COLORS = ['#f472b6', '#c084fc', '#818cf8'];
const O_CONFETTI_COLORS = ['#38bdf8', '#22d3ee', '#60a5fa'];
const EFFECTS_STORAGE_KEY = 'kgp.tictactoe.effects-enabled';
const TIC_TAC_TOE_LOG_PREFIX = '[tic-tac-toe]';

function createEmptyBoard(): BoardState {
  return Array<CellValue>(9).fill(null);
}

function calculateOutcome(board: BoardState): {
  winner: Player | null;
  winningCells: number[];
  isDraw: boolean;
} {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;

    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        winningCells: [...line],
        isDraw: false,
      };
    }
  }

  return {
    winner: null,
    winningCells: [],
    isDraw: board.every((cell) => cell !== null),
  };
}

function launchCelebrationBarrage(colors: string[]) {
  const confettiBursts = [
    { particleCount: 54, spread: 78, startVelocity: 42, origin: { x: 0.5, y: 0.28 } },
    { particleCount: 38, spread: 64, startVelocity: 34, origin: { x: 0.18, y: 0.44 } },
    { particleCount: 38, spread: 64, startVelocity: 34, origin: { x: 0.82, y: 0.44 } },
  ] as const;

  for (const burst of confettiBursts) {
    confetti({
      ...burst,
      colors,
      scalar: 1,
      ticks: 220,
      drift: 0.2,
      gravity: 1.1,
      zIndex: 9999,
    });
  }
}

function logTicTacToeEffect(message: string): void {
  console.info(`${TIC_TAC_TOE_LOG_PREFIX} ${message}`);
}

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference);
      return () => mediaQuery.removeEventListener('change', updatePreference);
    }

    mediaQuery.addListener(updatePreference);
    return () => mediaQuery.removeListener(updatePreference);
  }, []);

  return prefersReducedMotion;
}

function useBooleanPreference(storageKey: string, defaultValue: boolean): [boolean, (nextValue: boolean) => void] {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === null) {
      return defaultValue;
    }

    return storedValue === 'true';
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, String(value));
  }, [storageKey, value]);

  return [value, setValue];
}

function ScoreCard({
  label,
  value,
  tone,
  animated,
}: {
  label: string;
  value: number;
  tone: 'x' | 'o' | 'neutral';
  animated: boolean;
}) {
  const toneClass = {
    x: 'from-fuchsia-500/25 to-violet-500/20 border-fuchsia-300/25',
    o: 'from-cyan-500/25 to-sky-500/20 border-cyan-300/25',
    neutral: 'from-white/10 to-white/5 border-white/15',
  }[tone];

  const motionProps = animated
    ? ({
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35 },
      } as const)
    : ({
        initial: false,
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0 },
      } as const);

  return (
    <motion.div
      {...motionProps}
      className={`rounded-[1.5rem] border bg-gradient-to-br p-4 text-left shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl ${toneClass}`}
      aria-label={`${label} score`}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
    </motion.div>
  );
}

function CellMark({
  value,
  cellIndex,
  isWinning,
  animateEffects,
}: {
  value: CellValue;
  cellIndex: number;
  isWinning: boolean;
  animateEffects: boolean;
}) {
  if (!value) {
    return null;
  }

  const motionProps = animateEffects
    ? ({
        initial: { opacity: 0, scale: 0.65, rotate: -120 },
        animate: { opacity: 1, scale: 1, rotate: 0 },
        transition: { type: 'spring' as const, stiffness: 260, damping: 18 },
      } as const)
    : ({
        initial: false,
        animate: { opacity: 1, scale: 1, rotate: 0 },
        transition: { duration: 0 },
      } as const);

  const winningPulse = animateEffects
    ? ({
        animate: {
          scale: [1, 1.08, 1] as number[],
        },
        transition: {
          repeat: Infinity,
          duration: 1.15,
          ease: 'easeInOut' as const,
        },
      } as const)
    : ({} as const);

  const xGradient1 = `tic-x-primary-${cellIndex}`;
  const xGradient2 = `tic-x-secondary-${cellIndex}`;
  const oGradient = `tic-o-gradient-${cellIndex}`;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center p-2"
      {...motionProps}
    >
      <motion.div
        className={[
          'flex h-full w-full items-center justify-center',
          isWinning ? 'drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        {...winningPulse}
      >
        {value === 'X' ? (
          <motion.svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="block h-[70%] w-[70%] shrink-0"
          >
            <motion.line
              x1="20"
              y1="20"
              x2="80"
              y2="80"
              stroke={`url(#${xGradient1})`}
              strokeWidth="8"
              strokeLinecap="round"
              initial={animateEffects ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={animateEffects ? { duration: 0.34, ease: 'easeOut' } : { duration: 0 }}
            />
            <motion.line
              x1="80"
              y1="20"
              x2="20"
              y2="80"
              stroke={`url(#${xGradient2})`}
              strokeWidth="8"
              strokeLinecap="round"
              initial={animateEffects ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={
                animateEffects
                  ? { duration: 0.34, ease: 'easeOut', delay: 0.08 }
                  : { duration: 0 }
              }
            />
            <defs>
              <linearGradient id={xGradient1} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id={xGradient2} x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#f472b6" />
              </linearGradient>
            </defs>
          </motion.svg>
        ) : (
          <motion.svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="block h-[70%] w-[70%] shrink-0"
          >
            <motion.circle
              cx="50"
              cy="50"
              r="30"
              stroke={`url(#${oGradient})`}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={animateEffects ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={animateEffects ? { duration: 0.4, ease: 'easeOut' } : { duration: 0 }}
            />
            <defs>
              <linearGradient id={oGradient} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </motion.svg>
        )}
      </motion.div>
    </motion.div>
  );
}

function BoardCell({
  value,
  index,
  disabled,
  onClick,
  isWinning,
  animateEffects,
}: {
  value: CellValue;
  index: number;
  disabled: boolean;
  onClick: () => void;
  isWinning: boolean;
  animateEffects: boolean;
}) {
  const canInteract = !disabled && value === null;
  const interactionProps =
    canInteract && animateEffects
      ? ({
          whileHover: { scale: 1.03, y: -2 } as const,
          whileTap: { scale: 0.96 } as const,
        } as const)
      : ({} as const);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={`Cell ${index + 1}`}
      disabled={!canInteract}
      {...interactionProps}
      className={[
        'relative aspect-square overflow-hidden rounded-[1.35rem] border text-4xl font-black sm:text-5xl',
        'bg-gradient-to-br from-white/12 to-white/6 backdrop-blur-xl',
        'border-white/15 text-white shadow-[0_16px_45px_rgba(15,23,42,0.18)]',
        canInteract
          ? animateEffects
            ? 'transition-all duration-300 hover:border-white/35 hover:bg-white/16 cursor-pointer'
            : 'transition-none cursor-pointer'
          : 'cursor-not-allowed',
        disabled ? 'opacity-70' : '',
        isWinning ? 'border-white/40 bg-white/18 shadow-[0_20px_60px_rgba(255,255,255,0.12)]' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isWinning && (
        <span className="absolute inset-0 rounded-[1.35rem] bg-white/10 ring-1 ring-inset ring-white/20" />
      )}
      <CellMark value={value} cellIndex={index} isWinning={isWinning} animateEffects={animateEffects} />
      <span className="sr-only">{value ?? ''}</span>
    </motion.button>
  );
}

export function TicTacToePage() {
  const [board, setBoard] = useState<BoardState>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [scores, setScores] = useState<ScoreState>({ X: 0, O: 0, draws: 0 });
  const prefersReducedMotion = usePrefersReducedMotion();
  const [effectsEnabled, setEffectsEnabled] = useBooleanPreference(EFFECTS_STORAGE_KEY, true);
  const animateEffects = effectsEnabled;
  const celebratedWinnerRef = useRef<Player | null>(null);

  const outcome = useMemo(() => calculateOutcome(board), [board]);
  const gameOver = outcome.winner !== null || outcome.isDraw;

  useEffect(() => {
    const winner = outcome.winner;
    if (!winner) {
      celebratedWinnerRef.current = null;
      return;
    }

    setScores((prev) => ({
      ...prev,
      [winner]: prev[winner] + 1,
    }));
  }, [outcome.winner]);

  useEffect(() => {
    const { isDraw, winner } = outcome;
    if (!isDraw || winner) {
      return;
    }

    setScores((prev) => ({
      ...prev,
      draws: prev.draws + 1,
    }));
  }, [outcome.isDraw, outcome.winner]);

  useEffect(() => {
    if (!outcome.winner || !animateEffects || celebratedWinnerRef.current === outcome.winner) {
      if (outcome.winner && celebratedWinnerRef.current !== outcome.winner) {
        celebratedWinnerRef.current = outcome.winner;
        const reason = 'effects-disabled';
        logTicTacToeEffect(`confetti skipped reason=${reason} winner=${outcome.winner}`);
      }
      return;
    }

    celebratedWinnerRef.current = outcome.winner;
    const colors = outcome.winner === 'X' ? X_CONFETTI_COLORS : O_CONFETTI_COLORS;
    logTicTacToeEffect(
      `confetti triggered winner=${outcome.winner} effects=on reducedMotion=${prefersReducedMotion}`,
    );

    try {
      launchCelebrationBarrage(colors);
      logTicTacToeEffect(`confetti launched winner=${outcome.winner} bursts=3`);
    } catch (error) {
      const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      logTicTacToeEffect(`confetti failed winner=${outcome.winner} error=${detail}`);
    }
  }, [animateEffects, outcome.winner]);

  const handleCellClick = (index: number) => {
    if (board[index] || gameOver) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    const nextOutcome = calculateOutcome(nextBoard);
    if (!nextOutcome.winner && !nextOutcome.isDraw) {
      setCurrentPlayer((prev) => (prev === 'X' ? 'O' : 'X'));
    }
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
  };

  const resetMotionProps = animateEffects
    ? ({
        whileHover: { scale: 1.02, y: -1 } as const,
        whileTap: { scale: 0.97 } as const,
      } as const)
    : ({} as const);

  const effectToggleMotionProps = animateEffects
    ? ({
        whileHover: { scale: 1.02 } as const,
        whileTap: { scale: 0.98 } as const,
      } as const)
    : ({} as const);

  const statusTone = outcome.winner
    ? 'from-fuchsia-500/18 to-violet-500/12 border-fuchsia-200/25'
    : outcome.isDraw
      ? 'from-white/12 to-white/6 border-white/20'
      : currentPlayer === 'X'
        ? 'from-fuchsia-500/20 to-violet-500/12 border-fuchsia-200/25'
        : 'from-cyan-500/20 to-sky-500/12 border-cyan-200/25';

  const statusTitle = outcome.winner
    ? `Player ${outcome.winner} Wins!`
    : outcome.isDraw
      ? "It's a Draw!"
      : `Player ${currentPlayer}'s Turn`;

  const statusSubtitle = outcome.winner
    ? 'The board is locked while the celebration runs.'
    : outcome.isDraw
      ? 'Both sides played cleanly. Reset to start a new round.'
      : 'Make your next move on the board.';

  return (
    <Layout title="Tic-Tac-Toe" showBack>
      <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_26%),linear-gradient(135deg,#081225_0%,#182a54_48%,#090f1d_100%)] p-4 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom,_rgba(255,255,255,0.08),_transparent_42%)]" />

        <motion.div
          initial={animateEffects ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={animateEffects ? { duration: 0.45, ease: 'easeOut' } : { duration: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/75">
                <Sparkles className="h-3.5 w-3.5" />
                Browser-local match
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Tic-Tac-Toe
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">
                  A KGP-compliant, Figma-inspired game board with animated marks, responsive glass
                  panels, and reduced-motion-aware celebration effects.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <motion.button
                type="button"
                onClick={handleReset}
                {...resetMotionProps}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-white/18"
              >
                <RotateCcw className="h-4 w-4" />
                Reset board
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setEffectsEnabled(!effectsEnabled)}
                aria-pressed={effectsEnabled}
                title={
                  prefersReducedMotion
                    ? 'Your system prefers reduced motion, so animations stay limited even when effects are on.'
                    : 'Toggle confetti, motion, and hover effects on or off.'
                }
                {...effectToggleMotionProps}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:bg-white/18"
              >
                <Sparkles className="h-4 w-4" />
                Effects {effectsEnabled ? 'On' : 'Off'}
              </motion.button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <ScoreCard label="Player X" value={scores.X} tone="x" animated={animateEffects} />
                <ScoreCard label="Draws" value={scores.draws} tone="neutral" animated={animateEffects} />
                <ScoreCard label="Player O" value={scores.O} tone="o" animated={animateEffects} />
              </div>

              <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:p-6">
                <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_50%)]" />
                <div className="relative grid grid-cols-3 gap-3 sm:gap-4" aria-label="Tic-tac-toe board">
                  {board.map((value, index) => (
                    <BoardCell
                      key={index}
                      value={value}
                      index={index}
                      disabled={gameOver}
                      onClick={() => handleCellClick(index)}
                      isWinning={outcome.winningCells.includes(index)}
                      animateEffects={animateEffects}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.section
                  key={statusTitle}
                  role="status"
                  aria-live="polite"
                  initial={animateEffects ? { opacity: 0, y: 16 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={animateEffects ? { opacity: 0, y: -8 } : { opacity: 0 }}
                  transition={animateEffects ? ({ duration: 0.3, ease: 'easeOut' as const } as const) : { duration: 0 }}
                  className={`rounded-[2rem] border bg-gradient-to-br p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl ${statusTone}`}
                >
                  <div className="flex items-center gap-3">
                    {outcome.winner ? (
                      <Trophy className="h-8 w-8 text-white/90" />
                    ) : (
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-full text-xl font-black ${
                          currentPlayer === 'X'
                            ? 'bg-gradient-to-br from-fuchsia-500 to-violet-500'
                            : 'bg-gradient-to-br from-cyan-500 to-sky-500'
                        }`}
                      >
                        {currentPlayer}
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{statusTitle}</h2>
                      <p className="mt-1 text-sm leading-6 text-white/74">{statusSubtitle}</p>
                    </div>
                  </div>
                </motion.section>
              </AnimatePresence>

              <div className="rounded-[2rem] border border-white/15 bg-white/8 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-white/65">
                  Match notes
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-white/75">
                  <li>Player X always starts and turns alternate after every valid move.</li>
                  <li>Winning cells glow and lock the board as soon as a line is completed.</li>
                  <li>Use the Effects button to toggle confetti, animations, and hover feedback.</li>
                  <li>Reduced motion still soft-disables effects even when the toggle is on.</li>
                </ul>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
