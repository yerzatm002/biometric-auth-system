import { useMemo, useState } from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../features/auth/authApi";
import { useAuthStore } from "../../features/auth/authStore";
import { getErrorMessage } from "../../shared/utils/errors";

export default function PinLogin() {
  const navigate = useNavigate();
  const { userId: storedUserId, setAuth } = useAuthStore((s) => ({
    userId: s.userId,
    setAuth: s.setAuth,
  }));

  const [userIdInput, setUserIdInput] = useState(storedUserId || "");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const effectiveUserId = useMemo(() => {
    const n = Number(userIdInput);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [userIdInput]);

  const handleLogin = async () => {
    setMessage("");

    if (!effectiveUserId) {
      setMessage("user_id енгізіңіз (мысалы: 1).");
      return;
    }
    if (!pin || pin.length !== 4) {
      setMessage("PIN 4 цифрдан тұруы керек.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.loginPin({
        user_id: effectiveUserId,
        pin,
      });

      // backend: { success: true, access_token: "..." }
      if (res?.access_token) {
        setAuth({ accessToken: res.access_token, userId: effectiveUserId });
        navigate("/dashboard", { replace: true });
        return;
      }

      setMessage("Кіру сәтсіз. Қайтадан байқап көріңіз.");
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      // 401 Invalid PIN
      if (status === 401) {
        setMessage("PIN қате енгізілді. Қайтадан көріңіз.");
        return;
      }

      // 403 PIN temporarily locked
      if (status === 403) {
        setMessage(
          detail ||
            "PIN уақытша бұғатталды. 15 минуттан кейін қайтадан көріңіз."
        );
        return;
      }

      setMessage(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        PIN арқылы кіру
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        user_id және PIN кодты енгізіңіз.
      </Typography>

      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="user_id"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          fullWidth
          helperText="Мысалы: 1"
        />

        <TextField
          label="PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          inputProps={{ maxLength: 4, inputMode: "numeric" }}
          fullWidth
          helperText="PIN 4 цифрдан тұрады"
        />
      </Box>

      {message ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {message}
        </Alert>
      ) : null}

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleLogin} disabled={loading}>
          {loading ? "Кірілуде..." : "Кіру"}
        </Button>
      </Box>
    </Box>
  );
}
