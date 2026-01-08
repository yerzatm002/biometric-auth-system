import { useState } from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";

import { authApi } from "../../features/auth/authApi";
import { useAuthStore } from "../../features/auth/authStore";
import { getErrorMessage } from "../../shared/utils/errors";

export default function CredentialsLogin({ onSuccess }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const validate = () => {
    if (!email || !email.includes("@")) {
      setMessage("Email дұрыс енгізіңіз.");
      return false;
    }
    if (!password || password.length < 6) {
      setMessage("Құпиясөз кемінде 6 таңбадан тұруы керек.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setMessage("");

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.login({ email, password });

      // backend: { access_token, token_type }
      if (res?.access_token) {
        setAuth({ accessToken: res.access_token }); 
        onSuccess?.();
        return;
      }

      setMessage("Кіру сәтсіз. Қайтадан байқап көріңіз.");
    } catch (err) {
      const status = err?.response?.status;

      if (status === 401) {
        setMessage("Email немесе құпиясөз қате.");
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
        Аккаунт арқылы кіру
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Email және құпиясөзді енгізіңіз. Кейін Face тексеру іске қосылады.
      </Typography>

      <Box sx={{ display: "grid", gap: 2 }}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          autoComplete="email"
        />

        <TextField
          label="Құпиясөз"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          autoComplete="current-password"
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
