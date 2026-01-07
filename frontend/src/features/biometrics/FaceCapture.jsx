import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Alert,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

export default function FaceCapture({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let currentStream = null;

    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        currentStream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        setCameraError("Камераға қол жеткізу мүмкін емес немесе рұқсат берілмеді.");
        setHelpOpen(true);
      }
    }

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleLoaded = () => setCameraReady(true);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "face.jpg", { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(blob);
        onCapture({ file, previewUrl });
      },
      "image/jpeg",
      0.95
    );
  };

  return (
    <Box>
      {cameraError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {cameraError}
        </Alert>
      ) : null}

      <Box
        sx={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "grey.200",
          bgcolor: "black",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onLoadedData={handleLoaded}
          style={{ width: "100%", height: "auto" }}
        />
      </Box>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Жарық жақсы болсын және бетіңіз кадрдың ортасында болсын.
        </Typography>
      </Box>

      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="outlined"
          onClick={capture}
          disabled={!cameraReady || !!cameraError}
        >
          Фото түсіру
        </Button>

        {cameraError ? (
          <Button variant="text" onClick={() => setHelpOpen(true)}>
            Қалай рұқсат беремін?
          </Button>
        ) : null}
      </Box>

      {/* Камераға рұқсат туралы көмек */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
        <DialogTitle>Камераға рұқсат қажет</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Камераға қол жеткізу үшін браузерде осы сайтқа камера рұқсатын беріңіз:
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <b>Chrome:</b> Адрес жолағындағы құлып белгісі → Site settings →
            Camera → Allow.
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            <b>Edge:</b> Құлып белгісі → Permissions → Camera → Allow.
          </Typography>

          <Typography variant="body2">
            Рұқсат бергеннен кейін бетті қайта жүктеңіз (F5).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>Түсіндім</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
