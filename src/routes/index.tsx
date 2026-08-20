import { createFileRoute } from "@tanstack/react-router";
import { WorldClockGrid } from "@/components/horizon/WorldClockGrid";

const title = "Horizon — an ambient world clock";
const description =
  "Twelve cities, twelve skies. Horizon shows each timezone as a living panel of real sunlight — dawn, midday, golden hour, deep night — right now.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-[#14141A]">
      <WorldClockGrid />
    </div>
  );
}
