import { Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { GameUnavailablePage } from './pages/GameUnavailablePage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { buildGameRoutes } from './games/registry.js';

export const appRoutes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <MenuPage /> },
      ...buildGameRoutes().map((route) => ({
        ...route,
        path: route.path ? route.path.replace(/^\//, '') : route.path,
      })),
      { path: ':unsupportedGameId/*', element: <GameUnavailablePage /> },
    ],
  },
];

const router = createBrowserRouter(appRoutes);

export function App() {
  return <RouterProvider router={router} />;
}
