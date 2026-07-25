import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadNASData, getSectoralTrend, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const ANIM_DUR = 800;

export default function SectorDrillDown() {
  const { sectorId } = useParams();
  const navigate = useNavigate();
  const decodedSector = decodeURIComponent(sectorId || "");
  
  const [data, setData] = useState<NASRecord[]>([]);
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

  if (!decodedSector || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-paper text-ink p-8 text-center">
        <h2 className="text-2xl font-bold font-heading uppercase mb-2">Sector Not Found</h2>
        <button onClick={() => navigate('/sectors')} className="mt-4 px-4 py-2 bg-ink text-paper font-bold uppercase border-2 border-ink hover:bg-paper hover:text-ink transition-colors shadow-[4px_4px_0_var(--volt)]">Back to Sectoral View</button>
      </div>
    );
  }

  // Get data for this sector
  const { trends } = getSectoralTrend(data, '2011-12');
  
  // Calculate YoY for this specific sector historically
  const history = trends.map((t, i) => {
    const currentVal = t[decodedSector] as number || 0;
    const prevVal = i > 0 ? (trends[i-1][decodedSector] as number || 0) : 0;
    let yoy = 0;
    if (prevVal > 0) {
      yoy = ((currentVal - prevVal) / prevVal) * 100;
    }
    return {
      year: t.year,
      year_int: t.year_int,
      value: currentVal,
      yoy: i === 0 ? 0 : yoy
    };
  });

  const latestData = history[history.length - 1];
  
  // Check if sector has any anomalies
  const sectorRecords = data.filter(r => r.industry === decodedSector);
  const hasAnomaly = sectorRecords.some(r => r.is_anomaly);

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
        <button 
          onClick={() => navigate('/sectors')}
          className="flex items-center gap-2 font-bold uppercase hover:bg-ink hover:text-paper px-3 py-1 transition-colors border-[3px] border-transparent hover:border-ink mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Overview
        </button>
        
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-[3px] border-ink pb-8">
          <div>
            <div className="eyebrow mb-4">SECTOR DEEP DIVE</div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4 max-w-4xl leading-tight">
              {decodedSector}
            </h1>
            <div className="flex items-center gap-4">
              {!hasAnomaly ? (
                <span className="flex items-center gap-1 bg-volt text-ink border-[2px] border-ink px-3 py-1 font-bold text-sm shadow-[2px_2px_0_var(--ink)]">
                  <CheckCircle2 className="w-4 h-4" /> VERIFIED DATA
                </span>
              ) : (
                <span className="flex items-center gap-1 bg-debit text-ink border-[2px] border-ink px-3 py-1 font-bold text-sm shadow-[2px_2px_0_var(--ink)]">
                  <span className="w-2 h-2 rounded-full bg-paper animate-pulse" /> PENDING REVIEW
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end text-right border-l-[3px] border-ink pl-6">
            <span className="text-sm font-bold opacity-60 uppercase">FY {latestData.year} GVA (Constant)</span>
            <span className="text-4xl font-numbers font-bold">₹{formatIndianNumber(latestData.value, 0)}<span className="text-lg">K Cr</span></span>
            <span className={`text-lg font-bold font-numbers ${latestData.yoy >= 0 ? 'text-credit' : 'text-debit'}`}>
              {latestData.yoy >= 0 ? '+' : ''}{latestData.yoy.toFixed(1)}% YoY
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <BrutalistCard delay={0.1}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Historical Growth Trajectory</h3>
          <p className="opacity-75 mb-6 text-sm">Long-term value creation across all base years in constant prices.</p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, 'GVA']} />
              <Line animationDuration={ANIM_DUR} type="monotone" dataKey="value" stroke="var(--volt)" strokeWidth={4} dot={{ fill: 'var(--paper)', stroke: inkColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.2}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Year-over-Year Momentum</h3>
          <p className="opacity-75 mb-6 text-sm">Annual growth rate showing periods of acceleration and contraction.</p>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={history.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, 'YoY Growth']} />
              <ReferenceLine y={0} stroke={inkColor} strokeWidth={2} />
              <Bar animationDuration={ANIM_DUR} dataKey="yoy" stroke={inkColor} strokeWidth={2}>
                {history.slice(1).map((entry, i) => (
                  <Cell key={i} fill={entry.yoy >= 0 ? 'var(--credit)' : 'var(--debit)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.3} className="border-dashed bg-ink/5">
          <h3 className="font-heading font-bold text-xl mb-2 uppercase text-ink/60">Prophet Forecast (Coming Soon)</h3>
          <p className="opacity-75 mb-6 text-sm text-ink/60">Predictive modeling pipeline is currently offline for this sector.</p>
          <div className="w-full h-[200px] border-[3px] border-ink/20 flex items-center justify-center font-numbers text-ink/40 font-bold">
            MODEL_NOT_TRAINED
          </div>
        </BrutalistCard>
      </div>
    </div>
  );
}
