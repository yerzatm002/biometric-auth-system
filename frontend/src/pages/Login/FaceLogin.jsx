import { useMemo, useState } from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

import FaceCapture from "../../features/biometrics/FaceCapture";
import { faceApi } from "../../features/biometrics/faceApi";
import { useAuthStore } from "../../features/auth/authStore";
import { getErrorMessage } from "../../shared/utils/errors";

export default function FaceLogin({ onFallbackToPin }) {
  const navigate = useNavigate();

  // ✅ МІНЕ ОСЫ ЕКІ ЖОЛ — ҚАТЕНІ ЖОЯДЫ
  const storedUserId = useAuthStore((s) => s.userId);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [userIdInput, setUserIdInput] = useState(storedUserId || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultInfo, setResultInfo] = useState("");

  const effectiveUserId = useMemo(() => {
    const n = Number(userIdInput);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [userIdInput]);

  const handleCapture = ({ file, previewUrl }) => {
    setFile(file);
    setPreviewUrl(previewUrl);
    setResultInfo("");
  };

  const handleVerify = async () => {
    if (!effectiveUserId) {
      setResultInfo("user_id енгізіңіз (мысалы: 1).");
      return;
    }
    if (!file) {
      setResultInfo("Алдымен фото түсіріңіз.");
      return;
    }

    setLoading(true);
    setResultInfo("");

    try {
      const res = await faceApi.faceVerify({
        userId: effectiveUserId,
        file,
      });

      if (res?.verified && res?.access_token) {
        setAuth({ accessToken: res.access_token, userId: effectiveUserId });
        navigate("/dashboard", { replace: true });
        return;
      }

      onFallbackToPin("Face ID арқылы тексеру сәтсіз. PIN арқылы кіріңіз.");
    } catch (err) {
      setResultInfo(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Face ID арқылы кіру
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          label="user_id"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          fullWidth
        />
      </Box>

      <FaceCapture onCapture={handleCapture} />

      {previewUrl ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Алдын ала қарау:
          </Typography>
          <Box
            component="img"
            src={previewUrl}
            alt="preview"
            sx={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.200",
            }}
          />
        </Box>
      ) : null}

      {resultInfo ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {resultInfo}
        </Alert>
      ) : null}

      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={handleVerify} disabled={loading}>
          {loading ? "Тексерілуде..." : "Фото түсіріп тексеру"}
        </Button>

        <Button
          variant="outlined"
          onClick={() => onFallbackToPin("PIN арқылы кіріңіз.")}
        >
          PIN арқылы кіру
        </Button>
      </Box>
    </Box>
  );
}
