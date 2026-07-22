import { useEffect, useState } from "react";
import { loadNASData, getSectoralGVA, NASRecord } from "@/lib/data-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#0ea5e9", "#ec4899", "#34d399", "#f59e0b", "#a78bfa", "#f87171", "#2dd4bf", "#c084fc", "#4ade80"];

export default function SectoralView() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const gvaFiltered = data.filter(r => 
    r.indicator === 'Gross Value Added' && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && !r.industry.includes('Total')
  );
  const availableYears = [...new Set(gvaFiltered.map(r => r.year_int))].sort();
  const yearInt = selectedYear ? parseInt(selectedYear) : Math.max(...availableYears);
  
  const sectoralGVA = getSectoralGVA(data, baseYear, yearInt);
  
  // Radar data (normalize to 0-100)
  const maxVal = Math.max(...sectoralGVA.map(s => s.value));
  const radarData = sectoralGVA.slice(0, 8).map(s => ({
    sector: s.industry.substring(0, 20),
    value: (s.value / maxVal * 100),
    rawValue: s.value,
  }));

  // Multi-year comparison
  const compareYears = availableYears.slice(-5);
  const multiYearData = [...new Set(gvaFiltered.filter(r => compareYears.includes(r.year_int)).map(r => r.industry))].map(ind => {
    const row: Record<string, string | number> = { industry: ind.length > 25 ? ind.substring(0, 23) + '...' : ind };
    compareYears.forEach(y => {
      const rec = gvaFiltered.find(r => r.industry === ind && r.year_int === y);
      row[`FY${y}`] = rec ? rec.current_price / 1e5 : 0;
    });
    return row;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Sectoral View</h1>
        <p className="text-muted-foreground text-sm mt-1">Industry-wise Gross Value Added analysis across sectors</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Tabs value={baseYear} onValueChange={setBaseYear} className="w-fit">
          <TabsList>
            <TabsTrigger value="2011-12">Base 2011-12</TabsTrigger>
            <TabsTrigger value="2022-23">Base 2022-23</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={yearInt.toString()} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(y => (
              <SelectItem key={y} value={y.toString()}>FY {y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">🏭 GVA by Sector — FY {yearInt}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectoralGVA} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                <YAxis type="category" dataKey="industry" width={150} stroke="hsl(var(--muted-foreground))" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {sectoralGVA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">🕸️ Sector Radar</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="sector" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                <Radar name="GVA Share" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">🥧 Economy Composition</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={sectoralGVA} cx="50%" cy="50%" outerRadius={140} innerRadius={60} dataKey="value" nameKey="industry" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                  {sectoralGVA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">📊 Multi-Year Comparison (Last 5 Years)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={multiYearData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis type="category" dataKey="industry" width={130} stroke="hsl(var(--muted-foreground))" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Legend />
                {compareYears.map((y, i) => (
                  <Bar key={y} dataKey={`FY${y}`} fill={COLORS[i % COLORS.length]} radius={[0, 2, 2, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
