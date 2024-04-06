export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("nl", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
