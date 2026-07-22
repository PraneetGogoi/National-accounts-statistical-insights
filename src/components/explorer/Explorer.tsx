import { useEffect, useState } from "react";
import { loadNASData, getGDPTrend, getSectoralGVA, getExpenditureComponents, getGrowthRates, getQuarterlyGDP, getKPISummary, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import { IndianRupee, TrendingUp, BarChart3, Activity } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from "recharts";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";
import { StatBlock } from "@/components/ui/brutal/StatBlock";

const CATEGORICAL_COLORS = ["var(--volt)", "var(--credit)", "var(--debit)", "#a855f7", "#ec4899", "#f97316", "#eab308"];
const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function Dashboard() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
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

  const kpiCards = [
    { label: "GDP (Current)", value: `₹${formatIndianNumber(kpi.gdpCurrent, 1)} L Cr`, icon: <IndianRupee className="h-5 w-5 text-ink" />, change: `+${formatIndianNumber(kpi.yoyGrowth, 1)}%`, outlook: 'growth' as const },
    { label: "GDP (Constant)", value: `₹${formatIndianNumber(kpi.gdpConstant, 1)} L Cr`, icon: <BarChart3 className="h-5 w-5 text-ink" />, change: "Base 2011-12", outlook: 'neutral' as const },
    { label: "Growth Rate", value: `${formatIndianNumber(kpi.growthRate, 1)}%`, icon: <TrendingUp className="h-5 w-5 text-ink" />, change: "GDP YoY", outlook: Number(kpi.growthRate) >= 0 ? 'growth' as const : 'decline' as const },
    { label: "Data Points", value: formatIndianNumber(kpi.dataPoints, 0), icon: <Activity className="h-5 w-5 text-ink" />, change: kpi.yearsSpan, outlook: 'neutral' as const },
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

  return (
    <div className="w-full px-[6vw] py-12 bg-transparent text-ink pb-32 relative z-10">
      <div className="mb-12 pt-8">
        <div className="eyebrow mb-6">MACRO INDICATORS</div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">Dashboard</h1>
        <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80">
          India National Accounts Statistics — Interactive Analysis
        </p>
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
          <h3 className="font-heading font-bold text-xl mb-2 uppercase">GDP Annual Trend</h3>
          <p className="opacity-75 mb-6 text-sm">Visualizes the absolute size of the Indian economy over time. Current prices reflect nominal growth including inflation, while Constant prices show real economic expansion adjusted to the base year.</p>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={gdpTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="current" name="Current Price" stroke={voltColor} strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: paperColor, stroke: inkColor }} activeDot={{ r: 6 }} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="constant" name="Constant Price" stroke={inkColor} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4, fill: paperColor, stroke: inkColor }} />
            </LineChart>
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
