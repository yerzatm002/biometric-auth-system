import { useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

import FaceVerifyGuided from "../../features/biometrics/FaceVerifyGuided";
import { faceApi } from "../../features/biometrics/faceApi";
import { useAuthStore } from "../../features/auth/authStore";
import { getErrorMessage } from "../../shared/utils/errors";

export default function FaceLogin({ onSuccess, onFallbackToPin }) {
  const navigate = useNavigate();

  const userId = useAuthStore((s) => s.userId);
  const setFaceVerified = useAuthStore((s) => s.setFaceVerified);

  const [loading, setLoading] = useState(false);
  const [resultInfo, setResultInfo] = useState("");

  const handleComplete = async (files) => {
    setResultInfo("");

    if (!userId) {
      setResultInfo("Қате: userId табылмады. Алдымен email/password арқылы кіріңіз.");
      return;
    }

    if (!files || files.length !== 2) {
      setResultInfo("Қате: 2 фото қажет (тура + бұрылу).");
      return;
    }

    setLoading(true);
    try {
      const res = await faceApi.faceVerifyMultiFrame({
        userId,
        files,
      });

      if (res?.verified) {
        setFaceVerified(true);
        onSuccess?.();
        navigate("/dashboard", { replace: true });
        return;
      }

      // если не прошел — fallback pin
      onFallbackToPin?.("Face тексеру өтпеді. PIN арқылы кіріңіз.");
    } catch (err) {
      setResultInfo(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Face ID арқылы кіру (liveness)
      </Typography>

      {resultInfo ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {resultInfo}
        </Alert>
      ) : null}

      {loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Тексерілуде...
        </Alert>
      ) : null}

      <FaceVerifyGuided onComplete={handleComplete} />
    </Box>
  );
}
