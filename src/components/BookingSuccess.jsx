import { motion } from 'framer-motion';
import { formatPrice, shortenHash, calculatePlatformFee } from '../lib/flights';

export default function BookingSuccess({ flight, searchParams, txData, onBookAnother }) {
  if (!flight) return null;

  const basePrice = flight.price;
  const platformFee = calculatePlatformFee(basePrice);

  const dateStr = searchParams?.date
    ? new Date(searchParams.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const sessionId = txData?.sessionId || '';
  const confirmationCode = txData?.confirmationCode || sessionId.slice(0, 6).toUpperCase() || 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Hero */}
      <div className="success-hero">
        <motion.div
          className="success-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          ✓
        </motion.div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 4 }}>Booking Initiated!</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Checkout session created via PayWithLocus
        </p>
      </div>

      {/* Boarding Pass */}
      <motion.div
        className="boarding-pass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bp-header">
          <span className="bp-airline">{flight.airline}</span>
          <span className="bp-label-sm">Boarding Pass</span>
        </div>
        <div className="bp-body">
          <div className="bp-row">
            <div className="bp-col">
              <span className="bp-label">From</span>
              <span className="bp-value">{flight.origin || searchParams?.origin}</span>
            </div>
            <div className="bp-col" style={{ alignItems: 'center' }}>
              <span className="bp-label">Flight</span>
              <span className="bp-value-sm">{flight.flightNumber}</span>
            </div>
            <div className="bp-col right">
              <span className="bp-label">To</span>
              <span className="bp-value">{flight.destination || searchParams?.destination}</span>
            </div>
          </div>
          <div className="bp-row">
            <div className="bp-col">
              <span className="bp-label">Date</span>
              <span className="bp-value-sm">{dateStr}</span>
            </div>
            <div className="bp-col right">
              <span className="bp-label">Class</span>
              <span className="bp-value-sm">{flight.cabinClass}</span>
            </div>
          </div>
          <div className="bp-row">
            <div className="bp-col">
              <span className="bp-label">Departure</span>
              <span className="bp-value-sm">{flight.departureTime}</span>
            </div>
            <div className="bp-col right">
              <span className="bp-label">Confirmation</span>
              <span className="bp-value-sm">{confirmationCode}</span>
            </div>
          </div>
        </div>
        <div className="bp-footer">
          <div className="bp-barcode">||||| |||| || ||| |||| ||||| ||</div>
        </div>
      </motion.div>

      {/* On-chain Details */}
      <motion.div
        className="tx-card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3>Locus Checkout Details</h3>

        {sessionId && (
          <div className="tx-row">
            <span>Session ID</span>
            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{shortenHash(sessionId)}</span>
          </div>
        )}

        {txData?.paymentTx && (
          <div className="tx-row">
            <span>Payment Tx (Base)</span>
            <a
              className="tx-link"
              href={`https://basescan.org/tx/${txData.paymentTx}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {shortenHash(txData.paymentTx)} ↗
            </a>
          </div>
        )}

        {txData?.checkoutUrl && (
          <div className="tx-row">
            <span>Checkout Page</span>
            <a
              className="tx-link"
              href={txData.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Complete Payment ↗
            </a>
          </div>
        )}

        <div className="tx-row">
          <span>Total Amount</span>
          <span style={{ fontWeight: 600 }}>{formatPrice(basePrice + platformFee)}</span>
        </div>

        <div className="tx-row">
          <span>Payment Method</span>
          <span style={{ fontWeight: 500, color: 'var(--locus-violet-light)' }}>USDC via PayWithLocus</span>
        </div>
      </motion.div>

      {/* Agent Cost Transparency */}
      <motion.div
        className="profit-box"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h4>LocusFly Agent — Cost Breakdown</h4>
        <div className="profit-row">
          <span>Ticket Price</span>
          <span>{formatPrice(basePrice)}</span>
        </div>
        <div className="profit-row">
          <span>Platform Fee (5% or 0.1 USDC min)</span>
          <span className="val-green">{platformFee.toFixed(3)} USDC</span>
        </div>
        <div className="profit-row">
          <span>API costs (Perplexity + Tavily + Brave + OpenAI via Locus)</span>
          <span className="val-muted">Deducted from wallet</span>
        </div>
        <div className="profit-row" style={{ borderTop: '1px solid rgba(16,185,129,0.15)', paddingTop: 8, marginTop: 8 }}>
          <span style={{ fontWeight: 600 }}>Total Charged</span>
          <span className="val-green">{formatPrice(basePrice + platformFee)}</span>
        </div>
      </motion.div>

      <button className="btn btn-outline btn-full" style={{ marginTop: 24 }} onClick={onBookAnother}>
        Book Another Flight
      </button>
    </motion.div>
  );
}
