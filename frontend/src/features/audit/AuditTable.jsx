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
} from "@mui/material";

import { auditApi } from "./auditApi";
import { getErrorMessage } from "../../shared/utils/errors";

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

        // Backend response structure болуы мүмкін:
        // 1) массив: [{...}, {...}]
        // 2) объект: { items: [...] }
        // 3) объект: { logs: [...] }
        const items =
          Array.isArray(data) ? data : data?.items || data?.logs || [];

        if (!ignore) setRows(items);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
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

  // Универсал кесте: сервер қайтарып жатқан құрылымға тәуелсіз
  // Күтілетін өрістер болуы мүмкін: id, user_id, event_type, created_at, ip_address, status
  // Біз мүмкін болатын өрістерді шығарамыз:
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
          {rows.map((row, idx) => (
            <TableRow key={row.id ?? idx}>
              <TableCell>{row.id ?? "-"}</TableCell>
              <TableCell>{row.user_id ?? row.userId ?? "-"}</TableCell>
              <TableCell>{row.event_type ?? row.event ?? row.action ?? "-"}</TableCell>
              <TableCell>
                {row.created_at
                  ? new Date(row.created_at).toLocaleString()
                  : row.timestamp
                  ? new Date(row.timestamp).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell>{row.ip_address ?? row.ip ?? "-"}</TableCell>
              <TableCell>
                {row.status ?? row.success ?? row.result ?? "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
