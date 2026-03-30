export interface SnakeClassicRouteManifest {
  path: '/snake-classic'
  routeId: 'snake-classic.board'
  requiresAuth: true
}

export interface SnakeClassicWebManifest {
  id: 'snake-classic'
  routeBase: '/snake-classic'
  routes: SnakeClassicRouteManifest[]
}

export const snakeClassicWebManifest: SnakeClassicWebManifest = {
  id: 'snake-classic',
  routeBase: '/snake-classic',
  routes: [
    {
      path: '/snake-classic',
      routeId: 'snake-classic.board',
      requiresAuth: true,
    },
  ],
}
