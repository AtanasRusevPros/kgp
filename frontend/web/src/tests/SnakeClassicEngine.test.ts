import {
  createSnakeClassicRun,
  getTickMsForDifficulty,
  queueDirection,
  resolveFollowDirection,
  spawnApple,
  stepSnakeClassicRun,
  type SnakeClassicRunState,
} from '../../../../games/snake-classic/web/src/engine.js';

describe('Snake Classic engine', () => {
  it('advances the snake one cell per tick in the active direction', () => {
    const run = createSnakeClassicRun('normal', () => 0.25, 1_000);
    const nextRun = stepSnakeClassicRun(run, () => 0.25, 1_140);

    expect(nextRun.snake[0]).toEqual({ x: run.snake[0]!.x + 1, y: run.snake[0]!.y });
    expect(nextRun.snake).toHaveLength(run.snake.length);
    expect(nextRun.direction).toBe('right');
    expect(nextRun.status).toBe('running');
  });

  it('rejects a direct reverse input and keeps moving forward', () => {
    const run = createSnakeClassicRun('normal', () => 0.25, 1_000);
    const queued = queueDirection(run, 'left');
    const nextRun = stepSnakeClassicRun(queued, () => 0.25, 1_140);

    expect(queued.queuedDirection).toBe('right');
    expect(nextRun.direction).toBe('right');
    expect(nextRun.snake[0]).toEqual({ x: run.snake[0]!.x + 1, y: run.snake[0]!.y });
  });

  it('ends the run on wall collision', () => {
    const run: SnakeClassicRunState = {
      ...createSnakeClassicRun('slow', () => 0.25, 1_000),
      snake: [{ x: 49, y: 10 }, { x: 48, y: 10 }, { x: 47, y: 10 }, { x: 46, y: 10 }],
      direction: 'right',
      queuedDirection: 'right',
    };

    const nextRun = stepSnakeClassicRun(run, () => 0.25, 1_180);

    expect(nextRun.status).toBe('game-over');
    expect(nextRun.endedBy).toBe('wall');
  });

  it('ends the run on self collision', () => {
    const run: SnakeClassicRunState = {
      ...createSnakeClassicRun('slow', () => 0.25, 1_000),
      snake: [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 9, y: 11 },
        { x: 9, y: 10 },
        { x: 9, y: 9 },
      ],
      direction: 'down',
      queuedDirection: 'left',
      apple: { x: 20, y: 20 },
    };

    const nextRun = stepSnakeClassicRun(run, () => 0.25, 1_180);

    expect(nextRun.status).toBe('game-over');
    expect(nextRun.endedBy).toBe('self');
  });

  it('spawns apples only on empty cells', () => {
    const snake = Array.from({ length: 2_499 }, (_unused, index) => ({
      x: index % 50,
      y: Math.floor(index / 50),
    }));

    const apple = spawnApple(snake, () => 0.5);

    expect(apple).toEqual({ x: 49, y: 49 });
  });

  it('increments score and grows the snake when it eats an apple', () => {
    const run: SnakeClassicRunState = {
      ...createSnakeClassicRun('normal', () => 0.25, 1_000),
      apple: { x: 26, y: 25 },
    };

    const nextRun = stepSnakeClassicRun(run, () => 0.4, 1_140);

    expect(nextRun.score).toBe(1);
    expect(nextRun.applesEaten).toBe(1);
    expect(nextRun.snake).toHaveLength(run.snake.length + 1);
    expect(nextRun.apple).not.toEqual(run.apple);
  });

  it('applies the configured speedup cadence with a hard floor', () => {
    expect(getTickMsForDifficulty('slow', 0)).toBe(180);
    expect(getTickMsForDifficulty('slow', 5)).toBe(175);
    expect(getTickMsForDifficulty('normal', 10)).toBe(130);
    expect(getTickMsForDifficulty('fast', 100)).toBe(70);
  });

  it('resolves follow direction by dominant axis and keeps axis preference on ties', () => {
    expect(resolveFollowDirection({ x: 10, y: 10 }, { x: 14, y: 12 }, 'right')).toBe('right');
    expect(resolveFollowDirection({ x: 10, y: 10 }, { x: 8, y: 15 }, 'up')).toBe('down');
    expect(resolveFollowDirection({ x: 10, y: 10 }, { x: 13, y: 13 }, 'right')).toBe('right');
    expect(resolveFollowDirection({ x: 10, y: 10 }, { x: 13, y: 13 }, 'up')).toBe('down');
  });
});
