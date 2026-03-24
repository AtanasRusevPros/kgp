import type { ReactElement } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute.js';

export interface WebGameRoute {
  path: string;
  routeId: string;
  element: ReactElement;
  requiresAuth: boolean;
}

export interface WebGameModule {
  id: string;
  routeBase: string;
  routes: WebGameRoute[];
}

export function buildRoutesFromModules(modules: WebGameModule[]): RouteObject[] {
  return modules
    .map((game) =>
      game.routes.map((route) => ({
        path: route.path,
        element: route.requiresAuth ? (
          <ProtectedRoute>{route.element}</ProtectedRoute>
        ) : (
          route.element
        ),
      })),
    )
    .flat();
}
