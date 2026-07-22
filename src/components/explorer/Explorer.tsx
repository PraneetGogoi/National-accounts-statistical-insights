import { useEffect, useState } from "react";
import { loadNASData, getGDPTrend, getSectoralGVA, getExpenditureComponents, getGrowthRates, getQuarterlyGDP, getKPISummary, NASRecord, formatIndianNumber } from "@/lib/data-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, TrendingUp, BarChart3, Activity } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from "recharts";

const CATEGORICAL_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308"];

export default function Dashboard() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const kpi = getKPISummary(data);
  const gdpTrend = getGDPTrend(data, baseYear);
  const sectoralGVA = getSectoralGVA(data, baseYear);
  const expenditure = getExpenditureComponents(data, baseYear);
  const growthRates = getGrowthRates(data, baseYear);
  const quarterlyGDP = getQuarterlyGDP(data, baseYear);

  const kpiCards = [
    { label: "GDP (Current)", value: `₹${formatIndianNumber(kpi.gdpCurrent, 1)} L Cr`, icon: IndianRupee, change: `+${formatIndianNumber(kpi.yoyGrowth, 1)}%` },
    { label: "GDP (Constant)", value: `₹${formatIndianNumber(kpi.gdpConstant, 1)} L Cr`, icon: BarChart3, change: "Base 2011-12" },
    { label: "Growth Rate", value: `${formatIndianNumber(kpi.growthRate, 1)}%`, icon: TrendingUp, change: "GDP YoY" },
    { label: "Data Points", value: formatIndianNumber(kpi.dataPoints, 0), icon: Activity, change: kpi.yearsSpan },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-base mt-2">India National Accounts Statistics — Interactive Analysis</p>
      </div>

      {/* Base Year Toggle */}
      <Tabs value={baseYear} onValueChange={setBaseYear} className="w-fit">
        <TabsList>
          <TabsTrigger value="2011-12">Base 2011-12</TabsTrigger>
          <TabsTrigger value="2022-23">Base 2022-23</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((k, i) => (
          <Card key={k.label} className="card-glow border-muted">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
                  <p className="text-3xl font-numbers font-bold mt-2">{k.value}</p>
                  <p className="text-xs font-numbers font-medium text-primary mt-1">{k.change}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <k.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GDP Trend + Growth Rate */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">GDP Annual Trend</CardTitle>
            <CardDescription>Visualizes the absolute size of the Indian economy over time. Current prices reflect nominal growth including inflation, while Constant prices show real economic expansion adjusted to the base year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  labelStyle={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="current" name="Current Price" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="constant" name="Constant Price" stroke="#94a3b8" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">GDP Growth Rate (YoY)</CardTitle>
            <CardDescription>Shows the year-over-year percentage change in real GDP. The bars indicate positive or negative growth, highlighting economic cycles and major contractions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={growthRates}>
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
                  {growthRates.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.growth < 0 ? '#dc2626' : '#16a34a'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="growth" stroke="#475569" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly GDP (Moved up as secondary drilldown) */}
      <Card className="border-muted shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Quarterly GDP Dashboard & Seasonality</CardTitle>
          <CardDescription>Breaks down GDP into financial quarters (Q1-Q4) to reveal seasonal patterns in economic activity, such as post-harvest bumps or festive season spending.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={quarterlyGDP}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={15} angle={-45} textAnchor="end" height={70} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                labelStyle={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: '4px' }}
                formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="current" name="Current Price" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="constant" name="Constant Price" fill="#94a3b8" stroke="#94a3b8" fillOpacity={0.1} strokeDasharray="4 4" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sectoral GVA + Pie */}
      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Sectoral GVA Breakdown</CardTitle>
            <CardDescription>Compares the absolute Gross Value Added (GVA) across major industries, showing which sectors are the largest drivers of the economy in the selected base year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectoralGVA} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}K`} className="font-numbers" />
                <YAxis type="category" dataKey="industry" width={140} stroke="hsl(var(--foreground))" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  labelStyle={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, marginBottom: '4px' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sectoralGVA.map((_, i) => (
                    <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Economy Structure (GVA Share)</CardTitle>
            <CardDescription>Displays the proportional contribution of each industry to the total economy, illustrating India's shift between agriculture, manufacturing, and services.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
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
                >
                  {sectoralGVA.map((_, i) => (
                    <Cell key={i} fill={CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                  formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Crore`, 'GVA']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expenditure Stacked Area */}
      <Card className="border-muted shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Expenditure Components (Stacked Area)</CardTitle>
          <CardDescription>Breaks down GDP by expenditure type (Consumption, Investment, Government spending, Net Exports), showing how economic output is utilized.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={expenditure}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} tickFormatter={v => `₹${formatIndianNumber(v, 0)}`} className="font-numbers" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                itemStyle={{ fontFamily: 'JetBrains Mono, monospace' }}
                labelStyle={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, marginBottom: '4px' }}
                formatter={(v: number) => [`₹${formatIndianNumber(v, 1)} K Cr`, '']}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="Private FCE" stackId="1" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.7} strokeWidth={1} />
              <Area type="monotone" dataKey="Government FCE" stackId="1" fill="#6366f1" stroke="#6366f1" fillOpacity={0.7} strokeWidth={1} />
              <Area type="monotone" dataKey="GFCF" stackId="1" fill="#8b5cf6" stroke="#8b5cf6" fillOpacity={0.7} strokeWidth={1} />
              <Area type="monotone" dataKey="Exports" stackId="1" fill="#14b8a6" stroke="#14b8a6" fillOpacity={0.7} strokeWidth={1} />
              <Area type="monotone" dataKey="Imports" stackId="1" fill="#f43f5e" stroke="#f43f5e" fillOpacity={0.7} strokeWidth={1} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border mt-8">
        Source: MoSPI, Government of India | Base Year: {baseYear}
      </footer>
    </div>
  );
}
