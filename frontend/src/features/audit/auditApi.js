import { apiClient } from "../../shared/api/apiClient";

export const auditApi = {
  getAudit: async () => {
    const res = await apiClient.get("/audit");
    return res.data;
  },
};
