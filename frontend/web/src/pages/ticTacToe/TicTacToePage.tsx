import { useState } from 'react';
import { Layout } from '../../components/Layout.js';

type CellValue = 'X' | 'O' | null;
type BoardState = CellValue[];

function calculateWinner(board: BoardState): CellValue {
  const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ] as const;

  for (const [a, b, c] of winningLines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function createEmptyBoard(): BoardState {
  return Array<CellValue>(9).fill(null);
}

export function TicTacToePage() {
  const [board, setBoard] = useState<BoardState>(() => createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleCellClick = (index: number) => {
    if (board[index] || winner) {
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);
    setCurrentPlayer((prev: 'X' | 'O') => (prev === 'X' ? 'O' : 'X'));
  };

  const handleReset = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
  };

  const statusText = winner
    ? `Player ${winner} wins!`
    : isDraw
      ? 'Draw game!'
      : `Current player: ${currentPlayer}`;

  return (
    <Layout title="Tic-Tac-Toe" showBack>
      <div className="max-w-3xl mx-auto">
        <div className="card mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Simple local game
              </p>
              <h1 className="text-3xl font-bold text-slate-800 mt-2">Tic-Tac-Toe</h1>
              <p className="text-slate-500 mt-2">
                A lightweight second game to validate the modular platform with no backend gameplay state.
              </p>
            </div>
            <button onClick={handleReset} className="btn-secondary self-start">
              Reset board
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="card">
            <div className="grid grid-cols-3 gap-3" aria-label="Tic-tac-toe board">
              {board.map((cell: CellValue, index: number) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCellClick(index)}
                  className="aspect-square rounded-2xl border border-slate-200 bg-slate-50 text-4xl font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-100"
                  aria-label={`Cell ${index + 1}`}
                  disabled={Boolean(cell) || Boolean(winner)}
                >
                  {cell}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Match status
            </h2>
            <p className="text-xl font-semibold text-slate-800 mt-3">{statusText}</p>
            <div className="mt-6 space-y-3 text-sm text-slate-500">
              <p>Player X always starts.</p>
              <p>Winning lines are reflected through the status text for now.</p>
              <p>No progress is stored yet; this game is intentionally browser-local.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
