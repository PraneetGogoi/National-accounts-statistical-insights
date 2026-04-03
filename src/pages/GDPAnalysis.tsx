import { useEffect, useState, useMemo } from "react";
import { loadNASData, getGDPTrend, getGrowthRates, NASRecord } from "@/lib/data-utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import {
  LineChart, Line, ComposedChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from "recharts";

/**
 * Simple polynomial regression (degree 2) for GDP forecasting.
 * Fits: GDP = a*x^2 + b*x + c using least squares.
 */
function polyFit(xVals: number[], yVals: number[], degree = 2) {
  const n = xVals.length;
  const size = degree + 1;

  // Build Vandermonde matrix and solve normal equations
  const X: number[][] = xVals.map(x => {
    const row: number[] = [];
    for (let d = 0; d <= degree; d++) row.push(Math.pow(x, d));
    return row;
  });

  // X^T * X
  const XtX: number[][] = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) =>
      X.reduce((sum, row) => sum + row[i] * row[j], 0)
    )
  );

  // X^T * y
  const Xty: number[] = Array.from({ length: size }, (_, i) =>
    X.reduce((sum, row, k) => sum + row[i] * yVals[k], 0)
  );

  // Solve via Gaussian elimination
  const augmented = XtX.map((row, i) => [...row, Xty[i]]);
  for (let col = 0; col < size; col++) {
    let maxRow = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) maxRow = row;
    }
    [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];
    const pivot = augmented[col][col];
    if (Math.abs(pivot) < 1e-12) continue;
    for (let j = col; j <= size; j++) augmented[col][j] /= pivot;
    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = col; j <= size; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  const coeffs = augmented.map(row => row[size]);

  const predict = (x: number) => coeffs.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);

  // R² score
  const yMean = yVals.reduce((s, v) => s + v, 0) / n;
  const ssRes = yVals.reduce((s, y, i) => s + Math.pow(y - predict(xVals[i]), 2), 0);
  const ssTot = yVals.reduce((s, y) => s + Math.pow(y - yMean, 2), 0);
  const r2 = 1 - ssRes / ssTot;

  return { predict, coeffs, r2 };
}

/**
 * Also compute CAGR-based linear forecast for comparison
 */
function cagrForecast(gdpData: { year_int: number; current: number }[], yearsAhead: number) {
  if (gdpData.length < 2) return [];
  const recent = gdpData.slice(-5); // use last 5 years for CAGR
  const first = recent[0];
  const last = recent[recent.length - 1];
  const years = last.year_int - first.year_int;
  const cagr = years > 0 ? Math.pow(last.current / first.current, 1 / years) - 1 : 0;

  const forecasts = [];
  for (let i = 1; i <= yearsAhead; i++) {
    forecasts.push({
      year_int: last.year_int + i,
      forecast: last.current * Math.pow(1 + cagr, i),
    });
  }
  return { forecasts, cagr };
}

