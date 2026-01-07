import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
} from "@mui/material";
import PageContainer from "../../shared/ui/PageContainer";
import FaceLogin from "./FaceLogin";
import PinLogin from "./PinLogin";
import { useAuthStore } from "../../features/auth/authStore";

export default function LoginPage() {
  const [mode, setMode] = useState(0); // 0 = Face, 1 = PIN
  const [info, setInfo] = useState("");
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (!userId) {
      setInfo(
        "Ескерту: user_id сақталмаған. Кіру үшін user_id енгізу қажет болады."
      );
    } else {
      setInfo("");
    }
  }, [userId]);

  const switchToPin = (message) => {
    setMode(1);
    setInfo(message || "Бет арқылы тексеру сәтсіз. PIN арқылы кіріңіз.");
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

          <Tabs
            value={mode}
            onChange={(e, v) => setMode(v)}
            sx={{ mb: 2 }}
          >
            <Tab label="Face ID" />
            <Tab label="PIN-код" />
          </Tabs>

          <Box>
            {mode === 0 ? (
              <FaceLogin onFallbackToPin={switchToPin} />
            ) : (
              <PinLogin />
            )}
          </Box>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
