import { motion } from 'framer-motion';
import { formatPrice, calculatePlatformFee } from '../lib/flights';

export default function Checkout({ flight, searchParams, onConfirm, onBack, loading }) {
  if (!flight) return null;

  const basePrice = flight.price;
  const platformFee = calculatePlatformFee(basePrice);
  const total = basePrice + platformFee;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to results
      </button>

      <div className="checkout-wrap">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16, letterSpacing: '-0.02em' }}>
          Confirm & Pay
        </h2>

        {/* Flight Summary */}
        <div className="checkout-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 4 }}>
                {flight.airline} — {flight.flightNumber}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                {flight.departureTime} → {flight.arrivalTime} · {flight.duration}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {flight.route} · {flight.stopsDescription}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {flight.cabinClass}
              </div>
              {searchParams && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {searchParams.date} · {searchParams.passengers} pax
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div style={{ padding: '0 2px', marginBottom: 16 }}>
          <div className="cost-row label">
            <span>Ticket price</span>
            <span>{formatPrice(basePrice)}</span>
          </div>
          <div className="cost-row label">
            <span>Platform fee</span>
            <span>{platformFee.toFixed(2)} USDC</span>
          </div>
          <div className="cost-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="warning-callout">
          Payment processed in USDC via PayWithLocus on Base
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() => onConfirm(flight, total, platformFee)}
          disabled={loading}
        >
          {loading ? (
            <><div className="spinner" /> Processing...</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
              </svg>
              Pay {formatPrice(total)}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