export default function GDPAnalysis() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  const gdpTrend = useMemo(() => getGDPTrend(data, baseYear), [data, baseYear]);
  const growthRates = useMemo(() => getGrowthRates(data, baseYear), [data, baseYear]);

  // Forecast computation
  const forecast = useMemo(() => {
    if (gdpTrend.length < 3) return null;

    const xVals = gdpTrend.map(d => d.year_int);
    const yVals = gdpTrend.map(d => d.current);

    // Normalize x for numerical stability
    const xMin = Math.min(...xVals);
    const xNorm = xVals.map(x => x - xMin);

    const model = polyFit(xNorm, yVals, 2);
    const cagrResult = cagrForecast(gdpTrend, 5);
    if (!cagrResult || !('cagr' in cagrResult)) return null;

    const lastYear = Math.max(...xVals);
    const lastGDP = gdpTrend[gdpTrend.length - 1].current;

    // Build combined chart data: historical + forecast
    const chartData = gdpTrend.map(d => ({
      year_int: d.year_int,
      actual: d.current,
      polyForecast: null as number | null,
      cagrForecast: null as number | null,
      type: 'historical' as string,
    }));

    const forecastYears: {
      year_int: number;
      polyGDP: number;
      cagrGDP: number;
      polyGrowth: string;
      cagrGrowth: string;
      avgGDP: number;
      outlook: 'growth' | 'loss';
    }[] = [];

    let prevPoly = lastGDP;
    let prevCagr = lastGDP;

    for (let i = 1; i <= 5; i++) {
      const fy = lastYear + i;
      const polyVal = Math.max(0, model.predict(fy - xMin));
      const cagrVal = cagrResult.forecasts[i - 1]?.forecast || 0;
      const avgVal = (polyVal + cagrVal) / 2;

      const polyGrowthPct = ((polyVal - prevPoly) / prevPoly * 100);
      const cagrGrowthPct = ((cagrVal - prevCagr) / prevCagr * 100);

      forecastYears.push({
        year_int: fy,
        polyGDP: polyVal,
        cagrGDP: cagrVal,
        polyGrowth: polyGrowthPct.toFixed(1),
        cagrGrowth: cagrGrowthPct.toFixed(1),
        avgGDP: avgVal,
        outlook: avgVal > prevPoly ? 'growth' : 'loss',
      });

      chartData.push({
        year_int: fy,
        actual: null as number | null,
        polyForecast: polyVal,
        cagrForecast: cagrVal,
        type: 'forecast' as string,
      });

      prevPoly = polyVal;
      prevCagr = cagrVal;
    }

    // Connect the last historical point to forecast
    const lastHistIdx = gdpTrend.length - 1;
    chartData[lastHistIdx] = {
      ...chartData[lastHistIdx],
      polyForecast: chartData[lastHistIdx].actual,
      cagrForecast: chartData[lastHistIdx].actual,
    };

    return {
      chartData,
      forecastYears,
      r2: model.r2,
      cagr: cagrResult.cagr,
      lastYear,
      lastGDP,
    };
  }, [gdpTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const waterfallData = gdpTrend.slice(1).map((d, i) => ({
    year: d.year_int,
    change: d.current - gdpTrend[i].current,
    positive: d.current >= gdpTrend[i].current,
  }));

  const deflatorData = gdpTrend.map(d => ({
    year: d.year_int,
    deflator: d.constant > 0 ? (d.current / d.constant * 100) : 100,
    current: d.current,
  }));

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    color: 'hsl(var(--foreground))',
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">GDP Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">Deep dive into India's Gross Domestic Product trends, patterns & 5-year forecast</p>
      </div>

      <Tabs value={baseYear} onValueChange={setBaseYear} className="w-fit">
        <TabsList>
          <TabsTrigger value="2011-12">Base 2011-12</TabsTrigger>
          <TabsTrigger value="2022-23">Base 2022-23</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── 5-YEAR FORECAST SECTION ─── */}
      {forecast && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-heading font-bold">🔮 GDP 5-Year Forecast</h2>
            <Badge variant="secondary" className="text-xs">
              R² = {forecast.r2.toFixed(3)} | CAGR = {(forecast.cagr * 100).toFixed(1)}%
            </Badge>
          </div>

          {/* Forecast Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {forecast.forecastYears.map((fy) => (
              <Card key={fy.year_int} className={`card-glow border-l-4 ${fy.outlook === 'growth' ? 'border-l-chart-3' : 'border-l-destructive'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-muted-foreground">FY {fy.year_int}</span>
                    {fy.outlook === 'growth' ? (
                      <TrendingUp className="h-4 w-4 text-chart-3" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <p className="text-lg font-heading font-bold">₹{fy.avgGDP.toFixed(0)} K Cr</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs font-medium ${fy.outlook === 'growth' ? 'text-chart-3' : 'text-destructive'}`}>
                      {fy.outlook === 'growth' ? '+' : ''}{((fy.avgGDP - (forecast.forecastYears[forecast.forecastYears.indexOf(fy) - 1]?.avgGDP || forecast.lastGDP)) / (forecast.forecastYears[forecast.forecastYears.indexOf(fy) - 1]?.avgGDP || forecast.lastGDP) * 100).toFixed(1)}% avg
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Forecast Chart */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg">📈 GDP Forecast — Polynomial Trend vs CAGR Projection</CardTitle>
              <CardDescription>
                Two models compared: Quadratic polynomial regression (curve) and Compound Annual Growth Rate projection (linear). 
                Shaded area shows the forecast zone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={forecast.chartData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | null) => v !== null ? [`₹${v.toFixed(1)} K Cr`, ''] : ['-', '']} />
                  <Legend />
                  <ReferenceArea
                    x1={forecast.lastYear}
                    x2={forecast.lastYear + 5}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.05}
                    label={{ value: 'Forecast Zone', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <ReferenceLine x={forecast.lastYear} stroke="hsl(var(--muted-foreground))" strokeDasharray="8 4" label={{ value: 'Now', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Line type="monotone" dataKey="actual" name="Historical GDP" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
                  <Line type="monotone" dataKey="polyForecast" name="Poly Forecast" stroke="#34d399" strokeWidth={2.5} strokeDasharray="8 4" dot={{ r: 4, fill: '#34d399' }} connectNulls={false} />
                  <Line type="monotone" dataKey="cagrForecast" name="CAGR Forecast" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4, fill: '#f59e0b' }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast Details Table */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg">📋 Forecast Details</CardTitle>
              <CardDescription>Year-wise GDP projections with growth rates from both models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-heading font-semibold text-muted-foreground">Fiscal Year</th>
                      <th className="text-right py-3 px-4 font-heading font-semibold text-muted-foreground">Poly GDP (₹K Cr)</th>
                      <th className="text-right py-3 px-4 font-heading font-semibold text-muted-foreground">Poly Growth</th>
                      <th className="text-right py-3 px-4 font-heading font-semibold text-muted-foreground">CAGR GDP (₹K Cr)</th>
                      <th className="text-right py-3 px-4 font-heading font-semibold text-muted-foreground">CAGR Growth</th>
                      <th className="text-center py-3 px-4 font-heading font-semibold text-muted-foreground">Outlook</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border bg-muted/30">
                      <td className="py-3 px-4 font-medium">FY {forecast.lastYear} (Actual)</td>
                      <td className="text-right py-3 px-4 font-mono">₹{forecast.lastGDP.toFixed(0)}</td>
                      <td className="text-right py-3 px-4">—</td>
                      <td className="text-right py-3 px-4 font-mono">₹{forecast.lastGDP.toFixed(0)}</td>
                      <td className="text-right py-3 px-4">—</td>
                      <td className="text-center py-3 px-4">—</td>
                    </tr>
                    {forecast.forecastYears.map((fy) => (
                      <tr key={fy.year_int} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium">FY {fy.year_int}</td>
                        <td className="text-right py-3 px-4 font-mono">₹{fy.polyGDP.toFixed(0)}</td>
                        <td className={`text-right py-3 px-4 font-medium ${parseFloat(fy.polyGrowth) >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
                          {parseFloat(fy.polyGrowth) >= 0 ? '+' : ''}{fy.polyGrowth}%
                        </td>
                        <td className="text-right py-3 px-4 font-mono">₹{fy.cagrGDP.toFixed(0)}</td>
                        <td className={`text-right py-3 px-4 font-medium ${parseFloat(fy.cagrGrowth) >= 0 ? 'text-chart-3' : 'text-destructive'}`}>
                          {parseFloat(fy.cagrGrowth) >= 0 ? '+' : ''}{fy.cagrGrowth}%
                        </td>
                        <td className="text-center py-3 px-4">
                          <Badge variant={fy.outlook === 'growth' ? 'default' : 'destructive'} className="text-xs">
                            {fy.outlook === 'growth' ? '📈 Growth' : '📉 Decline'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-4 italic">
                ⚠️ Disclaimer: Forecasts are based on historical trend extrapolation using polynomial regression (degree 2) and CAGR. 
                Actual GDP may differ due to policy changes, global conditions, and structural shifts. For informational purposes only.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── EXISTING CHARTS ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">GDP Trend — Current vs Constant</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={gdpTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="current" name="Current Price (₹K Cr)" fill="#0ea5e9" stroke="#0ea5e9" fillOpacity={0.3} />
                <Area type="monotone" dataKey="constant" name="Constant Price (₹K Cr)" fill="#ec4899" stroke="#ec4899" fillOpacity={0.15} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">GDP Growth Rate (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={growthRates}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year_int" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`]} />
                <Bar dataKey="growth" fill="#0ea5e9" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line type="monotone" dataKey="growth" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">📉 GDP YoY Change (Waterfall)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`]} />
                <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                  {waterfallData.map((d, i) => (
                    <Cell key={i} fill={d.positive ? '#34d399' : '#f87171'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="card-glow">
          <CardHeader><CardTitle className="font-heading text-lg">GDP Deflator Index</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={deflatorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(1), 'Deflator']} />
                <Line type="monotone" dataKey="deflator" name="GDP Deflator" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
