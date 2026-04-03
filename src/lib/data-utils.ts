export interface NASRecord {
  base_year: string;
  series: string;
  year: string;
  indicator: string;
  frequency: string;
  revision: string;
  industry: string;
  subindustry: string;
  institutional_sector: string;
  quarter: string;
  current_price: number;
  constant_price: number;
  unit: string;
  year_int: number;
}

let cachedData: NASRecord[] | null = null;

export async function loadNASData(): Promise<NASRecord[]> {
  if (cachedData) return cachedData;
  
  const res = await fetch('/data/nas_data.csv');
  const text = await res.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].replace(/^\ufeff/, '').split(',');
  
  const records: NASRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const yearMatch = values[2]?.match(/^(\d{4})/);
    const yearInt = yearMatch ? parseInt(yearMatch[1]) : 0;
    
    records.push({
      base_year: values[0] || '',
      series: values[1] || '',
      year: values[2] || '',
      indicator: values[3] || '',
      frequency: values[4] || '',
      revision: values[5] || '',
      industry: values[6] || '',
      subindustry: values[7] || '',
      institutional_sector: values[8] || '',
      quarter: values[9] || '',
      current_price: parseFloat(values[10]) || 0,
      constant_price: parseFloat(values[11]) || 0,
      unit: values[12] || '',
      year_int: yearInt,
    });
  }
  
  cachedData = records;
  return records;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function getGDPTrend(data: NASRecord[], baseYear = '2011-12') {
  return data
    .filter(r => r.indicator === 'Gross Domestic Product' && r.base_year === baseYear && r.frequency === 'Annual' && r.unit === '₹ Crore')
    .sort((a, b) => a.year_int - b.year_int)
    .reduce((acc, r) => {
      if (!acc.find(x => x.year_int === r.year_int)) {
        acc.push({ year: r.year, year_int: r.year_int, current: r.current_price / 1e5, constant: r.constant_price / 1e5 });
      }
      return acc;
    }, [] as { year: string; year_int: number; current: number; constant: number }[]);
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
      const existing = acc.find(x => x.industry === r.industry);
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
    gdpCurrent: latestGDP ? (latestGDP.current_price / 1e7).toFixed(1) : '0',
    gdpConstant: latestGDP ? (latestGDP.constant_price / 1e7).toFixed(1) : '0',
    yoyGrowth: prevGDP && latestGDP ? ((latestGDP.current_price - prevGDP.current_price) / prevGDP.current_price * 100).toFixed(1) : '0',
    growthRate: latestGrowth ? latestGrowth.current_price.toFixed(1) : '0',
    sectors: industries.length,
    dataPoints: data.length,
    yearsSpan: `FY ${Math.min(...gdpData.map(r => r.year_int))} – FY ${latestYear}`,
  };
}
