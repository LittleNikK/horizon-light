import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CITY_CATALOG, DEFAULT_CITY_IDS, findCity, type City } from "@/lib/cities";
import { localHourFraction, formatUTC } from "@/lib/time";
import { CityPanel } from "./CityPanel";
import { ExpandedCityView } from "./ExpandedCityView";
import { AddCitySearch } from "./AddCitySearch";

const STORAGE_KEY = "horizon.cities.v1";

/** null until mounted, so the server never renders a time that hydration can contradict */
function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function WorldClockGrid() {
  const nowOrNull = useNow();
  const now = nowOrNull ?? new Date(0);
  const mounted = nowOrNull !== null;
  const [ids, setIds] = useState<string[]>(DEFAULT_CITY_IDS);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        const valid = parsed.filter((id) => CITY_CATALOG.some((c) => c.id === id));
        if (valid.length) setIds(valid);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (next: string[]) => {
    setIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const cities = useMemo(() => {
    const list = ids.map(findCity).filter((c): c is City => Boolean(c));
    const minuteKey = Math.floor(now.getTime() / 60000) * 60000;
    const stamp = new Date(minuteKey);
    return list.sort((a, b) => localHourFraction(a.tz, stamp) - localHourFraction(b.tz, stamp));
  }, [ids, Math.floor(now.getTime() / 60000)]);

  const expandedCity = expanded ? cities.find((c) => c.id === expanded) : undefined;

  return (
    <LayoutGroup>
      <header className="sticky top-0 z-30 border-b border-[#2C2C36] bg-[#14141A]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-3.5 sm:px-8">
          <h1 className="font-display text-lg font-medium tracking-tight text-[#F2F0EC]">
            Horizon
          </h1>
          <p className="hidden font-mono text-[11px] tabular-nums text-[#8E8C97] sm:block">
            {mounted ? `${formatUTC(now)} UTC` : "--:--:-- UTC"}
          </p>
          <div className="ml-auto">
            <AddCitySearch selectedIds={ids} onAdd={(city) => persist([...ids, city.id])} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 sm:py-10">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {(mounted ? cities : []).map((city) => (
              <CityPanel
                key={city.id}
                city={city}
                now={now}
                onExpand={() => setExpanded(city.id)}
                onRemove={() => persist(ids.filter((id) => id !== city.id))}
              />
            ))}
          </AnimatePresence>
        </div>
        {mounted && cities.length === 0 && (
          <p className="py-24 text-center font-ui text-sm text-[#8E8C97]">
            Your board is empty — search above to add a city.
          </p>
        )}
      </main>

      <AnimatePresence>
        {expandedCity && (
          <ExpandedCityView
            key={expandedCity.id}
            city={expandedCity}
            now={now}
            onClose={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
