import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ApiKeyModal({ onConnect }) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Enter your Locus API key.');
      return;
    }
    if (!trimmed.startsWith('claw_')) {
      setError('Key must start with claw_ — check your key.');
      return;
    }

    setLoading(true);
    setError('');

    // Try fetching balance via proxy — but don't block if it fails
    let balance = 'N/A';
    try {
      const res = await fetch('/api/pay/balance', {
        headers: { 'Authorization': `Bearer ${trimmed}` }
      });
      if (res.ok) {
        const data = await res.json();
        balance = data?.data?.balance ?? data?.balance ?? 'N/A';
      }
    } catch { /* non-critical */ }

    setLoading(false);
    onConnect(trimmed, String(balance));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="search-card"
      style={{ maxWidth: 440, margin: '0 auto' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'var(--locus-gradient)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 14, boxShadow: 'var(--shadow-glow)',
          fontSize: '1rem',
        }}>
          🔐
        </div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>
          Connect Wallet
        </h2>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Enter your Locus API key. Only sent to <code style={{
            fontSize: '0.72rem', background: 'rgba(255,255,255,0.04)',
            padding: '1px 5px', borderRadius: 4
          }}>api.paywithlocus.com</code>
        </p>
      </div>

      <div className="form-group" style={{ marginBottom: 14 }}>
        <label>API Key</label>
        <input
          type="password"
          placeholder="claw_dev_..."
          value={key}
          onChange={(e) => { setKey(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
          style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
        />
      </div>

      {error && (
        <div style={{
          fontSize: '0.75rem', color: 'var(--error)',
          background: 'var(--error-bg)', padding: '8px 12px',
          borderRadius: 8, marginBottom: 12
        }}>
          {error}
        </div>
      )}

      <button className="btn btn-primary btn-full" onClick={handleConnect} disabled={loading}>
        {loading ? <><div className="spinner" /> Connecting...</> : 'Connect'}
      </button>

      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 14 }}>
        No key?{' '}
        <a href="https://app.paywithlocus.com" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--locus-violet-light)', textDecoration: 'none' }}>
          Sign up at paywithlocus.com →
        </a>
      </p>
    </motion.div>
  );
}
