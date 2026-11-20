export function eventDay(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"].map((part) => parts.find((item) => item.type === part)?.value).join("-");
}

export function registrationIsOpen(value: string) {
  return eventDay(value) >= eventDay(new Date().toISOString());
}

export function formatEventDate(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota", dateStyle: "long", timeStyle: "short",
  });
}

export function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
