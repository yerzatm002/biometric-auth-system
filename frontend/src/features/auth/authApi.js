import { apiClient } from "../../shared/api/apiClient";

export const authApi = {
  register: async (payload) => {
    const res = await apiClient.post("/auth/register", payload);
    return res.data;
  },

  login: async ({ email, password }) => {
    const res = await apiClient.post("/auth/login", { email, password });
    return res.data;
  },

  setPin: async ({ user_id, pin }) => {
    const res = await apiClient.post("/auth/set_pin", { user_id, pin });
    return res.data;
  },

  loginPin: async ({ user_id, pin }) => {
    const res = await apiClient.post("/auth/login/pin", { user_id, pin });
    return res.data;
  },

  refresh: async () => {
    const res = await apiClient.post("/auth/refresh");
    return res.data;
  },
};
