import { Box, Button, TextField, Typography, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

const schema = yup.object({
  pin: yup
    .string()
    .matches(/^\d{4}$/, "PIN дәл 4 цифрдан тұруы керек")
    .required("PIN міндетті"),
  confirmPin: yup
    .string()
    .oneOf([yup.ref("pin")], "PIN сәйкес келмейді")
    .required("PIN растау міндетті"),
});

export default function StepPin({ defaultValues, onBack, onNext }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { pin: defaultValues.pin || "", confirmPin: "" },
    resolver: yupResolver(schema),
  });

  const submit = (values) => onNext({ pin: values.pin });

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <Typography variant="h6" gutterBottom>
        PIN-код орнату
      </Typography>

      <Stack spacing={2}>
        <TextField
          label="PIN"
          type="password"
          inputProps={{ maxLength: 4, inputMode: "numeric" }}
          {...register("pin")}
          error={!!errors.pin}
          helperText={errors.pin?.message}
          fullWidth
        />

        <TextField
          label="PIN растау"
          type="password"
          inputProps={{ maxLength: 4, inputMode: "numeric" }}
          {...register("confirmPin")}
          error={!!errors.confirmPin}
          helperText={errors.confirmPin?.message}
          fullWidth
        />
      </Stack>

      <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
        <Button variant="outlined" onClick={onBack}>
          Артқа
        </Button>
        <Button variant="contained" type="submit" disabled={isSubmitting}>
          Тіркелу
        </Button>
      </Box>
    </Box>
  );
}
