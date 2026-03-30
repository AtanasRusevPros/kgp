import { registerSnakeClassicBackendAdapter } from '@kids-games/snake-classic-backend-adapter'
import type { BackendGameAdapter } from '../modules/game-adapter-loader.js'

const SNAKE_CLASSIC_GAME_ID = 'snake-classic'

export const snakeClassicBackendAdapter: BackendGameAdapter = {
  gameId: SNAKE_CLASSIC_GAME_ID,
  register: registerSnakeClassicBackendAdapter,
}
