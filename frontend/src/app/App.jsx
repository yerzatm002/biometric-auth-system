import { ThemeProvider, CssBaseline } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { theme } from "./theme";
import { router } from "./router";
import { ToastProvider } from "../shared/ui/ToastProvider";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  );
}
