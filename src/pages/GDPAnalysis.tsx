import { useEffect, useState, useMemo } from "react";
import { loadNASData, getGDPTrend, getGrowthRates, NASRecord } from "@/lib/data-utils";
import {
  LineChart, Line, ComposedChart, Bar, AreaChart, Area, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, ReferenceArea
} from "recharts";
import { BrutalistCard } from "@/components/ui/brutal/BrutalistCard";
import { BrutalistPill } from "@/components/ui/brutal/BrutalistPill";

function polyFit(xVals: number[], yVals: number[], degree = 2) {
  const n = xVals.length;
  const size = degree + 1;

  const X: number[][] = xVals.map(x => {
    const row: number[] = [];
    for (let d = 0; d <= degree; d++) row.push(Math.pow(x, d));
    return row;
  });

  const XtX: number[][] = Array.from({ length: size }, (_, i) =>
    Array.from({ length: size }, (_, j) =>
      X.reduce((sum, row) => sum + row[i] * row[j], 0)
    )
  );

  const Xty: number[] = Array.from({ length: size }, (_, i) =>
    X.reduce((sum, row, k) => sum + row[i] * yVals[k], 0)
  );

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

  const yMean = yVals.reduce((s, v) => s + v, 0) / n;
  const ssRes = yVals.reduce((s, y, i) => s + Math.pow(y - predict(xVals[i]), 2), 0);
  const ssTot = yVals.reduce((s, y) => s + Math.pow(y - yMean, 2), 0);
  const r2 = 1 - ssRes / ssTot;

  return { predict, coeffs, r2 };
}

