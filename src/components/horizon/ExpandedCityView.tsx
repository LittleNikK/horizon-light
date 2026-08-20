import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { City } from "@/lib/cities";
import { PHASE_STYLE, getSunState } from "@/lib/sun";
import { formatDayLabel, formatLocalTime, utcOffsetLabel } from "@/lib/time";
import { HorizonArc } from "./HorizonArc";
import { useArcSampler } from "./CityPanel";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

const DAY_MS = 86400000;

export function ExpandedCityView({
  city,
  now,
  onClose,
}: {
  city: City;
  now: Date;
  onClose: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const state = getSunState(city.lat, city.lng, now);
  const style = PHASE_STYLE[state.phase];
  const dayLength =
    state.sunrise && state.sunset ? state.sunset.getTime() - state.sunrise.getTime() : DAY_MS / 2;
  const span = state.isDay ? dayLength : Math.max(DAY_MS - dayLength, 60000);
  const sample = useArcSampler(city, state.arcProgress, state.isDay, span);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ink = style.bright ? "text-[#1B1E2C]" : "text-[#F2F0EC]";
  const inkSoft = style.bright ? "text-[#1B1E2C]/65" : "text-[#F2F0EC]/60";

  return (
    <motion.div
      layoutId={`panel-${city.id}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${city.name} ambient view`}
      className="fixed inset-0 z-50 overflow-hidden"
      transition={{ duration: reduced ? 0 : 0.6, ease: [0.22, 0.8, 0.2, 1] }}
    >
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{ background: style.gradient }}
        transition={{ duration: reduced ? 0 : 180, ease: "linear" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_115%,rgba(0,0,0,0.25),transparent_65%)]" />

      <div className="relative flex h-full flex-col px-6 pb-0 pt-8 sm:px-12 sm:pt-12">
        <div className="flex items-start justify-between">
          <div>
            <p className={`font-ui text-[11px] uppercase tracking-[0.24em] ${inkSoft}`}>
              {city.region} · {formatDayLabel(city.tz, now)}
            </p>
            <h2 className={`font-display text-3xl font-medium sm:text-5xl ${ink}`}>{city.name}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className={`rounded-full border border-current/25 px-4 py-1.5 font-ui text-xs transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B85C] ${inkSoft}`}
          >
            Close
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <p
            className={`font-mono text-[15vw] leading-none tabular-nums tracking-tighter sm:text-[13vw] ${ink}`}
          >
            {formatLocalTime(city.tz, now, true)}
          </p>
          <p className={`mt-6 font-ui text-sm ${inkSoft}`}>{state.context}</p>
          <p className={`mt-2 font-mono text-[11px] ${inkSoft}`}>
            {state.sunrise ? formatLocalTime(city.tz, state.sunrise) : "--:--"} /{" "}
            {state.sunset ? formatLocalTime(city.tz, state.sunset) : "--:--"} ·{" "}
            {utcOffsetLabel(city.tz, now)}
          </p>
        </div>

        <HorizonArc
          progress={state.arcProgress}
          isDay={state.isDay}
          bright={style.bright}
          sample={sample}
          height={220}
          className="h-[36vh] w-full"
        />
      </div>
    </motion.div>
  );
}
