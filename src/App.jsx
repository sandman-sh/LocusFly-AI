import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Header';
import AiBubble from './components/AiBubble';
import StepIndicator from './components/StepIndicator';
import ApiKeyModal from './components/ApiKeyModal';
import SearchForm from './components/SearchForm';
import AgentLog from './components/AgentLog';
import FlightResults from './components/FlightResults';
import Checkout from './components/Checkout';
import BookingSuccess from './components/BookingSuccess';
import {
  getApiKey, setApiKey, getWalletBalance,
  searchFlightsPerplexity, searchFlightsTavily, searchFlightsBrave,
  analyzeFlightData, createCheckoutSession, getCheckoutUrl,
} from './lib/locus';
import { parseAnalyzedFlights } from './lib/flights';

const VIEWS = {
  CONNECT: 'connect',
  SEARCH: 'search',
  RESULTS: 'results',
  CHECKOUT: 'checkout',
  SUCCESS: 'success',
};

export default function App() {
  // Auth
  const [connected, setConnected] = useState(false);
  const [walletBalance, setWalletBalance] = useState('0.00');

  // Theme
  const [theme, setTheme] = useState('dark');
  
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  // Flow state
  const [view, setView] = useState(VIEWS.CONNECT);
  const [searchParams, setSearchParams] = useState(null);
  const [flights, setFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [txData, setTxData] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Loading
  const [searching, setSearching] = useState(false);
  const [paying, setPaying] = useState(false);

  const addLog = useCallback((message, type = 'search', cost = null) => {
    setAgentLogs(prev => [...prev, { message, type, cost }]);
  }, []);

  // Auto-connect: if API key exists in .env.local, skip connect modal immediately
  useEffect(() => {
    const key = getApiKey();
    if (key) {
      setConnected(true);
      setView(VIEWS.SEARCH);

      // Fetch balance in background — don't block on failure
      getWalletBalance(key)
        .then(balance => setWalletBalance(balance))
        .catch(err => {
          console.warn('[LocusFly] Balance fetch:', err.message);
          // Still connected — balance just couldn't be fetched
          // This can happen if the key is valid but /pay/balance
          // requires specific permissions. Wrapped APIs may still work.
          setWalletBalance('N/A');
        });
    }
  }, []);

  // ---------- Connect ----------
  const handleConnect = (key, balance) => {
    setApiKey(key);
    setWalletBalance(balance);
    setConnected(true);
    setView(VIEWS.SEARCH);
  };

  // ---------- Search (REAL — multi-source via Locus) ----------
  const handleSearch = async (params) => {
    setSearching(true);
    setSearchParams(params);
    setAgentLogs([]);
    setSearchError('');
    setFlights([]);

    const apiKey = getApiKey();
    const allRawResults = {};

    try {
      addLog(`<strong>Using Locus skill</strong> — Searching flights: ${params.origin} → ${params.destination} on ${params.date}`, 'search');

      // --- Source 1: Perplexity (real-time AI web search) ---
      addLog('Calling <strong>Perplexity sonar</strong> via Locus wrapped API...', 'search', 'USDC deducted');
      try {
        const perplexityResult = await searchFlightsPerplexity(apiKey, params);
        allRawResults.perplexity = perplexityResult;
        addLog('Perplexity returned real-time flight data ✓', 'done');
      } catch (err) {
        addLog(`Perplexity: ${err.message}`, 'search');
      }

      // --- Source 2: Tavily (deep web search) ---
      addLog('Calling <strong>Tavily</strong> via Locus wrapped API for additional results...', 'search', 'USDC deducted');
      try {
        const tavilyResult = await searchFlightsTavily(apiKey, params);
        allRawResults.tavily = tavilyResult;
        addLog('Tavily returned search results ✓', 'done');
      } catch (err) {
        addLog(`Tavily: ${err.message}`, 'search');
      }

      // --- Source 3: Brave Search ---
      addLog('Calling <strong>Brave Search</strong> via Locus wrapped API for price comparison...', 'search', 'USDC deducted');
      try {
        const braveResult = await searchFlightsBrave(apiKey, params);
        allRawResults.brave = braveResult;
        addLog('Brave Search returned results ✓', 'done');
      } catch (err) {
        addLog(`Brave Search: ${err.message}`, 'search');
      }

      // Check if we got any data at all
      if (Object.keys(allRawResults).length === 0) {
        throw new Error('All search providers failed. Please check your Locus wallet balance and enabled providers.');
      }

      // --- Analyze with OpenAI (real API call via Locus) ---
      addLog('Calling <strong>OpenAI GPT-4o-mini</strong> via Locus to analyze and rank all results...', 'search', 'USDC deducted');
      const analyzedData = await analyzeFlightData(apiKey, allRawResults, params);
      addLog('Flight analysis complete ✓', 'done');

      // --- Parse ---
      const parsedFlights = parseAnalyzedFlights(analyzedData);

      if (parsedFlights.length === 0) {
        throw new Error('Could not extract flight options from search results. Try different airports or dates.');
      }

      // --- Refresh wallet balance after API spend ---
      try {
        const newBalance = await getWalletBalance(apiKey);
        setWalletBalance(newBalance);
      } catch { /* non-critical */ }

      addLog(`Found <strong>${parsedFlights.length} real flight options</strong> from ${Object.keys(allRawResults).length} sources. Ranked by shortest path + best price.`, 'done');

      setFlights(parsedFlights);
      setView(VIEWS.RESULTS);
    } catch (err) {
      addLog(`<strong>Error:</strong> ${err.message}`, 'search');
      setSearchError(err.message);
    } finally {
      setSearching(false);
    }
  };

  // ---------- Select ----------
  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
    setView(VIEWS.CHECKOUT);
  };

  // ---------- Pay (REAL — Locus Checkout) ----------
  const handleConfirmPayment = async (flight, total, fee) => {
    setPaying(true);
    const apiKey = getApiKey();

    try {
      addLog('<strong>Using Locus skill</strong> — Creating Locus Checkout session...', 'pay');

      // Create a real Locus checkout session
      const session = await createCheckoutSession(apiKey, {
        amount: total,
        description: `LocusFly Booking: ${flight.airline} ${flight.flightNumber} — ${flight.route} on ${searchParams.date}`,
        metadata: {
          flight: flight.flightNumber,
          airline: flight.airline,
          route: flight.route,
          date: searchParams.date,
          passengers: searchParams.passengers,
          ticketPrice: flight.price.toString(),
          platformFee: fee.toFixed(2),
        },
      });

      const sessionId = session?.id || session?.data?.id || session?.sessionId;

      if (sessionId) {
        addLog(`Checkout session created: <strong>${sessionId.slice(0, 12)}...</strong>`, 'done');

        // Redirect to Locus Checkout payment page
        const checkoutUrl = getCheckoutUrl(sessionId);
        addLog(`Redirecting to PayWithLocus checkout...`, 'pay');

        // Open checkout in new tab so user doesn't lose state
        window.open(checkoutUrl, '_blank');

        addLog('Payment page opened. Complete payment in the Locus Checkout tab.', 'pay');

        // Set txData from session
        setTxData({
          sessionId,
          paymentTx: session?.paymentTxHash || session?.data?.paymentTxHash || null,
          confirmationCode: sessionId.slice(0, 6).toUpperCase(),
          checkoutUrl,
        });

        setView(VIEWS.SUCCESS);
      } else {
        throw new Error('Failed to create checkout session — no session ID returned.');
      }
    } catch (err) {
      addLog(`<strong>Payment error:</strong> ${err.message}`, 'search');
    } finally {
      setPaying(false);
    }
  };

  // ---------- Reset ----------
  const handleBookAnother = () => {
    setFlights([]);
    setSelectedFlight(null);
    setTxData(null);
    setAgentLogs([]);
    setSearchParams(null);
    setSearchError('');
    setView(VIEWS.SEARCH);
  };

  // Step number for indicator
  const currentStep =
    view === VIEWS.SEARCH ? 1 :
    view === VIEWS.RESULTS ? 2 :
    view === VIEWS.CHECKOUT ? 3 :
    view === VIEWS.SUCCESS ? 4 : 1;

  return (
    <>
      <div className="ambient-bg" />
      <div className="app-wrapper">
        <Header 
        walletBalance={walletBalance} 
        connected={connected} 
        theme={theme}
        toggleTheme={toggleTheme}
      />

        <main className="app-content">
          {view !== VIEWS.CONNECT && <StepIndicator current={currentStep} />}

          <AnimatePresence mode="wait">
            {/* --- CONNECT --- */}
            {view === VIEWS.CONNECT && (
              <motion.div key="connect" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <AiBubble>
                  Hi! I'm <strong>LocusFly AI</strong> — your autonomous flight booking agent powered by PayWithLocus. Connect your Locus wallet to get started.
                </AiBubble>
                <ApiKeyModal onConnect={handleConnect} />
              </motion.div>
            )}

            {/* --- SEARCH --- */}
            {view === VIEWS.SEARCH && (
              <motion.div key="search" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <AiBubble>
                  Tell me where you want to fly and when. I'll search <strong>Perplexity</strong>, <strong>Tavily</strong>, and <strong>Brave Search</strong> via Locus wrapped APIs to find the cheapest and shortest route — all paid per-use from your wallet.
                </AiBubble>
                <SearchForm onSearch={handleSearch} loading={searching} />
                {(searching || agentLogs.length > 0) && (
                  <div style={{ marginTop: 20 }}>
                    <AgentLog logs={agentLogs} />
                  </div>
                )}
                {searchError && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{
                      marginTop: 16, padding: '14px 18px',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 12, fontSize: '0.85rem', color: '#f87171'
                    }}
                  >
                    {searchError}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* --- RESULTS --- */}
            {view === VIEWS.RESULTS && (
              <motion.div key="results" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <AiBubble>
                  I searched <strong>{Object.keys(flights).length > 0 ? '3 real sources' : 'multiple sources'}</strong> via Locus wrapped APIs (Perplexity, Tavily, Brave Search) and analyzed the data with OpenAI. Here are the best options ranked by shortest path and price.
                </AiBubble>
                <AgentLog logs={agentLogs} />
                <div style={{ marginTop: 20 }}>
                  <FlightResults flights={flights} onSelect={handleSelectFlight} />
                </div>
                <button className="btn-ghost" style={{ marginTop: 16 }} onClick={() => { setView(VIEWS.SEARCH); setAgentLogs([]); setSearchError(''); }}>
                  ← New search
                </button>
              </motion.div>
            )}

            {/* --- CHECKOUT --- */}
            {view === VIEWS.CHECKOUT && (
              <motion.div key="checkout" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <AiBubble>
                  Ready to book! Payment will be processed via <strong>Locus Checkout</strong> — real USDC on Base chain. Review the total below.
                </AiBubble>
                <Checkout
                  flight={selectedFlight}
                  searchParams={searchParams}
                  onConfirm={handleConfirmPayment}
                  onBack={() => setView(VIEWS.RESULTS)}
                  loading={paying}
                />
                {paying && <div style={{ marginTop: 16 }}><AgentLog logs={agentLogs} /></div>}
              </motion.div>
            )}

            {/* --- SUCCESS --- */}
            {view === VIEWS.SUCCESS && (
              <motion.div key="success" exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <BookingSuccess
                  flight={selectedFlight}
                  searchParams={searchParams}
                  txData={txData}
                  onBookAnother={handleBookAnother}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
