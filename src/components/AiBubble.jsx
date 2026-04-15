import { motion } from 'framer-motion';

export default function AiBubble({ children, delay = 0 }) {
  return (
    <motion.div
      className="ai-bubble"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="ai-avatar">AI</div>
      <div className="ai-text-wrapper">
        <p className="ai-text">{children}</p>
      </div>
    </motion.div>
  );
}
