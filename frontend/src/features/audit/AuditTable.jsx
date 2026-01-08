import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Chip,
} from "@mui/material";

import { auditApi } from "./auditApi";
import { getErrorMessage } from "../../shared/utils/errors";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function formatStatus(value) {
  if (value === true) return "SUCCESS";
  if (value === false) return "FAILED";
  if (value === "success") return "SUCCESS";
  if (value === "failed") return "FAILED";
  return value ?? "-";
}

export default function AuditTable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let ignore = false;

    async function loadAudit() {
      setLoading(true);
      setError("");

      try {
        const data = await auditApi.getAudit();

        const items =
          Array.isArray(data) ? data : data?.items || data?.logs || [];

        if (!ignore) setRows(items);
      } catch (err) {
        const status = err?.response?.status;

        if (!ignore) {
          if (status === 404) {
            setError("Audit endpoint табылмады (/audit). Backend route-ты тексеріңіз.");
          } else {
            setError(getErrorMessage(err));
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAudit();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Жүктелуде...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Audit журналын жүктеу мүмкін болмады: {error}
      </Alert>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <Alert severity="info">
        Audit журналында әзірге ешқандай жазба жоқ.
      </Alert>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Пайдаланушы</TableCell>
            <TableCell>Оқиға</TableCell>
            <TableCell>Күні/Уақыты</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>Нәтиже</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, idx) => {
            const id = row.id ?? `${row.user_id ?? "u"}-${row.created_at ?? idx}-${idx}`;
            const status = formatStatus(row.status ?? row.success ?? row.result);

            return (
              <TableRow key={id}>
                <TableCell>{row.id ?? "-"}</TableCell>
                <TableCell>{row.user_id ?? row.userId ?? "-"}</TableCell>
                <TableCell>{row.event_type ?? row.event ?? row.action ?? "-"}</TableCell>
                <TableCell>
                  {formatDate(row.created_at ?? row.timestamp)}
                </TableCell>
                <TableCell>{row.ip_address ?? row.ip ?? "-"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={status}
                    color={status === "SUCCESS" ? "success" : status === "FAILED" ? "error" : "default"}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
