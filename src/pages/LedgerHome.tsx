import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, BookOpen, TrendingDown, Layers, Database, IndianRupee, TrendingUp } from "lucide-react";
import { loadNASData, getKPISummary, formatIndianNumber } from "@/lib/data-utils";

function AnimatedOdometer({ value }: { value: number }) {
  const count = useMotionValue(0);
  const displayValue = useTransform(count, (latest) => formatIndianNumber(latest, 1));

  useEffect(() => {
    // Start from a reasonable base (like 1994's GDP) to make the animation span dramatic
    const controls = animate(count, value, { 
      duration: 3, 
      ease: "easeOut",
      delay: 0.2
    });
    return controls.stop;
  }, [value]);

  return <motion.span>{displayValue}</motion.span>;
}

export default function LedgerHome() {
  const [kpiData, setKpiData] = useState<any>(null);

  useEffect(() => {
    loadNASData().then(data => {
      setKpiData(getKPISummary(data));
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background bg-ledger-pattern font-body relative overflow-x-hidden">
      
      {/* Top Border Rule */}
      <div className="w-full h-1 bg-primary/20 absolute top-0 left-0" />

      <main className="container mx-auto px-4 md:px-8 pt-24 pb-32">
        
        {/* The Header / Odometer */}
        <div className="flex flex-col items-center text-center mb-32 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-full border border-border text-sm text-muted-foreground font-numbers mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>LIVE LEDGER FEED</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center space-x-4 md:space-x-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-numbers font-bold text-foreground tracking-tighter flex items-center">
                <IndianRupee className="w-12 h-12 md:w-20 md:h-20 lg:w-24 lg:h-24 text-muted-foreground/50 mr-2 md:mr-4" strokeWidth={3} />
                {kpiData ? <AnimatedOdometer value={Number(kpiData.gdpCurrent)} /> : "0.0"}
                <span className="text-2xl md:text-4xl text-muted-foreground ml-2 md:ml-4 tracking-normal">L Cr</span>
              </h1>
              
              {kpiData && (
                <div className={`hidden md:flex flex-col items-start p-3 rounded-lg border ${Number(kpiData.yoyGrowth) >= 0 ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  <div className="text-xs font-bold tracking-widest uppercase mb-1">
                    {Number(kpiData.yoyGrowth) >= 0 ? '+ CREDIT' : '- DEBIT'}
                  </div>
                  <div className="flex items-center font-numbers font-bold text-lg">
                    {Number(kpiData.yoyGrowth) >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}
                    {Math.abs(Number(kpiData.yoyGrowth))}% YoY
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-sm md:text-base font-numbers tracking-widest text-muted-foreground/80 uppercase mt-6">
              Latest Annual GDP (Current Prices)
            </div>
          </div>

          <div className="w-24 h-1 bg-primary/40 my-6" />

          <p className="text-xl md:text-2xl text-muted-foreground font-heading max-w-2xl">
            30 years of India's economy, decoded.
          </p>
        </div>

        {/* The Entry Ledger */}
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-px bg-border flex-1" />
            <h2 className="text-sm font-numbers tracking-widest text-muted-foreground uppercase">Ledger Entries</h2>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Link to="/narrative" className="group">
              <div className="h-full p-8 border-2 border-border bg-card/80 backdrop-blur-sm rounded-xl transition-all duration-300 hover:border-primary hover:shadow-lg relative overflow-hidden">
                <div className="absolute top-4 right-4 text-green-500 font-numbers text-sm font-bold bg-green-500/10 px-2 py-1 rounded">
                  + CREDIT
                </div>
                <BookOpen className="w-8 h-8 text-muted-foreground mb-6 group-hover:text-primary transition-colors" />
                <h3 className="text-2xl font-heading font-bold mb-2">1994 → 2024: The Long Arc</h3>
                <p className="text-muted-foreground font-numbers text-sm">Review the historical trajectory of exponential growth.</p>
                <div className="mt-8 flex items-center text-primary font-bold text-sm">
                  READ ENTRY <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link to="/narrative" className="group">
              <div className="h-full p-8 border-2 border-border bg-card/80 backdrop-blur-sm rounded-xl transition-all duration-300 hover:border-red-500/50 hover:shadow-lg relative overflow-hidden">
                <div className="absolute top-4 right-4 text-red-500 font-numbers text-sm font-bold bg-red-500/10 px-2 py-1 rounded">
                  - DEBIT
                </div>
                <TrendingDown className="w-8 h-8 text-muted-foreground mb-6 group-hover:text-red-500 transition-colors" />
                <h3 className="text-2xl font-heading font-bold mb-2">2020: The Shock</h3>
                <p className="text-muted-foreground font-numbers text-sm">Analyze the unprecedented contraction during the pandemic.</p>
                <div className="mt-8 flex items-center text-red-500 font-bold text-sm">
                  READ ENTRY <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link to="/narrative" className="group">
              <div className="h-full p-8 border-2 border-border bg-card/80 backdrop-blur-sm rounded-xl transition-all duration-300 hover:border-primary hover:shadow-lg relative overflow-hidden">
                <Layers className="w-8 h-8 text-muted-foreground mb-6 group-hover:text-primary transition-colors" />
                <h3 className="text-2xl font-heading font-bold mb-2">Sector by Sector</h3>
                <p className="text-muted-foreground font-numbers text-sm">Deconstruct the economy into its foundational industries.</p>
                <div className="mt-8 flex items-center text-primary font-bold text-sm">
                  READ ENTRY <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link to="/dashboard" className="group">
              <div className="h-full p-8 border-2 border-border bg-card/80 backdrop-blur-sm rounded-xl transition-all duration-300 hover:border-foreground hover:shadow-lg relative overflow-hidden bg-muted/30">
                <Database className="w-8 h-8 text-muted-foreground mb-6 group-hover:text-foreground transition-colors" />
                <h3 className="text-2xl font-heading font-bold mb-2">Explore the Raw Ledger</h3>
                <p className="text-muted-foreground font-numbers text-sm">Skip the narrative and access the full interactive dashboard.</p>
                <div className="mt-8 flex items-center text-foreground font-bold text-sm">
                  ACCESS DATA <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

          </div>
        </div>
      </main>
    </div>
  );
}
