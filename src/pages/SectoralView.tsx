import { useEffect, useState } from "react";
import { loadNASData, getSectoralGVA, NASRecord } from "@/lib/data-utils";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316", "#eab308", "#0ea5e9", "#14b8a6"];
const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function SectoralView() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-12 h-12 border-4 border-ink border-t-volt rounded-full animate-spin" />
      </div>
    );
  }

  const gvaFiltered = data.filter(r => 
    r.indicator === 'Gross Value Added' && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && !r.industry.includes('Total')
  );
  const availableYears = [...new Set(gvaFiltered.map(r => r.year_int))].sort();
  const yearInt = selectedYear ? parseInt(selectedYear) : Math.max(...availableYears);
  
  const sectoralGVA = getSectoralGVA(data, baseYear, yearInt);
  
  // Radar data (normalize to 0-100)
  const maxVal = Math.max(...sectoralGVA.map(s => s.value));
  const radarData = sectoralGVA.slice(0, 8).map(s => ({
    sector: s.industry.substring(0, 20),
    value: (s.value / maxVal * 100),
    rawValue: s.value,
  }));

  // Multi-year comparison
  const compareYears = availableYears.slice(-5);
  const multiYearData = [...new Set(gvaFiltered.filter(r => compareYears.includes(r.year_int)).map(r => r.industry))].map(ind => {
    const row: Record<string, string | number> = { industry: ind.length > 25 ? ind.substring(0, 23) + '...' : ind };
    compareYears.forEach(y => {
      const rec = gvaFiltered.find(r => r.industry === ind && r.year_int === y);
      row[`FY${y}`] = rec ? rec.current_price / 1e5 : 0;
    });
    return row;
  });

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
        <div className="eyebrow mb-6">INDUSTRY BREAKDOWN</div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">Sectoral View</h1>
        <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80">
          Industry-wise Gross Value Added analysis across sectors
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mb-12 items-center">
        <BrutalistPill active={baseYear === "2011-12"} onClick={() => setBaseYear("2011-12")}>BASE 2011-12</BrutalistPill>
        <BrutalistPill active={baseYear === "2022-23"} onClick={() => setBaseYear("2022-23")}>BASE 2022-23</BrutalistPill>
        
        <select 
          value={yearInt.toString()} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border-[3px] border-ink bg-paper text-ink font-numbers font-bold text-sm px-4 py-2 outline-none focus:bg-volt focus:text-paper shadow-[4px_4px_0_var(--ink)] cursor-pointer"
        >
          {availableYears.map(y => (
            <option key={y} value={y.toString()}>FY {y}</option>
          ))}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <BrutalistCard delay={0.1}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">🏭 GVA by Sector — FY {yearInt}</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sectoralGVA} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
              <XAxis type="number" stroke={inkColor} fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis type="category" dataKey="industry" width={150} stroke={inkColor} fontSize={10} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`, '']} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="value" stroke={inkColor} strokeWidth={2}>
                {sectoralGVA.map((_, i) => <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.2}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">🕸️ Sector Radar</h3>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke={inkColor} opacity={0.2} />
              <PolarAngleAxis dataKey="sector" tick={{ fill: inkColor, fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' }} />
              <PolarRadiusAxis tick={{ fill: inkColor, fontSize: 10, fontFamily: '"IBM Plex Mono", monospace' }} angle={30} domain={[0, 100]} />
              <Radar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} name="GVA Share" dataKey="value" stroke="var(--volt)" strokeWidth={3} fill="var(--volt)" fillOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.3}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">🥧 Economy Composition</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie 
                animationDuration={ANIM_DUR} animationEasing={ANIM_EASE}
                data={sectoralGVA} cx="50%" cy="50%" outerRadius={140} innerRadius={60} dataKey="value" nameKey="industry" 
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                stroke={inkColor} strokeWidth={2}
                className="font-numbers text-[10px]"
              >
                {sectoralGVA.map((_, i) => <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`, '']} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.4}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">📊 Multi-Year Comparison (Last 5 Years)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={multiYearData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
              <XAxis type="number" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis type="category" dataKey="industry" width={130} stroke={inkColor} fontSize={10} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
              {compareYears.map((y, i) => (
                <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} key={y} dataKey={`FY${y}`} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} stroke={inkColor} strokeWidth={1} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </BrutalistCard>
      </div>
    </div>
  );
}
