import axios from "axios";
import { useAuthStore } from "../../features/auth/authStore";

// baseURL берём из .env (CRA)
const baseURL = process.env.REACT_APP_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // важно для refresh cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Флаг, чтобы избежать бесконечного refresh-loop
let isRefreshing = false;
let refreshSubscribers = [];

// Подписчики ожидают новый токен
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

/**
 * REQUEST interceptor:
 * Подставляем access_token, если он есть
 */
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE interceptor:
 * Если 401 — пытаемся refresh и повторяем запрос
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Если это не 401 — отдаём ошибку дальше
    if (status !== 401) {
      return Promise.reject(error);
    }

    // Если запрос на refresh уже сам 401 — логаут
    if (originalRequest.url?.includes("/auth/refresh")) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    // Чтобы повторно не заходить в refresh бесконечно
    if (originalRequest._retry) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Если refresh уже выполняется — подписываемся и ждём
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    // Иначе запускаем refresh
    isRefreshing = true;

    try {
      const refreshResponse = await apiClient.post("/auth/refresh");
      const newToken = refreshResponse.data.access_token;

      if (!newToken) {
        useAuthStore.getState().clearAuth();
        return Promise.reject(error);
      }

      // сохранить токен в store
      const currentUserId = useAuthStore.getState().userId;
      useAuthStore.getState().setAuth({
        accessToken: newToken,
        userId: currentUserId,
      });

      // уведомить всех ожидающих подписчиков
      onRefreshed(newToken);

      // повторить оригинальный запрос
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
