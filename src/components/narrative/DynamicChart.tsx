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

  const renderChart = () => {
    switch (activeChapter) {
      case 0:
      case 1:
        return (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
                {activeChapter === 1 && <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />}
                <Line type="monotone" dataKey="current" name="Current Price" stroke={voltColor} strokeWidth={activeChapter === 0 ? 3 : 5} dot={activeChapter === 1 ? { r: 5, fill: paperColor, stroke: inkColor, strokeWidth: 2 } : false} activeDot={activeChapter === 1 ? { r: 8 } : false} />
                <Line type="monotone" dataKey="constant" name="Constant Price" stroke={inkColor} strokeWidth={activeChapter === 0 ? 2 : 3} strokeDasharray="5 5" dot={activeChapter === 1 ? { r: 4, fill: paperColor, stroke: inkColor, strokeWidth: 2 } : false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div key="shock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${formatIndianNumber(v, 2)}%`, 'Growth']} />
                <Bar dataKey="growth" stroke={inkColor} strokeWidth={2}>
                  {data.growthRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth < 0 ? debitColor : inkColor} opacity={entry.year_int === 2020 || entry.year_int === 2021 ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div key="rebound" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sectoralGVA} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}K`} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis type="category" dataKey="industry" width={140} stroke={inkColor} fontSize={11} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']} />
                <Bar dataKey="value" stroke={inkColor} strokeWidth={2}>
                  {data.sectoralGVA.map((_, i) => (
                    <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="seasonality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.quarterlyGDP}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} vertical={false} />
                <XAxis dataKey="label" stroke={inkColor} fontSize={11} tickMargin={15} angle={-45} textAnchor="end" height={70} axisLine={false} tickLine={false} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']} />
                <Area type="monotone" dataKey="current" fill={voltColor} stroke={inkColor} fillOpacity={0.2} strokeWidth={3} />
                <Area type="monotone" dataKey="constant" fill={inkColor} stroke={inkColor} fillOpacity={0.1} strokeDasharray="4 4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );

      case 5:
      case 6:
        return (
          <motion.div key="trade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
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
