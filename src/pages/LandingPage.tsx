import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, TrendingUp, Database, Globe, IndianRupee, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadNASData, getKPISummary } from "@/lib/data-utils";

function AnimatedCounter({ target, suffix = "", prefix = "", duration = 2000 }: { target: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target * 10) / 10);
          if (progress < 1) requestAnimationFrame(animate);
          else setCount(target);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{typeof count === 'number' && count % 1 !== 0 ? count.toFixed(1) : count}{suffix}</span>;
}

export default function LandingPage() {
  const [kpi, setKpi] = useState<ReturnType<typeof getKPISummary> | null>(null);

  useEffect(() => {
    loadNASData().then(data => setKpi(getKPISummary(data)));
  }, []);

  const features = [
    { icon: BarChart3, title: "Interactive Charts", desc: "GDP trends, sectoral breakdowns, and expenditure analysis with interactive visualizations" },
    { icon: TrendingUp, title: "Growth Analysis", desc: "Year-over-year growth rates, waterfall charts, and forecasting models" },
    { icon: Database, title: "25+ Years Data", desc: "Comprehensive coverage from FY 1999 to FY 2025-26 across multiple base years" },
    { icon: Globe, title: "Sectoral Insights", desc: "Deep dive into 9+ sectors — Agriculture, Manufacturing, Services and more" },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-hero min-h-[85vh] flex items-center overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/5" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8 animate-fade-up">
              <IndianRupee className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-primary-foreground/80">Ministry of Statistics & Programme Implementation</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <span className="text-primary-foreground">India's</span>{" "}
              <span className="text-gradient-hero">National Accounts</span>
              <br />
              <span className="text-primary-foreground">Statistics</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/60 max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Explore GDP, GVA, sectoral breakdowns, and macroeconomic indicators from FY 1999 to FY 2025-26. 
              Interactive visualizations powered by real MoSPI data.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl">
                <Link to="/dashboard">
                  Explore Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-lg rounded-xl">
                <Link to="/gdp">GDP Analysis</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="relative -mt-20 z-20 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "GDP (Current Price)", value: kpi ? parseFloat(kpi.gdpCurrent) : 0, suffix: " L Cr", icon: IndianRupee, color: "text-primary" },
              { label: "YoY Growth", value: kpi ? parseFloat(kpi.yoyGrowth) : 0, suffix: "%", icon: TrendingUp, color: "text-chart-3" },
              { label: "Sectors Covered", value: kpi ? kpi.sectors : 0, suffix: "+", icon: Globe, color: "text-accent" },
              { label: "Data Points", value: kpi ? Math.round(kpi.dataPoints / 100) * 100 : 0, suffix: "+", icon: Activity, color: "text-chart-2" },
            ].map((item, i) => (
              <div 
                key={item.label} 
                className="bg-card rounded-xl p-6 card-glow border border-border animate-fade-up"
                style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className={`text-3xl font-heading font-bold ${item.color}`}>
                  <AnimatedCounter target={item.value} suffix={item.suffix} />
                </div>
                {kpi && i === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Latest: FY {kpi.latestYear}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Comprehensive <span className="text-gradient-accent">Economic Analysis</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Built on official MoSPI data covering GDP, GVA, GFCF, trade, and more across two base year series
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:card-glow cursor-pointer animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Coverage */}
      <section className="py-16 px-6 bg-card/50">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-heading font-bold mb-8">Data Coverage</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["GDP", "GVA", "GNI", "GFCF", "PFCE", "Exports", "Imports", "Savings", "Net Taxes", "Growth Rates"].map(tag => (
              <span key={tag} className="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl">
              <Link to="/dashboard">
                Start Exploring <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Data Source: Ministry of Statistics & Programme Implementation (MoSPI), Government of India</p>
          <p className="mt-1">Base Years: 2011-12 & 2022-23 | Annual + Quarterly frequencies</p>
        </div>
      </footer>
    </div>
  );
}
