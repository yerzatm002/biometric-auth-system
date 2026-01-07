import { apiClient } from "../../shared/api/apiClient";

export const faceApi = {
  faceEnroll: async ({ userId, file }) => {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", file);

    const res = await apiClient.post("/biometrics/face/enroll", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },

  faceVerify: async ({ userId, file }) => {
    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", file);

    const res = await apiClient.post("/biometrics/face/verify", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};
