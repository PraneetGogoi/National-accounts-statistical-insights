import { useEffect, useState } from "react";
import { loadNASData, getGDPTrend, getSectoralGVA, getExpenditureComponents, getGrowthRates, getQuarterlyGDP, getKPISummary, NASRecord } from "@/lib/data-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndianRupee, TrendingUp, BarChart3, Activity } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from "recharts";

const COLORS = ["#0ea5e9", "#ec4899", "#34d399", "#f59e0b", "#a78bfa", "#f87171", "#2dd4bf", "#c084fc", "#4ade80"];

export default function Dashboard() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading economic data...</p>
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
    { label: "GDP (Current)", value: `₹${kpi.gdpCurrent} L Cr`, icon: IndianRupee, change: `+${kpi.yoyGrowth}%` },
    { label: "GDP (Constant)", value: `₹${kpi.gdpConstant} L Cr`, icon: BarChart3, change: "Base 2011-12" },
    { label: "Growth Rate", value: `${kpi.growthRate}%`, icon: TrendingUp, change: "GDP YoY" },
    { label: "Data Points", value: kpi.dataPoints.toLocaleString(), icon: Activity, change: kpi.yearsSpan },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">India National Accounts Statistics — Interactive Analysis</p>
      </div>

      {/* Base Year Toggle */}
      <Tabs value={baseYear} onValueChange={setBaseYear} className="w-fit">
        <TabsList>
          <TabsTrigger value="2011-12">Base 2011-12</TabsTrigger>
          <TabsTrigger value="2022-23">Base 2022-23</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <Card key={k.label} className="card-glow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{k.label}</p>
                  <p className="text-2xl font-heading font-bold mt-1">{k.value}</p>
                  <p className="text-xs text-primary mt-1">{k.change}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <k.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GDP Trend + Growth Rate */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="font-heading text-lg">📈 GDP Annual Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`, '']}
                />
                <Legend />
                <Line type="monotone" dataKey="current" name="Current Price" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="constant" name="Constant Price" stroke="#ec4899" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="font-heading text-lg">📊 GDP Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`${v.toFixed(2)}%`, 'Growth']}
                />
                <Bar dataKey="growth" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sectoral GVA + Pie */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="font-heading text-lg">🏭 Sectoral GVA Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectoralGVA} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}K Cr`} />
                <YAxis type="category" dataKey="industry" width={140} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`₹${v.toFixed(1)} K Crore`, 'GVA']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sectoralGVA.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader>
            <CardTitle className="font-heading text-lg">🗺️ Economy Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={sectoralGVA}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={140}
                  dataKey="value"
                  nameKey="industry"
                  label={({ industry, percent }) => `${industry.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sectoralGVA.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  formatter={(v: number) => [`₹${v.toFixed(1)} K Crore`, 'GVA']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expenditure Stacked Area */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg">💸 Expenditure Components — Stacked Area</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={expenditure}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="Private FCE" stackId="1" fill="#0ea5e9" stroke="#0ea5e9" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Government FCE" stackId="1" fill="#34d399" stroke="#34d399" fillOpacity={0.6} />
              <Area type="monotone" dataKey="GFCF" stackId="1" fill="#f59e0b" stroke="#f59e0b" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Exports" stackId="1" fill="#a78bfa" stroke="#a78bfa" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Imports" stackId="1" fill="#f87171" stroke="#f87171" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quarterly GDP */}
      <Card className="card-glow">
        <CardHeader>
          <CardTitle className="font-heading text-lg">📊 Quarterly GDP Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={quarterlyGDP}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={9} angle={-45} textAnchor="end" height={60} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`, '']}
              />
              <Legend />
              <Area type="monotone" dataKey="current" name="Current Price" fill="#0ea5e9" stroke="#0ea5e9" fillOpacity={0.3} />
              <Area type="monotone" dataKey="constant" name="Constant Price" fill="#ec4899" stroke="#ec4899" fillOpacity={0.2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <footer className="text-center text-xs text-muted-foreground py-4">
        Source: MoSPI, Government of India | Base Year: {baseYear}
      </footer>
    </div>
  );
}
