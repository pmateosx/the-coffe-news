const longDate = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatLongDate(date: Date): string {
  return longDate.format(date);
}
