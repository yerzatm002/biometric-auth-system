import { Box, Button, TextField, Typography, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  email: yup
    .string()
    .email("Email форматы дұрыс емес")
    .required("Email міндетті"),
  password: yup
    .string()
    .min(8, "Құпиясөз кемінде 8 таңбадан тұруы керек")
    .required("Құпиясөз міндетті"),
});

export default function StepCredentials({ defaultValues, onBack, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
    resolver: yupResolver(schema),
  });

  const submit = (values) => onNext(values);

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <Typography variant="h6" gutterBottom>
        Тіркеу деректері
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="Email"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
          fullWidth
        />

        <TextField
          label="Құпиясөз"
          type="password"
          {...register("password")}
          error={!!errors.password}
          helperText={errors.password?.message}
          fullWidth
        />
      </Stack>

      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        <Button variant="outlined" onClick={onBack}>
          Артқа
        </Button>
        <Button variant="contained" type="submit" disabled={isSubmitting}>
          Жалғастыру
        </Button>
      </Box>
    </Box>
  );
}
