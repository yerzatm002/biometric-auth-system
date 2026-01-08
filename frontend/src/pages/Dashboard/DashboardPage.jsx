import { Box, Card, CardContent, Typography, Button, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "../../features/auth/authStore";
import AuditTable from "../../features/audit/AuditTable";

export default function DashboardPage() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
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
