import { useEffect, useState } from "react";
import { loadNASData, getQuarterlySeasonality, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";

const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";
const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316"];

export default function SeasonalityAnalysis() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-paper">
        <div className="w-12 h-12 border-4 border-ink border-t-volt rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-paper text-ink p-8 text-center">
        <div className="w-16 h-16 mb-6 text-debit border-4 border-debit flex items-center justify-center font-bold text-2xl rounded-full">!</div>
        <h2 className="text-2xl font-bold font-heading uppercase mb-2">API Connection Failed</h2>
      </div>
    );
  }

  const quarterlyData = getQuarterlySeasonality(data, baseYear);
  
  const recentYears = quarterlyData.slice(-5);
  const radarData: any[] = [
    { quarter: 'Q1 (Apr-Jun)' },
    { quarter: 'Q2 (Jul-Sep)' },
    { quarter: 'Q3 (Oct-Dec)' },
    { quarter: 'Q4 (Jan-Mar)' }
  ];
  
  recentYears.forEach(yData => {
    radarData[0][`FY${yData.year_int}`] = yData.Q1 || 0;
    radarData[1][`FY${yData.year_int}`] = yData.Q2 || 0;
    radarData[2][`FY${yData.year_int}`] = yData.Q3 || 0;
    radarData[3][`FY${yData.year_int}`] = yData.Q4 || 0;
  });

  const heatmapData = quarterlyData.map((curr, idx) => {
    const prev = idx > 0 ? quarterlyData[idx - 1] : null;
    return {
      year: curr.year,
      Q1: curr.Q1,
      Q2: curr.Q2,
      Q3: curr.Q3,
      Q4: curr.Q4,
      Q1_growth: prev && prev.Q1 && curr.Q1 ? ((curr.Q1 - prev.Q1) / prev.Q1) * 100 : null,
      Q2_growth: prev && prev.Q2 && curr.Q2 ? ((curr.Q2 - prev.Q2) / prev.Q2) * 100 : null,
      Q3_growth: prev && prev.Q3 && curr.Q3 ? ((curr.Q3 - prev.Q3) / prev.Q3) * 100 : null,
      Q4_growth: prev && prev.Q4 && curr.Q4 ? ((curr.Q4 - prev.Q4) / prev.Q4) * 100 : null,
    };
  }).reverse();

  const getHeatmapColor = (growth: number | null) => {
    if (growth === null) return 'bg-ink/5';
    if (growth > 8) return 'bg-[#14b8a6] text-paper';
    if (growth > 4) return 'bg-[#2dd4bf] text-ink';
    if (growth > 0) return 'bg-[#99f6e4] text-ink';
    if (growth > -4) return 'bg-[#fecdd3] text-ink';
    return 'bg-[#e11d48] text-paper';
  };

  const tooltipStyle = {
    backgroundColor: 'var(--paper)',
    border: '3px solid var(--ink)',
    borderRadius: '0px',
    color: 'var(--ink)',
    fontFamily: '"IBM Plex Mono", monospace',
    boxShadow: '4px 4px 0 var(--ink)',
    fontWeight: '600'
  };
  const inkColor = 'var(--ink)';

  return (
    <div className="w-full px-[6vw] py-12 bg-transparent text-ink pb-32 relative z-10">
      <div className="mb-12 pt-8">
        <div className="eyebrow mb-6">TIME-SERIES PATTERNS</div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">Seasonality Analysis</h1>
        <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80">
          Discover repeating cyclical trends and quarterly growth dynamics.
        </p>
      </div>

      <div className="flex gap-4 mb-12">
        <BrutalistPill active={baseYear === "2011-12"} onClick={() => setBaseYear("2011-12")}>BASE 2011-12</BrutalistPill>
        <BrutalistPill active={baseYear === "2022-23"} onClick={() => setBaseYear("2022-23")}>BASE 2022-23</BrutalistPill>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        <BrutalistCard delay={0.1} className="lg:col-span-2">
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Quarterly Seasonality Heatmap (YoY Growth)</h3>
          <p className="opacity-75 mb-6 text-sm">Visualizes the year-over-year growth rate for each specific quarter. Dark green indicates strong expansion compared to the same quarter last year.</p>
          
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] border-[3px] border-ink bg-paper shadow-[4px_4px_0_var(--ink)]">
              <div className="grid grid-cols-5 border-b-[3px] border-ink bg-ink text-paper font-bold font-heading text-sm uppercase">
                <div className="p-3 border-r-[3px] border-ink text-center">Financial Year</div>
                <div className="p-3 border-r-[3px] border-ink text-center">Q1 (Apr-Jun)</div>
                <div className="p-3 border-r-[3px] border-ink text-center">Q2 (Jul-Sep)</div>
                <div className="p-3 border-r-[3px] border-ink text-center">Q3 (Oct-Dec)</div>
                <div className="p-3 text-center">Q4 (Jan-Mar)</div>
              </div>
              
              {heatmapData.map((row, i) => (
                <div key={row.year} className={`grid grid-cols-5 font-mono text-sm ${i !== heatmapData.length - 1 ? 'border-b-[3px] border-ink' : ''}`}>
                  <div className="p-3 border-r-[3px] border-ink font-bold flex items-center justify-center bg-ink/5">
                    FY {row.year}
                  </div>
                  {[1, 2, 3, 4].map(q => {
                    const growth = row[`Q${q}_growth` as keyof typeof row] as number | null;
                    const val = row[`Q${q}` as keyof typeof row] as number | null;
                    return (
                      <div key={q} className={`p-3 border-r-[3px] border-ink last:border-r-0 flex flex-col items-center justify-center ${getHeatmapColor(growth)} transition-colors hover:brightness-110`}>
                        {growth !== null ? (
                          <>
                            <span className="font-bold text-base">{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
                            <span className="text-[10px] opacity-70 mt-1">₹{formatIndianNumber(val || 0, 0)}</span>
                          </>
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 mt-6 text-xs font-mono font-bold">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#e11d48] border border-ink"></div> &lt; -4%</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#fecdd3] border border-ink"></div> -4% to 0%</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#99f6e4] border border-ink"></div> 0% to 4%</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#2dd4bf] border border-ink"></div> 4% to 8%</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-[#14b8a6] border border-ink"></div> &gt; 8%</div>
          </div>
        </BrutalistCard>

        <BrutalistCard delay={0.2} className="lg:col-span-2">
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Radial Seasonal Cycle (Recent 5 Years)</h3>
          <p className="opacity-75 mb-6 text-sm">A polar view of the repeating annual pattern. The shape of the polygon reveals whether the economy peaks in Q3/Q4 consistently every year.</p>
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={inkColor} opacity={0.2} />
              <PolarAngleAxis dataKey="quarter" tick={{ fill: inkColor, fontSize: 12, fontWeight: 'bold', fontFamily: '"IBM Plex Mono", monospace' }} />
              <PolarRadiusAxis tick={{ fill: inkColor, fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' }} angle={90} tickFormatter={(v) => `₹${formatIndianNumber(v, 0)}`} />
              
              {recentYears.map((y, i) => (
                <Radar 
                  key={y.year} 
                  name={`FY ${y.year}`} 
                  dataKey={`FY${y.year_int}`} 
                  stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} 
                  strokeWidth={3} 
                  fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} 
                  fillOpacity={0.1}
                  animationDuration={ANIM_DUR}
                  animationEasing={ANIM_EASE}
                />
              ))}
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </BrutalistCard>

      </div>
    </div>
  );
}
