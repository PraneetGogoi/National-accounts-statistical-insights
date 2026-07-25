export interface NASRecord {
  base_year: string;
  series: string;
  year: string;
  indicator: string;
  frequency: string;
  industry: string;
  subindustry?: string;
  quarter: string;
  current_price: number;
  constant_price: number;
  unit: string;
  year_int: number;
  // Provenance and Anomaly additions
  is_anomaly: boolean;
  flagged_for_review: boolean;
  source_run_id?: number;
  ingestion_timestamp?: string;
  source_file_hash?: string;
}

export interface IngestionStatus {
  id: number;
  timestamp: string;
  rows_processed: number;
  success: boolean;
  source_file_hash: string;
}

export interface ForecastData {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface BacktestData {
  metrics: {
    mae: number;
    rmse: number;
  };
  details: {
    date: string;
    actual: number;
    predicted: number;
    error: number;
  }[];
}

let cachedData: NASRecord[] | null = null;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const USE_MOCK = import.meta.env.PROD && !import.meta.env.VITE_API_URL;

export async function loadNASData(): Promise<NASRecord[]> {
  if (cachedData) return cachedData;
  
  try {
    const url = USE_MOCK ? "/mock/data.json" : `${API_BASE}/data/all`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch data");
    const records: NASRecord[] = await res.json();
    cachedData = records;
    return records;
  } catch (error) {
    console.error("Error loading NAS data from API:", error);
    return [];
  }
}

export async function fetchIngestionStatus(): Promise<IngestionStatus | null> {
  try {
    const url = USE_MOCK ? "/mock/status.json" : `${API_BASE}/data/status`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchForecast(periods = 4): Promise<ForecastData[]> {
  try {
    const url = USE_MOCK ? "/mock/forecast.json" : `${API_BASE}/forecast/gdp?periods=${periods}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.forecast || [];
  } catch {
    return [];
  }
}

export async function fetchBacktest(): Promise<BacktestData | null> {
  try {
    const url = USE_MOCK ? "/mock/backtest.json" : `${API_BASE}/forecast/backtest`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function getGDPTrend(data: NASRecord[], baseYear = '2011-12') {
  return data
    .filter(r => r.indicator === 'Gross Domestic Product' && r.base_year === baseYear && r.frequency === 'Annual' && r.unit === '₹ Crore')
    .sort((a, b) => a.year_int - b.year_int)
    .reduce((acc, r) => {
      if (!acc.find(x => x.year_int === r.year_int)) {
        acc.push({ year: r.year, year_int: r.year_int, current: r.current_price / 1e5, constant: r.constant_price / 1e5, is_anomaly: r.is_anomaly });
      }
      return acc;
    }, [] as { year: string; year_int: number; current: number; constant: number, is_anomaly: boolean }[]);
}

export function getSectoralGVA(data: NASRecord[], baseYear = '2011-12', yearInt?: number) {
  const filtered = data.filter(r => 
    r.indicator === 'Gross Value Added' && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && 
    r.industry !== 'Total Gross Value Added' && !r.industry.includes('Total')
  );
  
  const targetYear = yearInt || Math.max(...filtered.map(r => r.year_int));
  
  return filtered
    .filter(r => r.year_int === targetYear)
    .reduce((acc, r) => {
      const existing = acc.find(x => x.fullName === r.industry);
      if (!existing) {
        acc.push({ industry: r.industry.length > 30 ? r.industry.substring(0, 28) + '...' : r.industry, fullName: r.industry, value: r.current_price / 1e5 });
      }
      return acc;
    }, [] as { industry: string; fullName: string; value: number }[])
    .sort((a, b) => b.value - a.value);
}

export function getExpenditureComponents(data: NASRecord[], baseYear = '2011-12') {
  const indicators = [
    'Private Final Consumption Expenditure',
    'Government Final Consumption Expenditure',
    'Gross Fixed Capital Formation',
    'Export of Goods and Services',
    'Import of Goods and Services',
  ];
  
  const filtered = data.filter(r => 
    indicators.includes(r.indicator) && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore'
  );
  
  const years = [...new Set(filtered.map(r => r.year_int))].sort();
  
  return years.map(y => {
    const yearData: Record<string, number | string> = { year: y.toString() };
    indicators.forEach(ind => {
      const record = filtered.find(r => r.year_int === y && r.indicator === ind);
      const shortName = ind.replace('Final Consumption Expenditure', 'FCE')
        .replace('Gross Fixed Capital Formation', 'GFCF')
        .replace('Export of Goods and Services', 'Exports')
        .replace('Import of Goods and Services', 'Imports');
      yearData[shortName] = record ? record.current_price / 1e5 : 0;
    });
    return yearData;
  });
}

export function getGrowthRates(data: NASRecord[], baseYear = '2011-12') {
  return data
    .filter(r => r.indicator === 'GDP Growth Rate' && r.base_year === baseYear && r.frequency === 'Annual' && r.unit === '%')
    .sort((a, b) => a.year_int - b.year_int)
    .reduce((acc, r) => {
      if (!acc.find(x => x.year_int === r.year_int)) {
        acc.push({ year: r.year, year_int: r.year_int, growth: r.current_price });
      }
      return acc;
    }, [] as { year: string; year_int: number; growth: number }[]);
}

export function getQuarterlyGDP(data: NASRecord[], baseYear = '2011-12') {
  return data
    .filter(r => r.indicator === 'Gross Domestic Product' && r.base_year === baseYear && r.frequency === 'Quarterly' && r.unit === '₹ Crore' && r.quarter)
    .sort((a, b) => a.year_int - b.year_int || a.quarter.localeCompare(b.quarter))
    .reduce((acc, r) => {
      const label = `${r.year} ${r.quarter}`;
      if (!acc.find(x => x.label === label)) {
        acc.push({ label, year_int: r.year_int, quarter: r.quarter, current: r.current_price / 1e5, constant: r.constant_price / 1e5 });
      }
      return acc;
    }, [] as { label: string; year_int: number; quarter: string; current: number; constant: number }[]);
}

export function getKPISummary(data: NASRecord[]) {
  const gdpData = data.filter(r => r.indicator === 'Gross Domestic Product' && r.frequency === 'Annual' && r.unit === '₹ Crore' && r.base_year === '2011-12');
  const latestYear = Math.max(...gdpData.map(r => r.year_int));
  const latestGDP = gdpData.find(r => r.year_int === latestYear);
  const prevGDP = gdpData.find(r => r.year_int === latestYear - 1);
  
  const growthData = data.filter(r => r.indicator === 'GDP Growth Rate' && r.base_year === '2011-12' && r.unit === '%');
  const latestGrowth = growthData.find(r => r.year_int === latestYear);
  
  const gvaData = data.filter(r => r.indicator === 'Gross Value Added' && r.base_year === '2011-12' && r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && !r.industry.includes('Total'));
  const industries = [...new Set(gvaData.filter(r => r.year_int === latestYear).map(r => r.industry))];
  
  return {
    latestYear: latestYear.toString(),
    gdpCurrent: latestGDP ? (latestGDP.current_price / 1e5).toFixed(1) : '0',
    gdpConstant: latestGDP ? (latestGDP.constant_price / 1e5).toFixed(1) : '0',
    yoyGrowth: prevGDP && latestGDP ? ((latestGDP.current_price - prevGDP.current_price) / prevGDP.current_price * 100).toFixed(1) : '0',
    growthRate: latestGrowth ? latestGrowth.current_price.toFixed(1) : '0',
    sectors: industries.length,
    dataPoints: data.length,
    yearsSpan: `FY ${Math.min(...gdpData.map(r => r.year_int))} – FY ${latestYear}`,
  };
}

export function formatIndianNumber(num: number | string, maxFractionDigits = 2): string {
  const parsedNum = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsedNum)) return String(num);
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: maxFractionDigits,
  }).format(parsedNum);
}

export function getSectoralTrend(data: NASRecord[], baseYear = '2011-12') {
  const filtered = data.filter(r => 
    r.indicator === 'Gross Value Added' && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && 
    r.industry !== 'Total Gross Value Added' && !r.industry.includes('Total')
  );
  
  const years = [...new Set(filtered.map(r => r.year_int))].sort();
  const allIndustries = [...new Set(filtered.map(r => r.industry))];
  
  const trends = years.map(y => {
    const yearData: Record<string, string | number> = { year: y.toString(), year_int: y };
    filtered.filter(r => r.year_int === y).forEach(r => {
      // Use exact full industry name as the key
      yearData[r.industry] = r.constant_price / 1e5;
    });
    return yearData;
  });
  
  return { trends, industries: allIndustries };
}

export function getSectoralYoY(data: NASRecord[], baseYear = '2011-12', targetYear?: number) {
  const filtered = data.filter(r => 
    r.indicator === 'Gross Value Added' && r.base_year === baseYear && 
    r.frequency === 'Annual' && r.unit === '₹ Crore' && r.industry && 
    r.industry !== 'Total Gross Value Added' && !r.industry.includes('Total')
  );
  
  const yt = targetYear || Math.max(...filtered.map(r => r.year_int));
  
  const currentYearData = filtered.filter(r => r.year_int === yt);
  const prevYearData = filtered.filter(r => r.year_int === yt - 1);
  
  return currentYearData.map(c => {
    const p = prevYearData.find(r => r.industry === c.industry);
    // Don't truncate here, keep the exact industry name
    let yoy = 0;
    if (p && p.constant_price > 0) {
      yoy = ((c.constant_price - p.constant_price) / p.constant_price) * 100;
    }
    return {
      industry: c.industry, // Exact name matching AreaChart keys
      fullName: c.industry,
      yoy
    };
  }).sort((a, b) => b.yoy - a.yoy);
}

export function getTopSectors(data: NASRecord[], baseYear = '2011-12', targetYear?: number) {
  const yoyData = getSectoralYoY(data, baseYear, targetYear);
  return {
    growing: yoyData.filter(d => d.yoy > 0).slice(0, 5),
    contracting: yoyData.filter(d => d.yoy < 0).reverse().slice(0, 5)
  };
}

export function getTradeBalance(data: NASRecord[], baseYear = '2011-12') {
  const exportsData = data.filter(r => r.indicator === 'Export of Goods and Services' && r.base_year === baseYear && r.frequency === 'Annual' && r.unit === '₹ Crore');
  const importsData = data.filter(r => r.indicator === 'Import of Goods and Services' && r.base_year === baseYear && r.frequency === 'Annual' && r.unit === '₹ Crore');
  
  const years = [...new Set([...exportsData.map(r => r.year_int), ...importsData.map(r => r.year_int)])].sort();
  
  return years.map(y => {
    const exp = exportsData.find(r => r.year_int === y);
    const imp = importsData.find(r => r.year_int === y);
    
    const exportVal = exp ? exp.current_price / 1e5 : 0;
    const importVal = imp ? imp.current_price / 1e5 : 0;
    
    return {
      year: y.toString(),
      year_int: y,
      exports: exportVal,
      imports: -importVal,
      balance: exportVal - importVal
    };
  });
}

export function getQuarterlySeasonality(data: NASRecord[], baseYear = '2011-12') {
  const filtered = data.filter(r => 
    r.indicator === 'Gross Domestic Product' && r.base_year === baseYear && 
    r.frequency === 'Quarterly' && r.unit === '₹ Crore' && r.quarter
  );
  
  const years = [...new Set(filtered.map(r => r.year_int))].sort();
  
  return years.map(y => {
    const yearData = filtered.filter(r => r.year_int === y);
    const q1 = yearData.find(r => r.quarter === 'Q1');
    const q2 = yearData.find(r => r.quarter === 'Q2');
    const q3 = yearData.find(r => r.quarter === 'Q3');
    const q4 = yearData.find(r => r.quarter === 'Q4');
    
    return {
      year: y.toString(),
      year_int: y,
      Q1: q1 ? q1.constant_price / 1e5 : null,
      Q2: q2 ? q2.constant_price / 1e5 : null,
      Q3: q3 ? q3.constant_price / 1e5 : null,
      Q4: q4 ? q4.constant_price / 1e5 : null,
    };
  }).filter(y => y.Q1 !== null || y.Q2 !== null || y.Q3 !== null || y.Q4 !== null);
}
