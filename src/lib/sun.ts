const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
const DAY = 86400000;

const toJulian = (date: Date) => date.valueOf() / DAY - 0.5 + J1970;
const fromJulian = (j: number) => new Date((j + 0.5 - J1970) * DAY);

export type SunTimes = {
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
  /** "day" or "night" when the sun never sets / never rises */
  polar: "day" | "night" | null;
};

/** Simplified NOAA/SunCalc solar event solver. No network, no key. */
export function computeSunTimes(lat: number, lng: number, date = new Date()): SunTimes {
  const d = toJulian(date) - J2000;
  const lw = -lng * RAD;
  const phi = lat * RAD;
  const n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const ds = 0.0009 + lw / (2 * Math.PI) + n;
  const M = (357.5291 + 0.98560028 * ds) * RAD;
  const C = (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) * RAD;
  const P = 102.9372 * RAD;
  const L = M + C + P + Math.PI;
  const jTransit = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const dec = Math.asin(Math.sin(L) * Math.sin(23.44 * RAD));
  const h0 = -0.833 * RAD;
  const cosW = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec));

  const solarNoon = fromJulian(jTransit);
  if (cosW > 1) return { sunrise: null, sunset: null, solarNoon, polar: "night" };
  if (cosW < -1) return { sunrise: null, sunset: null, solarNoon, polar: "day" };

  const w = Math.acos(cosW);
  const jSet =
    J2000 +
    (0.0009 + (w + lw) / (2 * Math.PI) + n) +
    0.0053 * Math.sin(M) -
    0.0069 * Math.sin(2 * L);
  const jRise = jTransit - (jSet - jTransit);
  return { sunrise: fromJulian(jRise), sunset: fromJulian(jSet), solarNoon, polar: null };
}

export type Phase = "night" | "predawn" | "sunrise" | "midday" | "golden" | "dusk";

export type PhaseStyle = {
  label: string;
  gradient: string;
  /** true when panel content should be dark ink on a bright sky */
  bright: boolean;
};

const grad = (a: string, b: string, c: string) =>
  `linear-gradient(175deg, ${a} 0%, ${b} 52%, ${c} 100%)`;

export const PHASE_STYLE: Record<Phase, PhaseStyle> = {
  night: { label: "Deep night", gradient: grad("#0B0D1F", "#12102E", "#1A1440"), bright: false },
  predawn: { label: "Blue hour", gradient: grad("#232A52", "#363A66", "#4A4E7C"), bright: false },
  sunrise: { label: "Sunrise", gradient: grad("#8FA9C9", "#F7D794", "#F2A65A"), bright: true },
  midday: { label: "Midday", gradient: grad("#7FC4E8", "#A6D6EF", "#C9E8F5"), bright: true },
  golden: { label: "Golden hour", gradient: grad("#F2C078", "#F2A860", "#F2914B"), bright: true },
  dusk: { label: "Dusk", gradient: grad("#3D2C5A", "#5C3B6A", "#7A4B7A"), bright: false },
};

const MIN = 60000;

export type SunState = {
  phase: Phase;
  /** 0..1 across the arc, left horizon to right horizon */
  arcProgress: number;
  isDay: boolean;
  /** plain-language context line */
  context: string;
  sunrise: Date | null;
  sunset: Date | null;
};

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function humanDuration(ms: number) {
  const mins = Math.max(1, Math.round(ms / MIN));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function getSunState(lat: number, lng: number, now = new Date()): SunState {
  const today = computeSunTimes(lat, lng, now);
  const t = now.getTime();

  if (today.polar || !today.sunrise || !today.sunset) {
    const isDay = today.polar === "day";
    return {
      phase: isDay ? "midday" : "night",
      arcProgress: clamp01(((t % DAY) / DAY + 0.5) % 1),
      isDay,
      context: isDay ? "The sun does not set today" : "The sun does not rise today",
      sunrise: null,
      sunset: null,
    };
  }

  const rise = today.sunrise.getTime();
  const set = today.sunset.getTime();
  const isDay = t >= rise && t <= set;

  let arcProgress: number;
  if (isDay) {
    arcProgress = clamp01((t - rise) / (set - rise));
  } else if (t > set) {
    const nextRise = computeSunTimes(lat, lng, new Date(t + DAY)).sunrise?.getTime() ?? rise + DAY;
    arcProgress = clamp01((t - set) / Math.max(1, nextRise - set));
  } else {
    const prevSet = computeSunTimes(lat, lng, new Date(t - DAY)).sunset?.getTime() ?? set - DAY;
    arcProgress = clamp01((t - prevSet) / Math.max(1, rise - prevSet));
  }

  let phase: Phase;
  if (t < rise - 75 * MIN || t > set + 80 * MIN) phase = "night";
  else if (t < rise - 18 * MIN) phase = "predawn";
  else if (t < rise + 45 * MIN) phase = "sunrise";
  else if (t > set - 5 * MIN) phase = "dusk";
  else if (t > set - 65 * MIN) phase = "golden";
  else phase = "midday";

  let context: string;
  if (isDay) {
    const toSet = set - t;
    context =
      phase === "golden" || phase === "sunrise"
        ? `${PHASE_STYLE[phase].label} · sunset in ${humanDuration(toSet)}`
        : `Daylight · sunset in ${humanDuration(toSet)}`;
  } else {
    const nextRise =
      t > set
        ? (computeSunTimes(lat, lng, new Date(t + DAY)).sunrise?.getTime() ?? rise + DAY)
        : rise;
    context =
      phase === "dusk" || phase === "predawn"
        ? `${PHASE_STYLE[phase].label} · sunrise in ${humanDuration(nextRise - t)}`
        : `${humanDuration(nextRise - t)} until sunrise`;
  }

  return { phase, arcProgress, isDay, context, sunrise: today.sunrise, sunset: today.sunset };
}
