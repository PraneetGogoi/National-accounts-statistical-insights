import { Link } from "react-router-dom";
import { InteractiveNarrative } from "@/components/narrative/InteractiveNarrative";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";

export default function NarrativePage() {
  return (
    <div className="min-h-screen bg-transparent w-full pb-24 relative z-10">
      <InteractiveNarrative />

      <div className="flex flex-col items-center justify-center pt-24 px-4 text-center">
        <h2 className="text-3xl font-heading font-bold mb-4 uppercase tracking-tight">Ready to dive deeper?</h2>
        <p className="font-medium mb-8 max-w-lg border-l-[3px] border-ink pl-4 text-left">
          Explore all the raw data, filter by base years, and dive into specific sectors in our interactive analytics dashboard.
        </p>
        <Link to="/dashboard">
          <BrutalistPill className="text-lg px-8 py-3">
            OPEN FULL DASHBOARD →
          </BrutalistPill>
        </Link>
      </div>
    </div>
  );
}
