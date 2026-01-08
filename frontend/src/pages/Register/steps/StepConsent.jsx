import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
} from "@mui/material";
import { apiClient } from "../../../shared/api/apiClient";

const DEFAULT_TEXT =
  "Мен биометриялық деректерімді аутентификация мақсатында өңдеуге келісім беремін. " +
  "Сурет пен файл бастапқы түрде сақталмайды, тек шифрланған эмбеддингтер сақталады.";

export default function StepConsent({ value, onChange, onNext, onError }) {
  const [loading, setLoading] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [fetchInfo, setFetchInfo] = useState("");

  // Флаг: доступен ли consent API
  const [consentApiAvailable, setConsentApiAvailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadConsent() {
      try {
        const res = await apiClient.get("/consent", {
          signal: controller.signal,
        });

        setConsentApiAvailable(true);
        setConsentText(res.data?.text || DEFAULT_TEXT);
      } catch (err) {
        // Если запрос отменён — ничего не делаем
        if (controller.signal.aborted) return;

        // Если endpoint отсутствует или ошибка — используем дефолтный текст
        setConsentApiAvailable(false);
        setFetchInfo("Келісім мәтіні серверден алынбады. Әдепкі мәтін көрсетіледі.");
        setConsentText(DEFAULT_TEXT);
      }
    }

    loadConsent();
    return () => controller.abort();
  }, []);

  const handleAccept = async () => {
    if (!value) {
      onError("Жалғастыру үшін келісімді қабылдауыңыз керек.");
      return;
    }

    setLoading(true);
    try {
      // accept вызываем только если consent API доступен
      if (consentApiAvailable) {
        await apiClient.post("/consent/accept", { accepted: true });
      }
      onNext();
    } catch (err) {
      // Даже если accept упал — не блокируем регистрацию
      onNext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Биометриялық деректерді өңдеуге келісім
      </Typography>

      {fetchInfo ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {fetchInfo}
        </Alert>
      ) : null}

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "grey.50",
          border: "1px solid",
          borderColor: "grey.200",
          mb: 2,
          maxHeight: 220,
          overflow: "auto",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {consentText || "Келісім мәтіні жүктелуде..."}
        </Typography>
      </Box>

      <FormControlLabel
        control={
          <Checkbox checked={value} onChange={(e) => onChange(e.target.checked)} />
        }
        label="Мен келісемін және биометриялық деректерімді өңдеуге рұқсат беремін"
      />

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={!value || loading}
        >
          Жалғастыру
        </Button>
      </Box>
    </Box>
  );
}
