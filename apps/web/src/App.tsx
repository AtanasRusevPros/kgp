import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { MenuPage } from './pages/MenuPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { buildGameRoutes } from './games/registry.js';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MenuPage />
      </ProtectedRoute>
    ),
  },
  ...buildGameRoutes(),
]);

export function App() {
  return <RouterProvider router={router} />;
}
