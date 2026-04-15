import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, PlaneTakeoff, PlaneLanding, Calendar, Users, Armchair } from 'lucide-react';

export default function SearchForm({ onSearch, loading }) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [cabinClass, setCabinClass] = useState('economy');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!origin || !destination || !date) return;
    onSearch({ origin: origin.trim(), destination: destination.trim(), date, passengers, cabinClass });
  };

  return (
    <motion.div
      className="search-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2>Where are we flying?</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="origin" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><PlaneTakeoff size={13} /> From</label>
            <input
              id="origin" type="text" placeholder="New York, JFK, or Los Angeles"
              value={origin} onChange={(e) => setOrigin(e.target.value)}
              required autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="destination" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><PlaneLanding size={13} /> To</label>
            <input
              id="destination" type="text" placeholder="London, Mumbai, or Tokyo"
              value={destination} onChange={(e) => setDestination(e.target.value)}
              required autoComplete="off"
            />
          </div>
        </div>

        <div className="form-row triple">
          <div className="form-group">
            <label htmlFor="date" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> Date</label>
            <input
              id="date" type="date"
              value={date} onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="passengers" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13} /> Passengers</label>
            <select id="passengers" value={passengers} onChange={(e) => setPassengers(parseInt(e.target.value))}>
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="cabinClass" style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Armchair size={13} /> Class</label>
            <select id="cabinClass" value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
              <option value="economy">Economy</option>
              <option value="premium_economy">Premium</option>
              <option value="business">Business</option>
              <option value="first">First</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginTop: 8 }}
        >
          {loading ? (
            <><div className="spinner" /> Searching via Locus APIs...</>
          ) : (
            <><Search size={16} style={{ marginRight: 6 }} /> Find Cheapest Flights</>
          )}
        </button>
      </form>
    </motion.div>
  );
}
