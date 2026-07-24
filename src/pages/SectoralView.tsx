import { useEffect, useState } from "react";
import { loadNASData, getSectoralTrend, getSectoralYoY, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";
import {
  BarChart, Bar, AreaChart, Area, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from "recharts";
import { X } from "lucide-react";

const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316", "#eab308", "#0ea5e9", "#14b8a6", "#f43f5e"];
const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function SectoralView() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
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

  const { trends, industries } = getSectoralTrend(data, baseYear);
  const availableYears = trends.map(t => t.year_int as number);
  const yearInt = selectedYear ? parseInt(selectedYear) : Math.max(...availableYears);
  
  const yoyData = getSectoralYoY(data, baseYear, yearInt);

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
          Industry-wise Gross Value Added analysis and composition
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

        {selectedSector && (
          <button 
            onClick={() => setSelectedSector(null)}
            className="flex items-center gap-2 border-[3px] border-ink bg-volt text-ink font-bold text-sm px-4 py-2 shadow-[4px_4px_0_var(--ink)] hover:translate-y-1 hover:shadow-none transition-all ml-auto"
          >
            CLEAR SECTOR: {selectedSector} <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <BrutalistCard className="mb-8" delay={0.1}>
        <h3 className="font-heading font-bold text-xl mb-2 uppercase">Economy Composition Over Time</h3>
        <p className="opacity-75 mb-6 text-sm">100% Stacked Area chart showing the structural shift in the economy. <span className="font-bold bg-volt/30 px-1">Click any area</span> to filter the charts below.</p>
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart data={trends} stackOffset="expand" onClick={(e: any) => { if(e && e.activePayload) { setSelectedSector(e.activePayload[0].name); } }}>
            <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
            <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
            <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `${(v * 100).toFixed(0)}%`} fontFamily='"IBM Plex Mono", monospace' />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${(v * 100).toFixed(1)}%`, 'Share']} />
            <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} onClick={(e: any) => setSelectedSector(e.dataKey)} wrapperClassName="cursor-pointer hover:opacity-80" />
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
                fillOpacity={selectedSector === null || selectedSector === ind ? 0.9 : 0.2} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </BrutalistCard>

      {selectedSector ? (
        <BrutalistCard className="mb-8" delay={0.2}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Deep Dive: {selectedSector}</h3>
          <p className="opacity-75 mb-6 text-sm">Historical growth trajectory for the selected sector.</p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, selectedSector]} />
              <Line animationDuration={ANIM_DUR} type="monotone" dataKey={selectedSector} stroke="var(--volt)" strokeWidth={4} dot={{ fill: 'var(--paper)', stroke: inkColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </BrutalistCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {industries.slice(0, 6).map((ind, i) => (
            <BrutalistCard key={ind} delay={0.2 + (i * 0.1)} className="cursor-pointer hover:border-volt transition-colors" onClick={() => setSelectedSector(ind)}>
              <h3 className="font-heading font-bold text-sm mb-4 uppercase truncate" title={ind}>{ind}</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trends}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip contentStyle={{...tooltipStyle, fontSize: '10px', padding: '4px'}} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)}`, '']} labelStyle={{display: 'none'}} />
                  <Line animationDuration={ANIM_DUR} type="monotone" dataKey={ind} stroke={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </BrutalistCard>
          ))}
        </div>
      )}

      <BrutalistCard delay={0.3}>
         <h3 className="font-heading font-bold text-xl mb-2 uppercase">YoY Growth by Sector — FY {yearInt}</h3>
         <p className="opacity-75 mb-6 text-sm">Diverging bar chart comparing the year-over-year growth rate across all sectors for the selected year.</p>
         <ResponsiveContainer width="100%" height={500}>
            <BarChart data={yoyData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
              <XAxis type="number" stroke={inkColor} fontSize={11} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis type="category" dataKey="industry" width={150} stroke={inkColor} fontSize={10} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'YoY Growth']} />
              <ReferenceLine x={0} stroke={inkColor} strokeWidth={2} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="yoy" stroke={inkColor} strokeWidth={2}>
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
