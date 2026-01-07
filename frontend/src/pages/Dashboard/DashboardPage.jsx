import { useState } from "react";

import { Box, Card, CardContent, Typography, Button, Alert, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import { authApi } from "../../features/auth/authApi";
import AuditTable from "../../features/audit/AuditTable";
import { getErrorMessage } from "../../shared/utils/errors";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userId, clearAuth } = useAuthStore((s) => ({
    userId: s.userId,
    clearAuth: s.clearAuth,
  }));

  const [logoutError, setLogoutError] = useState("");

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await authApi.logout();
    } catch (err) {
      // logout endpoint кейде cookie/сессия болмаған кезде error беруі мүмкін
      // сондықтан біз UI-ды бұзбаймыз, тек хабар көрсетеміз
      setLogoutError(getErrorMessage(err));
    } finally {
      // кез келген жағдайда токенді тазалаймыз
      clearAuth();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
        <Stack spacing={2}>
          {/* Статус карточкасы */}
          <Card>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                Жеке кабинет
              </Typography>

              <Typography variant="body1" sx={{ mb: 1 }}>
                Пайдаланушы ID: <b>{userId ?? "Белгісіз"}</b>
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Сіз жүйеге сәтті кірдіңіз. Мұнда кіру әрекеттерінің журналы көрсетіледі.
              </Typography>

              {logoutError ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Шығу кезінде қате: {logoutError}
                </Alert>
              ) : null}

              <Button variant="contained" color="error" onClick={handleLogout}>
                Шығу
              </Button>
            </CardContent>
          </Card>

          {/* Audit logs */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Кіру әрекеттерінің журналы (Audit Logs)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Соңғы әрекеттер тізімі төменде көрсетіледі.
              </Typography>

              <AuditTable />
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
