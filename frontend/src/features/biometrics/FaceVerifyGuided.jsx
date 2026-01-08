import { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stack,
} from "@mui/material";

function captureFromVideo(videoRef) {
  const video = videoRef.current;
  if (!video) return null;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return resolve(null);
        resolve({
          file: new File([blob], "frame.jpg", { type: "image/jpeg" }),
          previewUrl: URL.createObjectURL(blob),
        });
      },
      "image/jpeg",
      0.95
    );
  });
}

export default function FaceVerifyGuided({ onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [step, setStep] = useState(1); // 1 = straight, 2 = rotated, 3 = ready
  const [countdown, setCountdown] = useState(0);
  const [capturing, setCapturing] = useState(false);

  const [photo1, setPhoto1] = useState(null); // {file, previewUrl}
  const [photo2, setPhoto2] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError("Камераға қол жеткізу мүмкін емес немесе рұқсат берілмеді.");
      }
    }

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // countdown + auto capture
  const startCountdownAndCapture = async (targetStep) => {
    if (!videoRef.current) return;

    setCapturing(true);
    setCountdown(3);

    for (let i = 3; i > 0; i--) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 1000));
      setCountdown(i - 1);
    }

    const shot = await captureFromVideo(videoRef);
    if (!shot) {
      setCapturing(false);
      return;
    }

    if (targetStep === 1) {
      setPhoto1(shot);
      setStep(2);
    } else {
      setPhoto2(shot);
      setStep(3);
    }

    setCapturing(false);
  };

  const resetAll = () => {
    setStep(1);
    setPhoto1(null);
    setPhoto2(null);
    setCountdown(0);
    setCapturing(false);
  };

  const submit = () => {
    if (!photo1?.file || !photo2?.file) return;

    // ✅ строго по порядку:
    // 1 = прямо
    // 2 = поворот
    onComplete([photo1.file, photo2.file]);
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
          style={{ width: "100%", height: "auto" }}
        />
      </Box>

      {capturing ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Фото {step} түсіруге дайындалыңыз... {countdown}s
          </Typography>
          <LinearProgress />
        </Box>
      ) : null}

      {/* INSTRUCTIONS */}
      {!capturing && step === 1 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          1-қадам: Камераға тура қараңыз (3 секундтан кейін фото түсіріледі).
        </Alert>
      ) : null}

      {!capturing && step === 2 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          2-қадам: Басыңызды солға немесе оңға бұрыңыз (3 секундтан кейін фото түсіріледі).
        </Alert>
      ) : null}

      {!capturing && step === 3 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          Екі фото дайын. Енді тексеруге жіберіңіз.
        </Alert>
      ) : null}

      {/* PREVIEWS */}
      <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: "wrap" }}>
        {photo1?.previewUrl ? (
          <Box>
            <Typography variant="caption">Фото 1 (тура)</Typography>
            <Box
              component="img"
              src={photo1.previewUrl}
              alt="preview1"
              sx={{
                width: 160,
                height: 120,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            />
          </Box>
        ) : null}

        {photo2?.previewUrl ? (
          <Box>
            <Typography variant="caption">Фото 2 (бұрылу)</Typography>
            <Box
              component="img"
              src={photo2.previewUrl}
              alt="preview2"
              sx={{
                width: 160,
                height: 120,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
              }}
            />
          </Box>
        ) : null}
      </Stack>

      {/* BUTTONS */}
      <Box sx={{ mt: 3, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {step === 1 && (
          <Button
            variant="contained"
            onClick={() => startCountdownAndCapture(1)}
            disabled={capturing || !!cameraError}
          >
            Фото 1 түсіру (тура)
          </Button>
        )}

        {step === 2 && (
          <Button
            variant="contained"
            onClick={() => startCountdownAndCapture(2)}
            disabled={capturing || !!cameraError}
          >
            Фото 2 түсіру (бұрылу)
          </Button>
        )}

        {step === 3 && (
          <Button variant="contained" color="success" onClick={submit}>
            Тексеруге жіберу
          </Button>
        )}

        <Button variant="outlined" onClick={resetAll} disabled={capturing}>
          Қайта түсіру
        </Button>
      </Box>
    </Box>
  );
}