function cagrForecast(gdpData: { year_int: number; current: number }[], yearsAhead: number) {
  if (gdpData.length < 2) return [];
  const recent = gdpData.slice(-5);
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

const ANIM_DUR = 800;
const ANIM_EASE = "ease-out";

export default function GDPAnalysis() {
  const [data, setData] = useState<NASRecord[]>([]);
  const [baseYear, setBaseYear] = useState("2011-12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNASData().then(d => { setData(d); setLoading(false); });
  }, []);

  const gdpTrend = useMemo(() => getGDPTrend(data, baseYear), [data, baseYear]);
  const growthRates = useMemo(() => getGrowthRates(data, baseYear), [data, baseYear]);

  const forecast = useMemo(() => {
    if (gdpTrend.length < 3) return null;

    const xVals = gdpTrend.map(d => d.year_int);
    const yVals = gdpTrend.map(d => d.current);
    const xMin = Math.min(...xVals);
    const xNorm = xVals.map(x => x - xMin);

    const model = polyFit(xNorm, yVals, 2);
    const cagrResult = cagrForecast(gdpTrend, 5);
    if (!cagrResult || !('cagr' in cagrResult)) return null;

    const lastYear = Math.max(...xVals);
    const lastGDP = gdpTrend[gdpTrend.length - 1].current;

    const chartData = gdpTrend.map(d => ({
      year_int: d.year_int,
      actual: d.current,
      polyForecast: null as number | null,
      cagrForecast: null as number | null,
      type: 'historical' as string,
    }));

    const forecastYears = [];
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

  const waterfallData = useMemo(() => {
    if(!gdpTrend || gdpTrend.length === 0) return [];
    return gdpTrend.slice(1).map((d, i) => ({
      year: d.year_int,
      change: d.current - gdpTrend[i].current,
      positive: d.current >= gdpTrend[i].current,
    }));
  }, [gdpTrend]);

  const deflatorData = useMemo(() => {
    if(!gdpTrend) return [];
    return gdpTrend.map(d => ({
      year: d.year_int,
      deflator: d.constant > 0 ? (d.current / d.constant * 100) : 100,
      current: d.current,
    }));
  }, [gdpTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-transparent">
        <div className="w-12 h-12 border-4 border-ink border-t-volt rounded-full animate-spin" />
      </div>
    );
  }

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
        <div className="eyebrow mb-6">RAW LEDGER ANALYSIS</div>
        <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase tracking-tighter mb-4">GDP Deep Dive</h1>
        <p className="text-xl font-medium max-w-[40ch] border-l-[3px] border-ink pl-5 opacity-80">
          Analyzing India's Gross Domestic Product trends, patterns & 5-year forecast.
        </p>
      </div>

      <div className="flex gap-4 mb-16">
        <BrutalistPill active={baseYear === "2011-12"} onClick={() => setBaseYear("2011-12")}>BASE 2011-12</BrutalistPill>
        <BrutalistPill active={baseYear === "2022-23"} onClick={() => setBaseYear("2022-23")}>BASE 2022-23</BrutalistPill>
      </div>

      {forecast && (
        <div className="space-y-12">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold uppercase">🔮 GDP 5-Year Forecast</h2>
            <span className="font-numbers text-xs font-bold border-[3px] border-ink px-3 py-1 shadow-[3px_3px_0_var(--ink)] bg-volt text-white">
              R² = {forecast.r2.toFixed(3)} | CAGR = {(forecast.cagr * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {forecast.forecastYears.map((fy, i) => (
              <BrutalistCard key={fy.year_int} delay={i * 0.1}>
                <span className={`absolute -top-0.5 -right-0.5 font-numbers font-bold text-xs tracking-wider px-3 py-2 border-l-[3px] border-b-[3px] border-ink ${fy.outlook === 'growth' ? 'bg-credit text-ink' : 'bg-debit text-paper'}`}>
                  {fy.outlook === 'growth' ? 'TREND UP' : 'TREND DN'}
                </span>
                <div className="text-sm font-numbers font-semibold opacity-70 mb-2">FY {fy.year_int}</div>
                <div className="font-heading font-bold text-2xl mb-1">₹{fy.avgGDP.toFixed(0)}</div>
                <div className="font-numbers text-sm">
                  {fy.outlook === 'growth' ? '+' : ''}{((fy.avgGDP - (forecast.forecastYears[forecast.forecastYears.indexOf(fy) - 1]?.avgGDP || forecast.lastGDP)) / (forecast.forecastYears[forecast.forecastYears.indexOf(fy) - 1]?.avgGDP || forecast.lastGDP) * 100).toFixed(1)}% avg
                </div>
              </BrutalistCard>
            ))}
          </div>

          <BrutalistCard delay={0.2}>
            <h3 className="font-heading font-bold text-xl mb-2 uppercase">📈 GDP Forecast — Poly vs CAGR</h3>
            <p className="opacity-75 mb-6 text-sm">Two models compared: Quadratic polynomial regression (curve) and Compound Annual Growth Rate projection (linear).</p>
            <ResponsiveContainer width="100%" height={450}>
              <LineChart data={forecast.chartData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
                <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
                <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} fontFamily='"IBM Plex Mono", monospace' />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | null) => v !== null ? [`₹${v.toFixed(1)} K Cr`, ''] : ['-', '']} />
                <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px', marginTop: '10px' }} />
                <ReferenceArea
                  x1={forecast.lastYear}
                  x2={forecast.lastYear + 5}
                  fill={voltColor}
                  fillOpacity={0.08}
                />
                <ReferenceLine x={forecast.lastYear} stroke={inkColor} strokeWidth={2} strokeDasharray="6 6" />
                <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="actual" name="Historical GDP" stroke={inkColor} strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: paperColor, stroke: inkColor }} connectNulls={false} />
                <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="polyForecast" name="Poly Forecast" stroke={creditColor} strokeWidth={3} strokeDasharray="8 4" dot={{ r: 4, fill: creditColor, stroke: inkColor, strokeWidth: 2 }} connectNulls={false} />
                <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="cagrForecast" name="CAGR Forecast" stroke={voltColor} strokeWidth={3} strokeDasharray="4 4" dot={{ r: 4, fill: voltColor, stroke: inkColor, strokeWidth: 2 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </BrutalistCard>

          <BrutalistCard className="overflow-hidden !p-0" delay={0.3}>
            <div className="p-6">
              <h3 className="font-heading font-bold text-xl mb-2 uppercase">📋 Forecast Details Table</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y-[3px] border-ink bg-ink/5">
                    <th className="p-4 font-numbers uppercase text-sm">Fiscal Year</th>
                    <th className="p-4 font-numbers uppercase text-sm text-right">Poly GDP</th>
                    <th className="p-4 font-numbers uppercase text-sm text-right">Poly Growth</th>
                    <th className="p-4 font-numbers uppercase text-sm text-right">CAGR GDP</th>
                    <th className="p-4 font-numbers uppercase text-sm text-right">CAGR Growth</th>
                    <th className="p-4 font-numbers uppercase text-sm text-center">Outlook</th>
                  </tr>
                </thead>
                <tbody className="font-numbers text-sm">
                  <tr className="border-b-[3px] border-ink/20">
                    <td className="p-4 font-bold">FY {forecast.lastYear} (Actual)</td>
                    <td className="p-4 text-right">₹{forecast.lastGDP.toFixed(0)}</td>
                    <td className="p-4 text-right">—</td>
                    <td className="p-4 text-right">₹{forecast.lastGDP.toFixed(0)}</td>
                    <td className="p-4 text-right">—</td>
                    <td className="p-4 text-center">—</td>
                  </tr>
                  {forecast.forecastYears.map((fy) => (
                    <tr key={fy.year_int} className="border-b-[3px] border-ink/20 hover:bg-ink/5 transition-colors">
                      <td className="p-4 font-bold">FY {fy.year_int}</td>
                      <td className="p-4 text-right">₹{fy.polyGDP.toFixed(0)}</td>
                      <td className={`p-4 text-right font-bold ${parseFloat(fy.polyGrowth) >= 0 ? 'text-credit' : 'text-debit'}`}>
                        {parseFloat(fy.polyGrowth) >= 0 ? '+' : ''}{fy.polyGrowth}%
                      </td>
                      <td className="p-4 text-right">₹{fy.cagrGDP.toFixed(0)}</td>
                      <td className={`p-4 text-right font-bold ${parseFloat(fy.cagrGrowth) >= 0 ? 'text-credit' : 'text-debit'}`}>
                        {parseFloat(fy.cagrGrowth) >= 0 ? '+' : ''}{fy.cagrGrowth}%
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 border-[3px] border-ink font-bold text-xs shadow-[2px_2px_0_var(--ink)] ${fy.outlook === 'growth' ? 'bg-credit text-ink' : 'bg-debit text-paper'}`}>
                          {fy.outlook === 'growth' ? 'GROWTH' : 'DECLINE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BrutalistCard>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mt-12">
        <BrutalistCard delay={0.1}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">GDP Trend — Current vs Constant</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={gdpTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '12px' }} />
              <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="current" name="Current Price" fill={voltColor} stroke={inkColor} strokeWidth={3} fillOpacity={0.2} />
              <Area animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="constant" name="Constant Price" fill={creditColor} stroke={inkColor} strokeWidth={3} fillOpacity={0.2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.2}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">GDP Growth Rate (%)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={growthRates}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year_int" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `${v}%`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)}%`]} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="growth" fill={voltColor} stroke={inkColor} strokeWidth={2} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="growth" stroke={inkColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: paperColor, stroke: inkColor }} />
            </ComposedChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.3}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">📉 GDP YoY Change (Waterfall)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} tickFormatter={v => `₹${v.toFixed(0)}`} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v.toFixed(1)} K Cr`]} />
              <Bar animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} dataKey="change" stroke={inkColor} strokeWidth={2}>
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.positive ? creditColor : debitColor} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </BrutalistCard>

        <BrutalistCard delay={0.4}>
          <h3 className="font-heading font-bold text-xl mb-6 uppercase">GDP Deflator Index</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={deflatorData}>
              <CartesianGrid strokeDasharray="3 3" stroke={inkColor} opacity={0.2} />
              <XAxis dataKey="year" stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <YAxis stroke={inkColor} fontSize={11} fontFamily='"IBM Plex Mono", monospace' />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v.toFixed(1), 'Deflator']} />
              <Line animationDuration={ANIM_DUR} animationEasing={ANIM_EASE} type="monotone" dataKey="deflator" name="GDP Deflator" stroke={inkColor} strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: voltColor, stroke: inkColor }} />
            </LineChart>
          </ResponsiveContainer>
        </BrutalistCard>
      </div>
    </div>
  );
}
