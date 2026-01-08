import { useState } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
} from "@mui/material";

import PageContainer from "../../shared/ui/PageContainer";
import StepConsent from "./steps/StepConsent";
import StepCredentials from "./steps/StepCredentials";
import StepPin from "./steps/StepPin";
import StepFaceEnroll from "./steps/StepFaceEnroll";

import { authApi } from "../../features/auth/authApi";
import { useAuthStore } from "../../features/auth/authStore";
import { getErrorMessage } from "../../shared/utils/errors";

const steps = ["Келісім", "Деректер", "PIN-код", "Face ID"];

export default function RegisterPage() {
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    consentAccepted: false,
    email: "",
    password: "",
    pin: "",
  });

  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  const setAuth = useAuthStore((s) => s.setAuth);

  const goNext = () => {
    setError("");
    setActiveStep((prev) => prev + 1);
  };

  const goBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  /**
   * После StepPin:
   * 1) register -> получаем userId
   * 2) login -> получаем access_token
   * 3) setAuth(token) -> userId извлечётся из JWT (sub)
   * 4) идём в FaceEnroll
   */
  const handleSubmitRegister = async (pin) => {
    setError("");

    try {
      // ✅ Подстрахуем pin (строка, 4 цифры)
      const safePin = String(pin || "").trim();

      if (!/^\d{4}$/.test(safePin)) {
        throw new Error("PIN дұрыс емес. 4 цифр енгізіңіз.");
      }

      // 1) REGISTER (без pin!)
      const registerPayload = {
        email: formData.email,
        password: formData.password,
      };

      const registerRes = await authApi.register(registerPayload);
      const newUserId = registerRes?.id;

      if (!newUserId) {
        throw new Error("Register response ішінде user id жоқ.");
      }
      setUserId(newUserId);

      // 2) LOGIN сразу после регистрации (чтобы получить Bearer token)
      const loginRes = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      if (!loginRes?.access_token) {
        throw new Error("Login token алынбады. Backend login endpoint тексеріңіз.");
      }

      // сохраняем токен
      setAuth({ accessToken: loginRes.access_token });

      // 3) SET PIN — ✅ pin берём НЕ из state, а из аргумента
      await authApi.setPin({
        user_id: newUserId,
        pin: safePin,
      });

      // 4) переход к FaceEnroll
      goNext();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };



  const handleFinish = () => {
    setActiveStep(0);
    setFormData({
      consentAccepted: false,
      email: "",
      password: "",
      pin: "",
    });

    window.location.href = "/login";
  };

  return (
    <PageContainer>
      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            Тіркелу
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {/* ===== Steps ===== */}
          {activeStep === 0 && (
            <StepConsent
              value={formData.consentAccepted}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, consentAccepted: val }))
              }
              onNext={goNext}
              onError={(msg) => setError(msg)}
            />
          )}

          {activeStep === 1 && (
            <StepCredentials
              defaultValues={{
                email: formData.email,
                password: formData.password,
              }}
              onBack={goBack}
              onNext={(values) => {
                setFormData((prev) => ({
                  ...prev,
                  email: values.email,
                  password: values.password,
                }));
                goNext();
              }}
            />
          )}

          {activeStep === 2 && (
            <StepPin
              defaultValues={{ pin: formData.pin }}
              onBack={goBack}
              onNext={(values) => {
                setFormData((prev) => ({ ...prev, pin: values.pin }));
                handleSubmitRegister(values.pin);
              }}
            />
          )}

          {activeStep === 3 && (
            <StepFaceEnroll
              userId={userId}
              onBack={goBack}
              onFinish={handleFinish}
              onError={(msg) => setError(msg)}
            />
          )}

          {activeStep > 3 && (
            <Box sx={{ mt: 2 }}>
              <Typography>Тіркелу аяқталды.</Typography>
              <Button variant="contained" onClick={handleFinish}>
                Кіру бетіне өту
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
