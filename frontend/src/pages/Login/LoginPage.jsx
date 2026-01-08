import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Button,
  Divider,
} from "@mui/material";

import PageContainer from "../../shared/ui/PageContainer";
import { useAuthStore } from "../../features/auth/authStore";

// ВАЖНО: ниже будут новые компоненты,
// я предложу их структуру, но чтобы переписать их точно,
// нужно будет прислать текущие FaceLogin.jsx и PinLogin.jsx
import CredentialsLogin from "./CredentialsLogin";
import FaceLogin from "./FaceLogin";
import PinLogin from "./PinLogin";

export default function LoginPage() {
  /**
   * steps:
   *  - "credentials": email/password -> token
   *  - "face": verify multiframe -> allow
   *  - "pin": fallback pin login
   */
  const [step, setStep] = useState("credentials");
  const [info, setInfo] = useState("");

  const userId = useAuthStore((s) => s.userId);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    // Если токена нет — всегда возвращаемся на credentials
    if (!accessToken) {
      setStep("credentials");
    }
  }, [accessToken]);

  const handleCredentialsSuccess = () => {
    // после /auth/login токен уже в store
    // userId будет извлечён из JWT (sub)
    setInfo("Енді Face тексеруден өтіңіз.");
    setStep("face");
  };

  const handleFaceSuccess = () => {
    setInfo("");
    // FaceLogin сам сделает setFaceVerified(true) и редирект (или можно тут)
  };

  const handleFaceFail = (message) => {
    setInfo(message || "Face тексеру сәтсіз. PIN арқылы кіріңіз.");
    setStep("pin");
  };

  const handlePinSuccess = () => {
    // Fallback PIN -> сразу доступ
    setInfo("");
    // PinLogin сам делает redirect
  };

  const handleRestart = () => {
    clearAuth();
    setInfo("");
    setStep("credentials");
  };

  return (
    <PageContainer>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Жүйеге кіру
          </Typography>

          {info ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              {info}
            </Alert>
          ) : null}

          {/* STEP: Credentials */}
          {step === "credentials" ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                1-қадам: Email және құпиясөз
              </Typography>

              <CredentialsLogin onSuccess={handleCredentialsSuccess} />
            </Box>
          ) : null}

          {/* STEP: Face verify */}
          {step === "face" ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                2-қадам: Face тексеру (liveness)
              </Typography>

              <FaceLogin
                onSuccess={handleFaceSuccess}
                onFallbackToPin={handleFaceFail}
              />

              <Divider sx={{ my: 2 }} />

              <Button variant="text" onClick={handleRestart}>
                Басынан бастау
              </Button>
            </Box>
          ) : null}

          {/* STEP: PIN fallback */}
          {step === "pin" ? (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Қосымша әдіс: PIN арқылы кіру
              </Typography>

              <PinLogin onSuccess={handlePinSuccess} />

              <Divider sx={{ my: 2 }} />

              <Button variant="text" onClick={() => setStep("face")}>
                Қайта Face арқылы тексеру
              </Button>

              <Button variant="text" onClick={handleRestart}>
                Басынан бастау
              </Button>
            </Box>
          ) : null}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
