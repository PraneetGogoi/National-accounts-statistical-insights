import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { InteractiveNarrative } from "@/components/narrative/InteractiveNarrative";
import { Button } from "@/components/ui/button";

export default function NarrativePage() {
  return (
    <div className="min-h-screen bg-background w-full pb-24">
      <InteractiveNarrative />

      <div className="flex flex-col items-center justify-center pt-16 px-4 text-center">
        <h2 className="text-2xl font-heading font-bold mb-4">Ready to dive deeper?</h2>
        <p className="text-muted-foreground mb-8 max-w-lg">
          Explore all the raw data, filter by base years, and dive into specific sectors in our interactive analytics dashboard.
        </p>
        <Link to="/dashboard">
          <Button size="lg" className="font-heading font-semibold shadow-lg">
            Open Full Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
