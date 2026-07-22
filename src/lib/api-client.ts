export const BACKEND_URL = "http://localhost:8000";

export async function fetchGDPForecast(periods: number = 4) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/forecast/gdp?periods=${periods}`);
    if (!response.ok) {
      throw new Error("Failed to fetch forecast");
    }
    const data = await response.json();
    return data.forecast;
  } catch (error) {
    console.error("Forecast API error:", error);
    return null;
  }
}

export async function fetchKPISummaryGraphQL() {
  const query = `
    query {
      getKpiSummary {
        id
        year
        yearInt
        indicator
        frequency
        industry
        currentPrice
        constantPrice
        unit
        isAnomaly
      }
    }
  `;
  try {
    const response = await fetch(`${BACKEND_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    const result = await response.json();
    return result.data.getKpiSummary;
  } catch (error) {
    console.error("GraphQL API error:", error);
    return null;
  }
}
