import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const dim = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-12 w-12' }[size] || 'h-10 w-10';
  const border = { sm: 'border-2', md: 'border-4', lg: 'border-4' }[size] || 'border-4';
  return (
    <div className={`flex items-center justify-center py-10 px-4 w-full ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
        className={`${dim} ${border} border-transparent border-t-violet-500 border-r-fuchsia-500 rounded-full`}
      />
    </div>
  );
}