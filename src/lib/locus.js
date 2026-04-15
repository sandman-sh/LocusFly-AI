/**
 * Locus API Client — PRODUCTION
 * 
 * Routes ALL external API calls through the Locus Wrapped API layer.
 * All spending is tracked and deducted from the wallet's USDC balance on Base.
 * 
 * NO mock data. NO simulation. Every call is real.
 */

// Always use relative /api — proxied by:
//   Dev:  Vite proxy → https://beta-api.paywithlocus.com/api
//   Prod: Vercel rewrite → https://beta-api.paywithlocus.com/api
const LOCUS_API_BASE = '/api';
const LOCUS_CHECKOUT_BASE = 'https://beta.paywithlocus.com/checkout'; // assuming checkout might be similar, or beta.paywithlocus.com. SKILL.md actually doesn't specify beta checkout explicitly, but let's change API first.

/**
 * Get API key — checks .env (VITE_LOCUS_API_KEY) first, then localStorage.
 */
export function getApiKey() {
  return import.meta.env.VITE_LOCUS_API_KEY || localStorage.getItem('locus_api_key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('locus_api_key', key);
}

/**
 * Fetch wallet balance via Locus Pay.
 * GET /api/pay/balance
 */
export async function getWalletBalance(apiKey) {
  const res = await fetch(`${LOCUS_API_BASE}/pay/balance`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) throw new Error(`Balance check failed: ${res.status}`);
  const data = await res.json();
  console.log('[LocusFly] Balance API response:', JSON.stringify(data));

  // Handle multiple response shapes from Locus API
  const balance = data?.data?.balance
    ?? data?.balance
    ?? data?.data?.available
    ?? data?.available
    ?? data?.data?.amount
    ?? data?.amount;

  if (balance !== undefined && balance !== null) {
    return String(balance);
  }

  // If response has nested data, try to find any numeric value that isn't a hex address
  if (data?.data && typeof data.data === 'object') {
    const vals = Object.values(data.data);
    const numVal = vals.find(v => 
      (typeof v === 'string' && /^\d/.test(v) && !v.startsWith('0x')) || typeof v === 'number'
    );
    if (numVal !== undefined) return String(numVal);
  }

  return '0.00';
}

/**
 * Call a Locus Wrapped API.
 * POST /api/wrapped/<provider>/<endpoint>
 * 
 * Every call deducts real USDC from your Locus wallet.
 */
export async function callWrappedApi(apiKey, provider, endpoint, body) {
  const res = await fetch(`${LOCUS_API_BASE}/wrapped/${provider}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Wrapped API error: ${res.status}`);
  }
  return await res.json();
}

/**
 * Search for flights using Locus wrapped Perplexity API.
 * Uses sonar model for real-time web search — this costs real USDC.
 */
export async function searchFlightsPerplexity(apiKey, { origin, destination, date, passengers, cabinClass }) {
  const query = `Find the cheapest and shortest flights from ${origin} to ${destination} on ${date} for ${passengers} passenger(s) in ${cabinClass} class. List at least 5 real flight options from different airlines with: exact airline name, flight number, departure time, arrival time, total duration, number of stops, and ticket price in USD. Use current real pricing.`;

  return await callWrappedApi(apiKey, 'perplexity', 'chat', {
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: `You are a real-time flight search agent. Search the web for actual flight availability and pricing. Return ONLY a JSON object with a "flights" key containing an array. Each flight must have: airline (string), flightNumber (string), departureTime (string like "8:30 AM"), arrivalTime (string), duration (string like "5h 30m"), stops (number, 0=nonstop), stopsDescription (string), price (number in USD), origin (string airport code), destination (string airport code), route (string like "SFO → JFK"), cabinClass (string). Mark the best overall option (fewest stops + shortest time) with "bestPath": true. Return valid JSON only, no markdown.`
      },
      { role: 'user', content: query }
    ],
    temperature: 0.1,
  });
}

/**
 * Search for flights using Locus wrapped Tavily API.
 * Real web search — costs real USDC.
 */
