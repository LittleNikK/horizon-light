import { useEffect, useMemo, useRef, useState } from "react";
import { CITY_CATALOG, type City } from "@/lib/cities";

export function AddCitySearch({
  selectedIds,
  onAdd,
}: {
  selectedIds: string[];
  onAdd: (city: City) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CITY_CATALOG.filter((c) => !selectedIds.includes(c.id))
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.region.toLowerCase().includes(q))
      .slice(0, 7);
  }, [query, selectedIds]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (city: City) => {
    onAdd(city);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-[260px]">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            pick(results[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Add city"
        aria-label="Add a city"
        aria-expanded={open}
        className="w-full rounded-full border border-[#2C2C36] bg-[#1C1C24] px-4 py-2 font-ui text-xs text-[#F2F0EC] placeholder:text-[#8E8C97] focus-visible:border-[#E8B85C]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8B85C]/40"
      />

      {open && results.length > 0 && (
        <ul className="absolute right-0 z-40 mt-2 w-full min-w-[240px] overflow-hidden rounded-xl border border-[#2C2C36] bg-[#1C1C24] py-1 shadow-2xl shadow-black/50">
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
                className={`flex w-full items-baseline justify-between px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E8B85C] ${
                  i === active ? "bg-[#2C2C36]" : ""
                }`}
              >
                <span className="font-display text-sm text-[#F2F0EC]">{c.name}</span>
                <span className="font-ui text-[10px] uppercase tracking-widest text-[#8E8C97]">
                  {c.region}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
