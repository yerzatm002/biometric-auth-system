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

export default function StepConsent({ value, onChange, onNext, onError }) {
  const [loading, setLoading] = useState(false);
  const [consentText, setConsentText] = useState("");
  const [fetchInfo, setFetchInfo] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadConsent() {
      try {
        const res = await apiClient.get("/consent");
        if (!ignore) setConsentText(res.data?.text || "");
      } catch (err) {
        // Бэкендтен келіспеген жағдайда UI бұзылмасын
        if (!ignore) {
          setFetchInfo(
            "Келісім мәтіні серверден алынбады. Әдепкі мәтін көрсетіледі."
          );
          setConsentText(
            "Мен биометриялық деректерімді аутентификация мақсатында өңдеуге келісім беремін. " +
              "Сурет пен файл бастапқы түрде сақталмайды, тек шифрланған эмбеддингтер сақталады."
          );
        }
      }
    }

    loadConsent();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAccept = async () => {
    if (!value) {
      onError("Жалғастыру үшін келісімді қабылдауыңыз керек.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/consent/accept", { accepted: true });
      onNext();
    } catch (err) {
      // accept endpoint жоқ болса да, тіркеуді тоқтатпаймыз
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
