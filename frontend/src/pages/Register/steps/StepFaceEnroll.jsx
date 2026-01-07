import { useState } from "react";
import { Box, Typography, Button, Alert } from "@mui/material";
import FaceCapture from "../../../features/biometrics/FaceCapture";
import { faceApi } from "../../../features/biometrics/faceApi";
import { getErrorMessage } from "../../../shared/utils/errors";

export default function StepFaceEnroll({ userId, onBack, onFinish, onError }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCapture = ({ file, previewUrl }) => {
    setFile(file);
    setPreviewUrl(previewUrl);
    setSuccess(false);
  };

  const handleEnroll = async () => {
    if (!userId) {
      onError("Пайдаланушы ID табылмады. Қайта тіркеліп көріңіз.");
      return;
    }
    if (!file) {
      onError("Алдымен фото түсіріңіз.");
      return;
    }

    setLoading(true);
    try {
      await faceApi.faceEnroll({ userId, file });
      setSuccess(true);
    } catch (err) {
      onError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Face ID тіркеу
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Камераға рұқсат беріңіз және бетіңіз анық көрінетіндей фото түсіріңіз.
      </Typography>

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

      {success ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Face ID сәтті тіркелді.
        </Alert>
      ) : null}

      <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={onBack}>
          Артқа
        </Button>

        <Button variant="contained" onClick={handleEnroll} disabled={loading}>
          {loading ? "Тіркелуде..." : "Face ID тіркеу"}
        </Button>

        {success ? (
          <Button variant="contained" color="success" onClick={onFinish}>
            Кіру бетіне өту
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}
