import { registerTicTacToeBackendAdapter } from '@kids-games/tic-tac-toe-backend-adapter';
import type { BackendGameAdapter } from '../modules/game-adapter-loader.js';

const TIC_TAC_TOE_GAME_ID = 'tic-tac-toe';

export const ticTacToeBackendAdapter: BackendGameAdapter = {
  gameId: TIC_TAC_TOE_GAME_ID,
  register: registerTicTacToeBackendAdapter,
};