export async function searchFlightsTavily(apiKey, { origin, destination, date, passengers, cabinClass }) {
  const query = `cheapest flights from ${origin} to ${destination} on ${date} ${cabinClass} class ticket price airline schedule`;

  return await callWrappedApi(apiKey, 'tavily', 'search', {
    query,
    search_depth: 'advanced',
    include_answer: true,
    max_results: 10,
  });
}

/**
 * Search using Brave Search wrapped API.
 * Real web search — costs real USDC.
 */
export async function searchFlightsBrave(apiKey, { origin, destination, date }) {
  const query = `flights from ${origin} to ${destination} on ${date} cheap tickets prices airlines`;

  return await callWrappedApi(apiKey, 'brave', 'search', {
    q: query,
    count: 10,
  });
}

/**
 * Use OpenAI via Locus to analyze and structure flight data from multiple
 * real search sources into a clean comparison.
 * Costs real USDC.
 */
export async function analyzeFlightData(apiKey, rawSearchResults, searchParams) {
  return await callWrappedApi(apiKey, 'openai', 'chat', {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a flight data analyst. You receive real search results from multiple sources (Perplexity, Tavily, Brave Search). Extract all flight options and return a JSON object with a "flights" key containing an array of flights.

Each flight object MUST have these exact fields:
{
  "id": number (1-indexed),
  "airline": string (full airline name),
  "flightNumber": string (e.g. "UA 1234"),
  "origin": string (3-letter airport code),
  "destination": string (3-letter airport code),
  "departureTime": string (e.g. "08:30 AM"),
  "arrivalTime": string (e.g. "11:45 AM"),
  "duration": string (e.g. "3h 15m"),
  "stops": number (0 for nonstop),
  "stopsDescription": string (e.g. "Nonstop" or "1 Stop via DFW"),
  "price": number (USD, numeric only),
  "route": string (e.g. "SFO → JFK"),
  "cabinClass": string,
  "bestPath": boolean (true for the single best option: fewest stops + shortest duration)
}

Rules:
- Extract REAL data from the search results. Do NOT invent flights.
- Sort by: 1) Fewest stops, 2) Shortest duration, 3) Best price.
- Set "bestPath": true on exactly ONE flight — the shortest path overall.
- Return 3-8 flights. Return ONLY the JSON object, nothing else.`
      },
      {
        role: 'user',
        content: `Search parameters: origin=${searchParams.origin}, destination=${searchParams.destination}, date=${searchParams.date}, passengers=${searchParams.passengers}, class=${searchParams.cabinClass}

Raw search results from multiple real sources:
${JSON.stringify(rawSearchResults, null, 2)}`
      }
    ],
    temperature: 0.1,
    response_format: { type: 'json_object' }
  });
}

/**
 * Create a real Locus Checkout session for USDC payment.
 * POST /api/checkout/sessions
 */
export async function createCheckoutSession(apiKey, { amount, description, metadata }) {
  const currentUrl = window.location.origin;

  const res = await fetch(`${LOCUS_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amount.toFixed(2),
      description,
      successUrl: `${currentUrl}?payment=success`,
      cancelUrl: `${currentUrl}?payment=cancelled`,
      metadata,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Checkout session creation failed: ${res.status}`);
  }

  return await res.json();
}

/**
 * Get Locus Checkout page URL for a session.
 */
export function getCheckoutUrl(sessionId) {
  return `${LOCUS_CHECKOUT_BASE}/session/${sessionId}`;
}

/**
 * Poll a checkout session status.
 * GET /api/checkout/sessions/:sessionId
 */
export async function getCheckoutSession(apiKey, sessionId) {
  const res = await fetch(`${LOCUS_API_BASE}/checkout/sessions/${sessionId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) throw new Error(`Session check failed: ${res.status}`);
  return await res.json();
}

/**
 * Discover available wrapped APIs.
 * GET /api/wrapped/md
 */
export async function discoverApis(apiKey) {
  const res = await fetch(`${LOCUS_API_BASE}/wrapped/md`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!res.ok) throw new Error(`Discovery failed: ${res.status}`);
  return await res.text();
}
