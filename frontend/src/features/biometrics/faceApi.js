import { apiClient } from "../../shared/api/apiClient";

export const faceApi = {
  faceEnroll: async ({ userId, file }) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient.post(
      `/biometrics/face/enroll?user_id=${userId}`,
      formData
    );

    return res.data;
  },

  faceVerifyMultiFrame: async ({ userId, files }) => {
    const formData = new FormData();

    // ✅ строго по порядку:
    // 0 - прямой кадр
    // 1 - кадр с поворотом
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await apiClient.post(
      `/biometrics/face/verify-multiframe?user_id=${userId}`,
      formData
    );

    return res.data;
  },
};
