export function getErrorMessage(err) {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.message ||
    err?.message ||
    "Белгісіз қате"
  );
}
