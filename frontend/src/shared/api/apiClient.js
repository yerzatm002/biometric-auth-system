import axios from "axios";
import { useAuthStore } from "../../features/auth/authStore";

// baseURL берём из .env (CRA)
const baseURL = process.env.REACT_APP_API_BASE_URL;

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    /**
     * Важно:
     * Если отправляем FormData — не ставим Content-Type вручную,
     * axios сам добавит правильный boundary.
     */
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * RESPONSE interceptor:
 * Если 401 — очищаем auth и отдаём ошибку дальше
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Токен недействителен или истёк → разлогиниваем
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(error);
  }
);
