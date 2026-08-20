import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { City } from "@/lib/cities";
import { PHASE_STYLE, getSunState } from "@/lib/sun";
import { formatLocalTime, utcOffsetLabel } from "@/lib/time";
import { HorizonArc } from "./HorizonArc";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const DAY_MS = 86400000;

export function useArcSampler(city: City, progress: number, isDay: boolean, span: number) {
  const t0 = Date.now();
  return useCallback(() => {
    const drift = (Date.now() - t0) / span;
    return Math.min(1, Math.max(0, progress + drift));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id, progress, isDay, span]);
}

type Props = {
  city: City;
  now: Date;
  onExpand: () => void;
  onRemove: () => void;
};

export function CityPanel({ city, now, onExpand, onRemove }: Props) {
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);

  const state = useMemo(
    () => getSunState(city.lat, city.lng, now),
    // recompute at most every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [city.id, Math.floor(now.getTime() / 60000)],
  );
  const style = PHASE_STYLE[state.phase];

  const dayLength =
    state.sunrise && state.sunset ? state.sunset.getTime() - state.sunrise.getTime() : DAY_MS / 2;
  const span = state.isDay ? dayLength : Math.max(DAY_MS - dayLength, 60000);
  const sample = useArcSampler(city, state.arcProgress, state.isDay, span);

  const ink = style.bright ? "text-[#1B1E2C]" : "text-[#F2F0EC]";
  const inkSoft = style.bright ? "text-[#1B1E2C]/65" : "text-[#F2F0EC]/62";

  return (
    <motion.div
      layoutId={`panel-${city.id}`}
      className="group relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, ease: [0.22, 0.8, 0.2, 1] }}
      whileHover={{ y: reduced ? 0 : -6 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onExpand}
        aria-label={`Expand ${city.name}, local time ${formatLocalTime(city.tz, now)}`}
        className="relative block w-full overflow-hidden rounded-2xl text-left ring-offset-2 ring-offset-[#14141A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B85C]"
        style={{ aspectRatio: "3 / 4" }}
      >
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ background: style.gradient }}
          transition={{ duration: reduced ? 0 : 180, ease: "linear" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.22),transparent_60%)]" />

        <div className="relative flex h-full flex-col p-4 sm:p-5">
          <p className={`font-ui text-[10px] uppercase tracking-[0.2em] ${inkSoft}`}>
            {city.region}
          </p>
          <h2 className={`font-display text-xl font-medium leading-tight sm:text-2xl ${ink}`}>
            {city.name}
          </h2>

          <p className={`mt-3 font-mono text-3xl tabular-nums tracking-tight sm:text-4xl ${ink}`}>
            {formatLocalTime(city.tz, now, hovered)}
          </p>

          <p className={`mt-2 font-ui text-[11px] leading-relaxed ${inkSoft}`}>{state.context}</p>

          <motion.div
            className="overflow-hidden"
            initial={false}
            animate={{ height: hovered ? 22 : 0, opacity: hovered ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: "easeOut" }}
          >
            <p className={`pt-1 font-mono text-[10px] tracking-tight ${inkSoft}`}>
              {state.sunrise ? formatLocalTime(city.tz, state.sunrise) : "--:--"} /{" "}
              {state.sunset ? formatLocalTime(city.tz, state.sunset) : "--:--"} ·{" "}
              {utcOffsetLabel(city.tz, now)}
            </p>
          </motion.div>

          <div className="mt-auto -mx-4 -mb-4 sm:-mx-5 sm:-mb-5">
            <HorizonArc
              progress={state.arcProgress}
              isDay={state.isDay}
              bright={style.bright}
              sample={sample}
              height={96}
              className="h-24 w-full"
            />
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${city.name}`}
        className="absolute right-2 top-2 rounded-full p-1.5 opacity-0 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B85C] group-hover:opacity-100"
      >
        <X className={`h-3.5 w-3.5 ${style.bright ? "text-[#1B1E2C]/70" : "text-[#F2F0EC]/70"}`} />
      </button>
    </motion.div>
  );
}
