import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            Biometric Auth
          </Typography>

          {isAuthPage ? (
            <Box>
              <Button color="inherit" onClick={() => navigate("/login")}>
                Кіру
              </Button>
              <Button color="inherit" onClick={() => navigate("/register")}>
                Регистрация
              </Button>
            </Box>
          ) : null}
        </Toolbar>
      </AppBar>

      <Outlet />
    </Box>
  );
}
