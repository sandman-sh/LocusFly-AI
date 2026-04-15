import { motion } from 'framer-motion';

export default function AgentLog({ logs }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="agent-log">
      {logs.map((log, i) => (
        <motion.div
          key={i}
          className="log-item"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08 }}
        >
          <div className={`log-dot ${log.type || 'search'}`} />
          <span className="log-text" dangerouslySetInnerHTML={{ __html: log.message }} />
          {log.cost && <span className="log-cost">{log.cost}</span>}
        </motion.div>
      ))}
    </div>
  );
}
