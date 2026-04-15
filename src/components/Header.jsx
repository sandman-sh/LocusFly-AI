import { motion } from 'framer-motion';
import { PlaneTakeoff, Sun, Moon } from 'lucide-react';

export default function Header({ walletBalance, connected, theme, toggleTheme }) {
  const isLoaded = walletBalance && walletBalance !== 'N/A' && walletBalance !== '0.00';

  return (
    <header className="header">
      <div className="header-logo">
        <div className="logo-icon" style={{ background: 'var(--locus-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)' }}>
          <PlaneTakeoff size={18} color="white" />
        </div>
        <span className="logo-text">LocusFly AI</span>
        <span className="header-badge">Powered by Locus</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-primary)',
            transition: 'background 0.2s'
          }}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {connected && (
          <motion.div className="header-wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="wallet-dot" style={!isLoaded ? { background: 'var(--warning)', boxShadow: '0 0 8px rgba(251,191,36,0.4)' } : {}} />
            <span className="wallet-balance" style={!isLoaded ? { color: 'var(--text-secondary)' } : {}}>
              {isLoaded ? `${walletBalance} USDC` : 'Connected'}
            </span>
          </motion.div>
        )}
      </div>
    </header>
  );
}
