import { createContext, useContext, useMemo, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    open: false,
    severity: "info",
    message: "",
  });

  const closeToast = () => setToast((t) => ({ ...t, open: false }));

  const api = useMemo(() => {
    return {
      showSuccess: (message) =>
        setToast({ open: true, severity: "success", message }),
      showError: (message) => setToast({ open: true, severity: "error", message }),
      showInfo: (message) => setToast({ open: true, severity: "info", message }),
      showWarning: (message) =>
        setToast({ open: true, severity: "warning", message }),
    };
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={closeToast}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={closeToast} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
