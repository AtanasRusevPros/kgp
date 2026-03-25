export interface TicTacToeRouteManifest {
  path: string;
  routeId: 'tic-tac-toe.board';
  requiresAuth: boolean;
}

export interface TicTacToeWebManifest {
  id: 'tic-tac-toe';
  routeBase: '/tic-tac-toe';
  routes: TicTacToeRouteManifest[];
}

export const ticTacToeWebManifest: TicTacToeWebManifest = {
  id: 'tic-tac-toe',
  routeBase: '/tic-tac-toe',
  routes: [
    {
      path: '/tic-tac-toe',
      routeId: 'tic-tac-toe.board',
      requiresAuth: true,
    },
  ],
};
