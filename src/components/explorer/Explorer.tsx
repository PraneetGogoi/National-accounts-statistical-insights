import { useEffect, useState } from "react";
import { loadNASData, fetchForecast, fetchIngestionStatus, fetchBacktest, getGDPTrend, getSectoralGVA, getExpenditureComponents, getGrowthRates, getQuarterlyGDP, getKPISummary, NASRecord, ForecastData, IngestionStatus, BacktestData, formatIndianNumber } from "@/lib/data-utils";
import { IndianRupee, TrendingUp, BarChart3, Activity, Clock } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine
} from "recharts";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";
import { StatBlock } from "@/components/ui/brutal/StatBlock";
import { Switch } from "@/components/ui/switch";

const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316", "#eab308"];
const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function Dashboard() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [status, setStatus] = useState<IngestionStatus | null>(null);
  const [backtest, setBacktest] = useState<BacktestData | null>(null);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);
  const [showForecast, setShowForecast] = useState(true);

  useEffect(() => {
    Promise.all([
      loadNASData(),
      fetchForecast(12),
      fetchIngestionStatus(),
      fetchBacktest()
    ]).then(([d, f, s, b]) => {
      setData(d);
      setForecast(f);
      setStatus(s);
      setBacktest(b);
      setLoading(false);
    });
  }, []);

  const kpi = getKPISummary(data);
  const gdpTrend = getGDPTrend(data, baseYear);
  const sectoralGVA = getSectoralGVA(data, baseYear);
  const expenditure = getExpenditureComponents(data, baseYear);
  const growthRates = getGrowthRates(data, baseYear);
  const quarterlyGDP = getQuarterlyGDP(data, baseYear);

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
        <p className="opacity-80 max-w-md font-mono text-sm">
          Could not load data from the backend. If you are viewing this on Vercel, make sure your Python API is deployed and the VITE_API_URL environment variable is set.
        </p>
      </div>
    );
  }

  const kpiCards = [
    { 
      label: "GDP (Current)", 
      value: `₹${formatIndianNumber(kpi.gdpCurrent, 1)} L Cr`, 
      icon: <IndianRupee className="h-5 w-5 text-ink" />, 
      change: `+${formatIndianNumber(kpi.yoyGrowth, 1)}%`, 
      outlook: 'growth' as const,
      provenance: status ? { ingestion_timestamp: status.timestamp, source_file_hash: status.source_file_hash, is_anomaly: false } : undefined
    },
    { 
      label: "GDP (Constant)", 
      value: `₹${formatIndianNumber(kpi.gdpConstant, 1)} L Cr`, 
      icon: <BarChart3 className="h-5 w-5 text-ink" />, 
      change: "Base 2011-12", 
      outlook: 'neutral' as const,
      provenance: status ? { ingestion_timestamp: status.timestamp, source_file_hash: status.source_file_hash, is_anomaly: false } : undefined 
    },
    { 
      label: "Growth Rate", 
      value: `${formatIndianNumber(kpi.growthRate, 1)}%`, 
      icon: <TrendingUp className="h-5 w-5 text-ink" />, 
      change: "GDP YoY", 
      outlook: Number(kpi.growthRate) >= 0 ? 'growth' as const : 'decline' as const,
      provenance: status ? { ingestion_timestamp: status.timestamp, source_file_hash: status.source_file_hash, is_anomaly: false } : undefined 
    },
    { 
      label: "Data Points", 
      value: formatIndianNumber(kpi.dataPoints, 0), 
      icon: <Activity className="h-5 w-5 text-ink" />, 
      change: kpi.yearsSpan, 
      outlook: 'neutral' as const,
      provenance: status ? { ingestion_timestamp: status.timestamp, source_file_hash: status.source_file_hash, is_anomaly: false } : undefined 
    },
  ];

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
  const paperColor = 'var(--paper)';
  const voltColor = 'var(--volt)';
  const creditColor = 'var(--credit)';
  const debitColor = 'var(--debit)';

  // Merge forecast data with GDP trend
  type CombinedGdpDataItem = {
    year: string;
    year_int: number;
    current: number;
    constant: number;
    yhat_lower?: number;
    yhat_upper?: number;
    isForecast?: boolean;
    is_anomaly?: boolean;
  };
  
  const combinedGdpData: CombinedGdpDataItem[] = [...gdpTrend];
  if (showForecast && forecast.length > 0) {
    const lastHist = gdpTrend[gdpTrend.length - 1];
    forecast.forEach(f => {
      const year = new Date(f.ds).getFullYear();
      if (year > lastHist.year_int) {
        combinedGdpData.push({
          year: year.toString(),
          year_int: year,
          current: 0,
          constant: f.yhat / 1e5,
          yhat_lower: f.yhat_lower / 1e5,
          yhat_upper: f.yhat_upper / 1e5,
          isForecast: true,
          is_anomaly: false
        });
      }
    });
  }

  const todayYearInt = gdpTrend.length > 0 ? gdpTrend[gdpTrend.length - 1].year_int : new Date().getFullYear();

  const renderCustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.is_anomaly) {
      return (
        <svg x={cx - 12} y={cy - 12} width={24} height={24} fill="var(--debit)" viewBox="0 0 24 24">
           <path d="M12 2L1 21h22M12 8v5M12 16h.01" stroke="var(--paper)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return <circle cx={cx} cy={cy} r={4} fill={paperColor} stroke={inkColor} strokeWidth={2} />;
  };

  return (
    <div className="w-full px-[6vw] py-12 bg-transparent text-ink pb-32 relative z-10">
      <div className="mb-12 pt-8 flex justify-between items-end">
        <div>
          <div className="eyebrow mb-6">MACRO INDICATORS</div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">Dashboard</h1>
          <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80 mb-2">
            India National Accounts Statistics — Interactive Analysis
          </p>
          {status && (
            <div className="flex items-center gap-2 text-xs font-mono font-bold opacity-70 bg-ink/10 w-fit px-3 py-1 border-2 border-ink">
              <Clock className="w-3 h-3" />
              LAST INGESTED: {new Date(status.timestamp).toLocaleString()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 bg-paper border-4 border-ink p-4 shadow-[4px_4px_0_var(--ink)]">
          <div className="text-sm font-bold font-heading uppercase">Show Model Accuracy</div>
          <Switch checked={showForecast} onCheckedChange={setShowForecast} />
        </div>
      </div>

      <div className="flex gap-4 mb-16">
        <BrutalistPill active={baseYear === "2011-12"} onClick={() => setBaseYear("2011-12")}>BASE 2011-12</BrutalistPill>
        <BrutalistPill active={baseYear === "2022-23"} onClick={() => setBaseYear("2022-23")}>BASE 2022-23</BrutalistPill>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {kpiCards.map((k, i) => (
          <StatBlock key={k.label} {...k} delay={i * 0.1} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <BrutalistCard delay={0.1}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-heading font-bold text-xl uppercase">GDP Annual Trend</h3>
            {showForecast && backtest && (
              <div className="text-right text-xs font-mono bg-ink/10 px-3 py-1.5 border-2 border-ink">
                <div className="font-bold border-b border-ink/20 pb-1 mb-1">PROPHET MODEL ACCURACY</div>
                <div className="flex justify-between gap-4"><span>MAE:</span> <span>₹{formatIndianNumber(backtest.metrics.mae / 1e5, 1)} L Cr</span></div>
                <div className="flex justify-between gap-4"><span>RMSE:</span> <span>₹{formatIndianNumber(backtest.metrics.rmse / 1e5, 1)} L Cr</span></div>
              </div>
            )}
          </div>
          <p className="opacity-75 mb-6 text-sm">Visualizes the absolute size of the Indian economy over time. Current prices reflect nominal growth including inflation, while Constant prices show real economic expansion adjusted to the base year.</p>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={combinedGdpData}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
              {showForecast && (
                <Area 
                  type="monotone" 
                  dataKey="yhat_upper" 
                  fill={voltColor} 
                  stroke="none" 
                  fillOpacity={0.15} 
                  name="Confidence Interval" 
                  animationDuration={ANIM_DUR} 
                />
              )}
              {showForecast && (
                <Area 
                  type="monotone" 
                  dataKey="yhat_lower" 
                  fill={paperColor} 
                  stroke="none" 
                  fillOpacity={1} 
                  name="Confidence Interval Lower" 
                  legendType="none"
                  animationDuration={ANIM_DUR} 
                />
              )}
              <ReferenceLine x={todayYearInt} stroke={inkColor} strokeDasharray="3 3" label={{ position: 'top', value: 'TODAY', fill: inkColor, fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="current" name="Current Price" stroke={voltColor} strokeWidth={4} dot={renderCustomDot} activeDot={{ r: 6 }} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="constant" name="Constant Price (Actual/Forecast)" stroke={inkColor} strokeWidth={3} strokeDasharray="5 5" dot={renderCustomDot} />
            </ComposedChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.2}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">GDP Growth Rate (YoY)</h3>
          <p className="opacity-75 mb-6 text-sm">Shows the year-over-year percentage change in real GDP. The bars indicate positive or negative growth, highlighting economic cycles and major contractions.</p>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={growthRates}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${formatIndianNumber(v, 2)}%`, 'Growth']} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="growth" stroke={inkColor} strokeWidth={2}>
                {growthRates.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.growth < 0 ? debitColor : creditColor} />
                ))}
              </Bar>
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="growth" stroke={inkColor} strokeWidth={3} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </BrutalistCard>
      </div>

      <BrutalistCard className="mb-8" delay={0.3}>
        <h3 className="font-heading font-bold text-xl mb-2 uppercase">Quarterly GDP & Seasonality</h3>
        <p className="opacity-75 mb-6 text-sm">Breaks down GDP into financial quarters (Q1-Q4) to reveal seasonal patterns in economic activity, such as post-harvest bumps or festive season spending.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={quarterlyGDP}>
            <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
            <XAxis dataKey="label" stroke={inkColor} fontSize={11} angle={-45} textAnchor="end" height={70} fontFamily='"IBM Plex Mono", monospace' />
            <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
            <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="current" name="Current Price" fill={voltColor} stroke={inkColor} strokeWidth={3} fillOpacity={0.2} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="constant" name="Constant Price" fill={inkColor} stroke={inkColor} strokeWidth={2} fillOpacity={0.1} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </BrutalistCard>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        <BrutalistCard delay={0.4}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Sectoral GVA Breakdown</h3>
          <p className="opacity-75 mb-6 text-sm">Compares the absolute Gross Value Added (GVA) across major industries, showing which sectors are the largest drivers of the economy in the selected base year.</p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={sectoralGVA} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
              <XAxis type="number" stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}K`} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis type="category" dataKey="industry" width={140} stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="value" stroke={inkColor} strokeWidth={2}>
                {sectoralGVA.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.5}>
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">Economy Structure (GVA Share)</h3>
          <p className="opacity-75 mb-6 text-sm">Displays the proportional contribution of each industry to the total economy, illustrating India's shift between agriculture, manufacturing, and services.</p>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                animationDuration={ANIM_DUR} animationEasing={ANIM_EASE}
                data={sectoralGVA}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                dataKey="value"
                nameKey="industry"
                label={({ industry, percent }) => `${industry.substring(0, 15)}... ${formatIndianNumber(percent * 100, 0)}%`}
                labelLine={false}
                className="font-numbers text-[10px]"
                stroke={inkColor}
                strokeWidth={2}
              >
                {sectoralGVA.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']} />
            </PieChart>
          </ResponsiveContainer>
        </BrutalistCard>
      </div>

      <BrutalistCard delay={0.6}>
        <h3 className="font-heading font-bold text-xl mb-2 uppercase">Expenditure Components</h3>
        <p className="opacity-75 mb-6 text-sm">Breaks down GDP by expenditure type (Consumption, Investment, Government spending, Net Exports), showing how economic output is utilized.</p>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={expenditure}>
            <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
            <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
            <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
            <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="Private FCE" stackId="1" fill={voltColor} stroke={inkColor} strokeWidth={2} fillOpacity={0.8} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="Government FCE" stackId="1" fill={creditColor} stroke={inkColor} strokeWidth={2} fillOpacity={0.8} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="GFCF" stackId="1" fill="#a855f7" stroke={inkColor} strokeWidth={2} fillOpacity={0.8} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="Exports" stackId="1" fill="#f97316" stroke={inkColor} strokeWidth={2} fillOpacity={0.8} />
            <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="Imports" stackId="1" fill={debitColor} stroke={inkColor} strokeWidth={2} fillOpacity={0.8} />
          </AreaChart>
        </ResponsiveContainer>
      </BrutalistCard>
    </div>
  );
}
