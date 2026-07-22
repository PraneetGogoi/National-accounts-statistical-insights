export const BACKEND_URL = "http://localhost:8000";

// Typed Error Handling
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

// Promise Deduplication Cache
const requestCache = new Map<string, Promise<any>>();

export async function fetchGDPForecast(periods: number = 4) {
  const cacheKey = `forecast-${periods}`;
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const request = (async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/forecast/gdp?periods=${periods}`);
      if (!response.ok) {
        throw new ApiError(response.status, await response.text() || "Failed to fetch forecast");
      }
      const data = await response.json();
      return data.forecast;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : "Network failure");
    } finally {
      requestCache.delete(cacheKey);
    }
  })();

  requestCache.set(cacheKey, request);
  return request;
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
  const cacheKey = 'graphql-kpi-summary';
  
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const request = (async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        throw new ApiError(response.status, "GraphQL query failed");
      }
      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors.map((e: any) => e.message).join(", "));
      }
      return result.data.getKpiSummary;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new NetworkError(error instanceof Error ? error.message : "Network failure");
    } finally {
      requestCache.delete(cacheKey);
    }
  })();

  requestCache.set(cacheKey, request);
  return request;
}

// WebSocket Subscription Client (Example for Live Ledger Feed)
export function subscribeToLedgerFeed(onMessage: (msg: any) => void) {
  // Simple fallback implementation, actual GraphQL subscriptions usually require 'graphql-ws'
  const ws = new WebSocket(`ws://localhost:8000/graphql`);
  
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: 'connection_init',
      payload: {}
    }));
    setTimeout(() => {
      ws.send(JSON.stringify({
        id: '1',
        type: 'subscribe',
        payload: {
          query: `subscription { liveLedgerFeed }`
        }
      }));
    }, 100);
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'next') {
      onMessage(data.payload.data.liveLedgerFeed);
    }
  };
  
  return () => ws.close();
}
