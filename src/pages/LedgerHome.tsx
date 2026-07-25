import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, FileText, BarChart3, PieChart } from "lucide-react";
import { loadNASData, getKPISummary, formatIndianNumber } from "@/lib/data-utils";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";

// Odometer-style digit component
const AnimatedDigitStrip = ({ value }: { value: number }) => {
  const digits = value.toFixed(0).split('');
  return (
    <div className="flex bg-ink text-paper px-4 py-2 border-4 border-ink shadow-[8px_8px_0_var(--volt)]">
      {digits.map((digit, i) => (
        <div key={i} className="relative h-[8rem] w-[5rem] overflow-hidden text-[8rem] leading-[1] font-heading font-black">
          <div className="absolute top-0 left-0 animate-slide-up" style={{ animationDuration: `${1.5 + (i * 0.2)}s`, animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="h-[8rem] text-volt/30 flex items-center justify-center">0</div>
            <div className="h-[8rem] text-credit/30 flex items-center justify-center">5</div>
            <div className="h-[8rem] flex items-center justify-center">{digit}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function LedgerHome() {
  const [kpiData, setKpiData] = useState<ReturnType<typeof getKPISummary> | null>(null);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNASData().then((data) => {
      setKpiData(getKPISummary(data));
    });
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <section className="hero-section min-h-[90vh] relative flex flex-col justify-center px-[6vw] pb-24 pt-32 border-b-[3px] border-ink">
        <div className="relative z-10">
          <div className="eyebrow mb-10">
            <span className="w-2 h-2 mr-2 rounded-full bg-ink animate-pulse" />
            LIVE LEDGER FEED
          </div>

          <div className="flex flex-wrap items-end gap-5 mt-10">
            <span className="font-heading font-bold text-[clamp(3rem,9vw,7rem)] leading-[0.8]">₹</span>
            
            <div className="relative inline-block z-10 chibi-hero">
              {kpiData ? <AnimatedDigitStrip value={Number(kpiData.gdpCurrent)} /> : <div className="h-[11rem]" />}
            </div>
            
            <span className="font-numbers font-semibold text-[clamp(1.2rem,2.4vw,1.8rem)] self-end mb-3">
              L&nbsp;CR
            </span>

            {kpiData && (
              <span className={`delta-chip relative inline-block chibi-thumbsup ${Number(kpiData.yoyGrowth) >= 0 ? 'up' : 'down'}`}>
                {Number(kpiData.yoyGrowth) >= 0 ? '+' : ''}{kpiData.yoyGrowth}% YoY
              </span>
            )}
          </div>
          
          <div className="font-numbers text-sm uppercase tracking-wide mt-3 opacity-70 relative inline-block chibi-explorer ml-16">
            LATEST ANNUAL GDP (CURRENT PRICES) — BASE YEAR 2011-12
          </div>

          <p className="text-[clamp(1.4rem,2.6vw,2.1rem)] font-medium max-w-[32ch] mt-12 border-l-[3px] border-ink pl-5">
            Thirty years of India's economy, decoded — one ledger entry at a time.
          </p>
        </div>
      </section>

      <section className="min-h-[80vh] relative flex flex-col justify-center px-[6vw] py-24 border-b-[3px] border-ink bg-paper">
        <div className="font-numbers text-[0.85rem] tracking-[0.15em] uppercase border-b-[3px] border-ink pb-4 mb-12">
          002 / Ledger Entries
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BrutalistCard onClick={() => navigate('/narrative')}>
            <span className="absolute -top-0.5 -right-0.5 font-numbers font-bold text-xs tracking-wider px-3 py-2 border-l-[3px] border-b-[3px] border-ink bg-credit text-ink">
              + CREDIT
            </span>
            <span className="text-4xl mb-6 block">📖</span>
            <h3 className="font-heading font-bold text-2xl mb-3 leading-tight">1994 → 2024: The Long Arc</h3>
            <p className="text-[0.95rem] opacity-75 leading-relaxed">
              Review the historical trajectory of exponential growth across three decades of national accounts.
            </p>
          </BrutalistCard>

          <BrutalistCard delay={0.1} onClick={() => navigate('/dashboard')}>
            <span className="absolute -top-0.5 -right-0.5 font-numbers font-bold text-xs tracking-wider px-3 py-2 border-l-[3px] border-b-[3px] border-ink bg-volt text-paper">
              DATA
            </span>
            <span className="text-4xl mb-6 block">📈</span>
            <h3 className="font-heading font-bold text-2xl mb-3 leading-tight">Macro Dashboard</h3>
            <p className="text-[0.95rem] opacity-75 leading-relaxed">
              Interact with the core ledger. GDP, GVA, and quarterly seasonality breakdowns.
            </p>
          </BrutalistCard>

          <BrutalistCard delay={0.2} onClick={() => navigate('/gdp')}>
            <span className="absolute -top-0.5 -right-0.5 font-numbers font-bold text-xs tracking-wider px-3 py-2 border-l-[3px] border-b-[3px] border-ink bg-paper text-ink">
              DEEP DIVE
            </span>
            <span className="text-4xl mb-6 block">🔮</span>
            <h3 className="font-heading font-bold text-2xl mb-3 leading-tight">5-Year Forecast</h3>
            <p className="text-[0.95rem] opacity-75 leading-relaxed">
              Algorithmic projection of future ledger entries using polynomial regression models.
            </p>
          </BrutalistCard>

          <BrutalistCard delay={0.3} onClick={() => navigate('/sectors')}>
            <span className="text-4xl mb-6 block">🏭</span>
            <h3 className="font-heading font-bold text-2xl mb-3 leading-tight">Sectoral Breakdown</h3>
            <p className="text-[0.95rem] opacity-75 leading-relaxed">
              GVA analysis by industry. See how agriculture, manufacturing, and services shift over time.
            </p>
          </BrutalistCard>
        </div>
      </section>
    </div>
  );
}
