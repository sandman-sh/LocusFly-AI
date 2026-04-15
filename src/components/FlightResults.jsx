import { motion } from 'framer-motion';
import { formatPrice } from '../lib/flights';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function FlightResults({ flights, onSelect }) {
  if (!flights || flights.length === 0) return null;

  return (
    <motion.div className="results-container" variants={container} initial="hidden" animate="show">
      {flights.map((flight) => (
        <motion.div
          key={flight.id}
          className={`flight-card ${flight.bestPath ? 'best' : ''}`}
          variants={item}
          onClick={() => onSelect(flight)}
          whileHover={{ scale: 1.003 }}
          whileTap={{ scale: 0.997 }}
        >
          <div className="flight-left">
            {flight.bestPath && <div className="flight-badge">⚡ Best Route</div>}
            <div className="flight-airline">
              {flight.airline} · {flight.flightNumber}
            </div>
            <div className="flight-time">
              {flight.departureTime} → {flight.arrivalTime}
            </div>
            <div className="flight-meta">
              <span>{flight.duration}</span>
              <span>{flight.stopsDescription}</span>
              <span>{flight.route}</span>
            </div>
          </div>

          <div className="flight-right">
            <div className="flight-price">{formatPrice(flight.price)}</div>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 16px' }}>
              Select →
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
