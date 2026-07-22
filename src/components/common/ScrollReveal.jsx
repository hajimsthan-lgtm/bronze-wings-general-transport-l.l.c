import { motion } from 'framer-motion';

/**
 * Scroll-triggered reveal: translateY + blur → settled, once on enter.
 */
export default function ScrollReveal({ children, delay = 0, y = 30, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(4px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}