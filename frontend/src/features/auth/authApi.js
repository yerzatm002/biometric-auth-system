import { apiClient } from "../../shared/api/apiClient";

export const authApi = {
  register: async (payload) => {
    const res = await apiClient.post("/auth/register", payload);
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

  logout: async () => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },
};
