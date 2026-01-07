import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "../shared/ui/Layout";

import RegisterPage from "../pages/Register/RegisterPage";
import LoginPage from "../pages/Login/LoginPage";
import DashboardPage from "../pages/Dashboard/DashboardPage";

import ProtectedRoute from "../features/auth/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // default route
      { index: true, element: <Navigate to="/login" replace /> },

      // public routes
      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <LoginPage /> },

      // protected routes group
      {
        element: <ProtectedRoute />,
        children: [{ path: "dashboard", element: <DashboardPage /> }],
      },

      // fallback
      { path: "*", element: <Navigate to="/login" replace /> },
    ],
  },
]);
