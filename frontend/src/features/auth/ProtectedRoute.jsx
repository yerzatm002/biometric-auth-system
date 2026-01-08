import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "./authStore";
import { tokenService } from "./tokenService";

export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isFaceVerified = useAuthStore((s) => s.isFaceVerified);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Если токен истёк — разлогиниваем
  if (isAuthenticated && tokenService.isTokenExpired?.()) {
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // Нет токена — нет доступа
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Токен есть, но Face verify не пройден — нет доступа
  if (!isFaceVerified) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
