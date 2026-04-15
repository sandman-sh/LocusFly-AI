/**
 * Flight data parser — PRODUCTION
 * Parses real API responses into normalized flight objects.
 * NO mock data generators.
 */

/**
 * Parse the OpenAI analysis response into flight objects.
 */
export function parseAnalyzedFlights(openaiResponse) {
  try {
    const content = openaiResponse?.data?.choices?.[0]?.message?.content
      || openaiResponse?.choices?.[0]?.message?.content
      || '';
    
    let parsed;
    // Try direct JSON parse
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
    }

    // Handle both { flights: [...] } and [...] shapes
    const flights = Array.isArray(parsed) ? parsed : (parsed?.flights || parsed?.options || []);

    if (flights.length === 0) {
      throw new Error('No flights found in API response');
    }

    return flights.map((f, i) => ({
      id: f.id || i + 1,
      airline: f.airline || 'Unknown Airline',
      flightNumber: f.flightNumber || f.flight_number || `N/A`,
      origin: f.origin || '',
      destination: f.destination || '',
      departureTime: f.departureTime || f.departure_time || '',
      arrivalTime: f.arrivalTime || f.arrival_time || '',
      duration: f.duration || '',
      stops: typeof f.stops === 'number' ? f.stops : 0,
      stopsDescription: f.stopsDescription || f.stops_description || (f.stops === 0 ? 'Nonstop' : `${f.stops} Stop${f.stops > 1 ? 's' : ''}`),
      price: parseFloat(f.price) || 0,
      route: f.route || `${f.origin} → ${f.destination}`,
      cabinClass: f.cabinClass || f.cabin_class || 'Economy',
      bestPath: f.bestPath || false,
    }));
  } catch (e) {
    console.error('Failed to parse flight data:', e);
    return [];
  }
}

/**
 * Calculate platform fee: 5% or 0.1 USDC, whichever is higher.
 */
export function calculatePlatformFee(ticketPrice) {
  const fivePercent = ticketPrice * 0.05;
  return Math.max(fivePercent, 0.1);
}

/**
 * Shorten a tx hash for display: 0x1234...abcd
 */
export function shortenHash(hash) {
  if (!hash || hash.length < 12) return hash || 'N/A';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

/**
 * Format price to USD string.
 */
export function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}
