import { motion, AnimatePresence } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, Legend, ComposedChart } from "recharts";
import { formatIndianNumber } from "@/lib/data-utils";

interface DynamicChartProps {
  activeChapter: number;
  data: {
    gdpTrend: any[];
    growthRates: any[];
    sectoralGVA: any[];
    quarterlyGDP: any[];
    expenditure: any[];
  };
}

export function DynamicChart({ activeChapter, data }: DynamicChartProps) {
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
  const CATEGORICAL_COLORS = [voltColor, creditColor, debitColor, "#a855f7", "#ec4899", "#f97316", "#eab308", "#0ea5e9"];

  const getSectorColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('agriculture') || n.includes('crop') || n.includes('livestock')) return voltColor;
    if (n.includes('manufacturing') || n.includes('mining') || n.includes('electricity') || n.includes('construction')) return '#f97316'; // orange
    return '#3b82f6'; // blue for services
  };

  const renderChart = () => {
    switch (activeChapter) {
      case 0:
        return (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-8 font-heading font-bold text-sm uppercase opacity-50 z-10">The Long Arc: 30 Years of GDP (Current vs Constant)</div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
                <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
                <Line type="monotone" dataKey="current" name="Current Price" stroke={voltColor} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="constant" name="Constant Price" stroke={inkColor} strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        );
      
      case 1:
        return (
          <motion.div key="shock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-8 font-heading font-bold text-sm uppercase opacity-50 z-10">The Shock: GDP YoY Growth Rate</div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${formatIndianNumber(v, 2)}%`, 'Growth']} />
                <Bar dataKey="growth" stroke={inkColor} strokeWidth={2}>
                  {data.growthRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth < 0 ? debitColor : (entry.year_int === 2021 || entry.year_int === 2022 ? voltColor : inkColor)} opacity={entry.year_int >= 2020 && entry.year_int <= 2022 ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div key="rebound" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-8 font-heading font-bold text-sm uppercase opacity-50 z-10 flex gap-4">
              <span>The Rebound: 2022 Sectoral GVA Breakdown</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{backgroundColor: voltColor}}></span> Agriculture</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{backgroundColor: '#f97316'}}></span> Industry</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 inline-block" style={{backgroundColor: '#3b82f6'}}></span> Services</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sectoralGVA} layout="vertical" margin={{ left: 20, top: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}K`} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis type="category" dataKey="industry" width={160} stroke={inkColor} fontSize={11} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA 2022']} />
                <Bar dataKey="value" stroke={inkColor} strokeWidth={2}>
                  {data.sectoralGVA.map((entry, i) => (
                    <Cell key={i} fill={getSectorColor(entry.fullName)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="seasonality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-8 font-heading font-bold text-sm uppercase opacity-50 z-10">Seasonality: Quarterly GDP Spikes</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.quarterlyGDP.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="label" stroke={inkColor} fontSize={11} tickMargin={15} angle={-45} textAnchor="end" height={70} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
                <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', marginTop: '10px' }} />
                <Area type="monotone" dataKey="current" name="Current Price" fill={voltColor} stroke={inkColor} fillOpacity={0.2} strokeWidth={3} />
                <Area type="monotone" dataKey="constant" name="Constant Price" fill={inkColor} stroke={inkColor} fillOpacity={0.1} strokeDasharray="4 4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8 relative">
            <div className="absolute top-4 left-8 font-heading font-bold text-sm uppercase opacity-50 z-10">Trade Balance: Imports vs Exports</div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.expenditure}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="year" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
                <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
                <Area type="monotone" dataKey="Exports" stackId="1" fill={voltColor} stroke={inkColor} fillOpacity={0.8} strokeWidth={2} />
                <Area type="monotone" dataKey="Imports" stackId="2" fill={debitColor} stroke={inkColor} fillOpacity={0.8} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-paper">
      <AnimatePresence mode="wait">
        {renderChart()}
      </AnimatePresence>
    </div>
  );
}
