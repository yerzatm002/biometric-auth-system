import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../shared/ui/Layout";

import RegisterPage from "../pages/Register/RegisterPage";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";

import ProtectedRoute from "../features/auth/ProtectedRoute";
import { useAuthStore } from "../features/auth/authStore";

function PublicOnly({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isFaceVerified = useAuthStore((s) => s.isFaceVerified);


  if (isAuthenticated && isFaceVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/login" replace /> },

      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <PublicOnly><LoginPage /></PublicOnly> },

      {
        element: <ProtectedRoute />,
        children: [{ path: "dashboard", element: <DashboardPage /> }],
      },

      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);
