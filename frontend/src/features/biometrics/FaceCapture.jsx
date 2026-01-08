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
  CircularProgress,
} from "@mui/material";

/**
 * FaceCapture
 * mode="single" -> 1 кадр (enroll)
 * mode="multiframe" -> 2 ключевых кадра (liveness):
 *   1) смотреть прямо
 *   2) повернуть голову в сторону
 * + опционально дополнительные кадры после поворота
 *
 * onCapture:
 * - single: ({ file, previewUrl })
 * - multiframe: ({ files, previewUrls })
 */
export default function FaceCapture({
  mode = "single",

  // Настройки liveness flow
  livenessTurnDirection = "right", // "right" | "left"
  firstShotDelayMs = 250,          // небольшая пауза перед первым снимком
  turnInstructionDelayMs = 1600,   // время дать пользователю повернуть голову
  extraFramesAfterTurn = 2,        // ещё кадры после поворота (0..3)
  extraFrameIntervalMs = 250,      // интервалы доп кадров

  onCapture,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [capturing, setCapturing] = useState(false);
  const [instruction, setInstruction] = useState("");

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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const captureSingleFrame = () =>
    new Promise((resolve) => {
      if (!videoRef.current || !canvasRef.current) return resolve(null);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(null);

          const file = new File([blob], `frame-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          const previewUrl = URL.createObjectURL(blob);
          resolve({ file, previewUrl });
        },
        "image/jpeg",
        0.95
      );
    });

  /**
   * Liveness multiframe capture:
   * 1) смотреть прямо -> кадр 1
   * 2) повернуть голову -> кадр 2
   * 3) опционально ещё кадры после поворота
   */
  const captureMultiFrameForLiveness = async () => {
    const files = [];
    const previewUrls = [];

    // Инструкция 1: прямо
    setInstruction("Смотрите прямо в камеру...");
    await sleep(firstShotDelayMs);

    const frame1 = await captureSingleFrame();
    if (frame1?.file) {
      files.push(frame1.file);
      previewUrls.push(frame1.previewUrl);
    }

    // Инструкция 2: поворот
    const dirText = livenessTurnDirection === "left" ? "солға" : "оңға";
    setInstruction(`Енді басыңызды ${dirText} бұрыңыз...`);
    await sleep(turnInstructionDelayMs);

    const frame2 = await captureSingleFrame();
    if (frame2?.file) {
      files.push(frame2.file);
      previewUrls.push(frame2.previewUrl);
    }

    // Дополнительные кадры после поворота (стабилизация)
    if (extraFramesAfterTurn > 0) {
      setInstruction("Ұстап тұрыңыз...");
      for (let i = 0; i < extraFramesAfterTurn; i++) {
        await sleep(extraFrameIntervalMs);
        const extra = await captureSingleFrame();
        if (extra?.file) {
          files.push(extra.file);
          previewUrls.push(extra.previewUrl);
        }
      }
    }

    setInstruction("");
    return { files, previewUrls };
  };

  const capture = async () => {
    if (!cameraReady || cameraError) return;

    setCapturing(true);
    try {
      if (mode === "single") {
        setInstruction("Смотрите прямо в камеру...");
        await sleep(250);

        const result = await captureSingleFrame();
        setInstruction("");
        if (!result) return;

        onCapture?.(result);
        return;
      }

      // multiframe liveness mode
      const result = await captureMultiFrameForLiveness();
      if (!result?.files?.length) return;

      onCapture?.(result);
    } finally {
      setCapturing(false);
      setInstruction("");
    }
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
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          onLoadedData={handleLoaded}
          style={{ width: "100%", height: "auto" }}
        />

        {instruction ? (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              p: 1,
              bgcolor: "rgba(0,0,0,0.55)",
            }}
          >
            <Typography variant="body2" color="white">
              {instruction}
            </Typography>
          </Box>
        ) : null}
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
          disabled={!cameraReady || !!cameraError || capturing}
          startIcon={capturing ? <CircularProgress size={18} /> : null}
        >
          {mode === "single" ? "Фото түсіру" : "Face тексеру"}
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
