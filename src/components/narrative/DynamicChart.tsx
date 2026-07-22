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
  const renderChart = () => {
    switch (activeChapter) {
      case 0:
      case 1:
        return (
          <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  labelStyle={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
                />
                {activeChapter === 1 && <Legend iconType="circle" />}
                <Line type="monotone" dataKey="current" name="Current Price" stroke="#3b82f6" strokeWidth={activeChapter === 0 ? 2 : 4} dot={activeChapter === 1 ? { r: 4 } : false} activeDot={activeChapter === 1 ? { r: 8 } : false} />
                <Line type="monotone" dataKey="constant" name="Constant Price" stroke="#94a3b8" strokeWidth={activeChapter === 0 ? 1 : 3} strokeDasharray="5 5" dot={activeChapter === 1 ? { r: 4 } : false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div key="shock" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.growthRates}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} className="font-numbers" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  labelStyle={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(v: number) => [`${formatIndianNumber(v, 2)}%`, 'Growth']}
                />
                <Bar dataKey="growth" radius={[4, 4, 0, 0]}>
                  {data.growthRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth < 0 ? '#dc2626' : '#94a3b8'} opacity={entry.year_int === 2020 || entry.year_int === 2021 ? 1 : 0.3} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        );
        
      case 3:
        const CATEGORICAL_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308"];
        return (
          <motion.div key="rebound" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="w-full h-full p-4 md:p-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.sectoralGVA} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}K`} className="font-numbers" />
                <YAxis type="category" dataKey="industry" width={140} stroke="hsl(var(--foreground))" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
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
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={15} angle={-45} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
                />
                <Area type="monotone" dataKey="current" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="constant" fill="#94a3b8" stroke="#94a3b8" fillOpacity={0.1} strokeDasharray="4 4" strokeWidth={2} />
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
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="Exports" stackId="1" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.7} strokeWidth={1} />
                <Area type="monotone" dataKey="Imports" stackId="2" fill="#f43f5e" stroke="#f43f5e" fillOpacity={0.7} strokeWidth={1} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-background/50">
      <AnimatePresence mode="wait">
        {renderChart()}
      </AnimatePresence>
    </div>
  );
}
