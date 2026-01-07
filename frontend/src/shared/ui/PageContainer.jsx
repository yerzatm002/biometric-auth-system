import { Container, Box } from "@mui/material";

export default function PageContainer({ children }) {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>{children}</Box>
    </Container>
  );
}
