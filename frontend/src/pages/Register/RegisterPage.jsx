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

  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

  const setAuth = useAuthStore((s) => s.setAuth);

  const goNext = () => {
    setError("");
    setActiveStep((prev) => prev + 1);
  };

  const goBack = () => {
    setError("");
    setActiveStep((prev) => prev - 1);
  };

  // StepPin аяқталғаннан кейін тіркеу request
  const handleSubmitRegister = async () => {
    setError("");
    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        pin: formData.pin,
      };

      const res = await authApi.register(payload); // {id, email}
      setUserId(res.id);

      // userId store-ға сақтаймыз
      setAuth({ accessToken: null, userId: res.id });

      goNext(); // Face Enroll қадамына өтеміз
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Face enroll аяқталғаннан кейін login бетіне өтеміз
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

          {/* ===== Қадамдар ===== */}
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
                handleSubmitRegister();
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
