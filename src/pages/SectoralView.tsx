import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadNASData, getSectoralTrend, getSectoralYoY, getTopSectors, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";
import {
  BarChart, Bar, AreaChart, Area, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { X, CheckCircle2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316", "#eab308", "#0ea5e9", "#14b8a6", "#f43f5e"];
const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function SectoralView() {
  const navigate = useNavigate();
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yoyFilter, setYoyFilter] = useState<'all' | 'growing' | 'contracting'>('all');

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

  const { trends, industries } = getSectoralTrend(data, baseYear);
  const availableYears = trends.map(t => t.year_int as number);
  const yearInt = selectedYear ? parseInt(selectedYear) : Math.max(...availableYears);
  
  let yoyData = getSectoralYoY(data, baseYear, yearInt);
  if (yoyFilter === 'growing') yoyData = yoyData.filter(d => d.yoy > 0);
  if (yoyFilter === 'contracting') yoyData = yoyData.filter(d => d.yoy < 0);

  const topSectors = getTopSectors(data, baseYear, yearInt);

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
        <div className="relative inline-block chibi-industry">
          <div className="eyebrow mb-6">INDUSTRY BREAKDOWN</div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">Sectoral View</h1>
          <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80">
            Industry-wise Gross Value Added analysis and composition
          </p>
        </div>
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

        {selectedSector && (
          <div className="flex items-center gap-2 ml-auto">
            <button 
              onClick={() => navigate(`/sectors/${encodeURIComponent(selectedSector)}`)}
              className="flex items-center gap-2 border-[3px] border-ink bg-paper text-ink font-bold text-sm px-4 py-2 shadow-[4px_4px_0_var(--ink)] hover:translate-y-1 hover:shadow-none hover:bg-ink hover:text-paper transition-all"
            >
              FULL DEEP DIVE <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSelectedSector(null)}
              className="flex items-center gap-2 border-[3px] border-ink bg-volt text-ink font-bold text-sm px-4 py-2 shadow-[4px_4px_0_var(--ink)] hover:translate-y-1 hover:shadow-none transition-all"
            >
              CLEAR ISOLATION <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <BrutalistCard className="lg:col-span-2 h-full" delay={0.1}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Economy Composition Over Time</h3>
          <p className="opacity-75 mb-6 text-sm">100% Stacked Area chart showing the structural shift in the economy. <span className="font-bold bg-volt/30 px-1">Click any area</span> to isolate.</p>
          <ResponsiveContainer width="100%" height={450}>
            <AreaChart data={trends} stackOffset="expand" onClick={(e: any) => { if(e && e.activePayload) { setSelectedSector(e.activePayload[0].name); } }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `${(v * 100).toFixed(0)}%`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Share']} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', overflow: 'scroll', maxHeight: '60px' }} onClick={(e: any) => setSelectedSector(e.dataKey)} wrapperClassName="cursor-pointer hover:opacity-80" />
              {industries.map((ind, i) => (
                <Area 
                  key={ind}
                  animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} 
                  type="monotone" 
                  dataKey={ind} 
                  stackId="1" 
                  fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} 
                  stroke={inkColor} 
                  strokeWidth={1} 
                  fillOpacity={selectedSector === null || selectedSector === ind ? 0.9 : 0.1} 
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <div className="flex flex-col gap-6 h-full">
          <BrutalistCard delay={0.2} className="flex-1 bg-ink text-paper">
            <h3 className="font-heading font-bold text-xl mb-4 uppercase flex items-center gap-2 text-volt"><TrendingUp className="w-5 h-5" /> Top 5 Growing (FY {yearInt})</h3>
            <div className="flex flex-col gap-3">
              {topSectors.growing.map((s, i) => (
                <div key={s.industry} className="flex justify-between items-center border-b border-paper/20 pb-2 cursor-pointer hover:text-volt transition-colors" onClick={() => setSelectedSector(s.industry)}>
                  <span className="text-sm font-bold truncate max-w-[200px]" title={s.fullName}>{i+1}. {s.fullName.length > 25 ? s.fullName.substring(0, 25) + '...' : s.fullName}</span>
                  <span className="font-numbers font-bold text-volt">+{s.yoy.toFixed(1)}%</span>
                </div>
              ))}
              {topSectors.growing.length === 0 && <div className="text-sm opacity-60">No growing sectors</div>}
            </div>
          </BrutalistCard>
          
          <BrutalistCard delay={0.3} className="flex-1 border-debit">
            <h3 className="font-heading font-bold text-xl mb-4 uppercase flex items-center gap-2 text-debit"><TrendingDown className="w-5 h-5" /> Top Contracting (FY {yearInt})</h3>
            <div className="flex flex-col gap-3">
              {topSectors.contracting.map((s, i) => (
                <div key={s.industry} className="flex justify-between items-center border-b border-ink/10 pb-2 cursor-pointer hover:text-debit transition-colors" onClick={() => setSelectedSector(s.industry)}>
                  <span className="text-sm font-bold truncate max-w-[200px]" title={s.fullName}>{i+1}. {s.fullName.length > 25 ? s.fullName.substring(0, 25) + '...' : s.fullName}</span>
                  <span className="font-numbers font-bold text-debit">{s.yoy.toFixed(1)}%</span>
                </div>
              ))}
              {topSectors.contracting.length === 0 && <div className="text-sm opacity-60 font-bold">No contracting sectors this year!</div>}
            </div>
          </BrutalistCard>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="font-heading font-bold text-2xl mb-6 uppercase">Sector Sparklines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-h-[600px] overflow-y-auto pr-4 pb-4 styled-scrollbar">
          {industries.map((ind, i) => {
            const isIsolated = selectedSector !== null && selectedSector !== ind;
            const hasAnomaly = data.some(r => r.industry === ind && r.is_anomaly);
            return (
              <BrutalistCard 
                key={ind} 
                delay={0.1 + (i * 0.05)} 
                className={`cursor-pointer transition-all ${isIsolated ? 'opacity-30 grayscale hover:grayscale-0 hover:opacity-100' : 'hover:border-volt hover:-translate-y-1'} ${selectedSector === ind ? 'border-volt shadow-[6px_6px_0_var(--volt)]' : ''}`} 
                onClick={() => setSelectedSector(ind)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-heading font-bold text-xs uppercase line-clamp-2 pr-2" title={ind}>{ind}</h3>
                  {!hasAnomaly ? (
                    <CheckCircle2 className="w-4 h-4 text-volt flex-shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-debit animate-pulse flex-shrink-0 mt-1" />
                  )}
                </div>
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={trends}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip contentStyle={{...tooltipStyle, fontSize: '10px', padding: '4px'}} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)}`, '']} labelStyle={{display: 'none'}} />
                    <Line animationDuration={0} type="monotone" dataKey={ind} stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                {selectedSector === ind && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Link to={`/sectors/${encodeURIComponent(ind)}`} className="text-xs font-bold bg-volt px-2 py-1 text-center border-2 border-ink hover:bg-ink hover:text-paper transition-colors">
                      FULL DEEP DIVE →
                    </Link>
                    <div className="flex gap-2">
                      <Link to={`/dashboard?sector=${encodeURIComponent(ind)}`} className="text-[10px] font-bold flex-1 bg-paper px-1 py-1 text-center border-2 border-ink hover:bg-ink hover:text-paper transition-colors">
                        DASHBOARD
                      </Link>
                      <Link to={`/narrative?sector=${encodeURIComponent(ind)}`} className="text-[10px] font-bold flex-1 bg-paper px-1 py-1 text-center border-2 border-ink hover:bg-ink hover:text-paper transition-colors">
                        SEASONALITY
                      </Link>
                    </div>
                  </div>
                )}
              </BrutalistCard>
            )
          })}
        </div>
      </div>

      <BrutalistCard delay={0.4}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h3 className="font-heading font-bold text-xl mb-1 uppercase">YoY Growth by Sector — FY {yearInt}</h3>
            <p className="opacity-75 text-sm">Diverging bar chart comparing the year-over-year growth rate across all sectors.</p>
          </div>
          <div className="flex gap-2">
            <BrutalistPill active={yoyFilter === 'all'} onClick={() => setYoyFilter('all')}>ALL</BrutalistPill>
            <BrutalistPill active={yoyFilter === 'growing'} onClick={() => setYoyFilter('growing')} className="text-credit border-credit shadow-credit">GROWING</BrutalistPill>
            <BrutalistPill active={yoyFilter === 'contracting'} onClick={() => setYoyFilter('contracting')} className="text-debit border-debit shadow-debit">CONTRACTING</BrutalistPill>
          </div>
        </div>
         <ResponsiveContainer width="100%" height={Math.max(300, yoyData.length * 30)}>
            <BarChart data={yoyData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
              <XAxis type="number" stroke={inkColor} fontSize={11} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis type="category" dataKey="industry" width={200} stroke={inkColor} fontSize={10} fontFamily='"IBM Plex Mono", monospace' tickFormatter={(val) => val.length > 25 ? val.substring(0, 25) + '...' : val} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'YoY Growth']} />
              <ReferenceLine x={0} stroke={inkColor} strokeWidth={2} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="yoy" stroke={inkColor} strokeWidth={2} onClick={(e: any) => { if(e && e.industry) { setSelectedSector(e.industry); } }} className="cursor-pointer">
                {yoyData.map((entry, i) => (
                  <Cell key={i} fill={entry.yoy >= 0 ? 'var(--credit)' : 'var(--debit)'} fillOpacity={selectedSector === null || selectedSector === entry.industry ? 1 : 0.2} />
                ))}
              </Bar>
            </BarChart>
         </ResponsiveContainer>
      </BrutalistCard>

    </div>
  );
}
