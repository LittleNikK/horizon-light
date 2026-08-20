const cache = new Map<string, Intl.DateTimeFormat>();

function fmt(tz: string, opts: Intl.DateTimeFormatOptions) {
  const key = tz + JSON.stringify(opts);
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts });
    cache.set(key, f);
  }
  return f;
}

export function formatLocalTime(tz: string, date: Date, withSeconds = false) {
  return fmt(tz, {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" as const } : {}),
    hour12: false,
  }).format(date);
}

export function formatDayLabel(tz: string, date: Date) {
  return fmt(tz, { weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** Local hour as a float, used for sorting panels soonest-to-latest. */
export function localHourFraction(tz: string, date: Date) {
  const parts = fmt(tz, { hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return (h % 24) + m / 60;
}

export function utcOffsetLabel(tz: string, date: Date) {
  const s = fmt(tz, { timeZoneName: "longOffset" }).format(date);
  const match = s.match(/GMT([+-]\d{2}:\d{2})?/);
  if (!match) return "UTC+00:00";
  return `UTC${match[1] ?? "+00:00"}`;
}

export function formatUTC(date: Date) {
  return formatLocalTime("UTC", date, true);
}
