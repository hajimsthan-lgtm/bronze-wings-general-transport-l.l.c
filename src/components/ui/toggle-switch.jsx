import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated toggle switch with spring physics.
 * Usage: <ToggleSwitch on={value} onChange={setOn} />
 */
export default function ToggleSwitch({ on = false, onChange, size = 'md' }) {
  const [internal, setInternal] = useState(on);
  const isControlled = onChange !== undefined;
  const value = isControlled ? on : internal;
  const toggle = () => (isControlled ? onChange(!on) : setInternal(!internal));

  const dims = {
    md: { btn: 'h-8 w-14', knob: 'h-6 w-6' },
    sm: { btn: 'h-7 w-12', knob: 'h-5 w-5' },
    lg: { btn: 'h-9 w-16', knob: 'h-7 w-7' },
  }[size];

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={value}
      className={`flex ${dims.btn} items-center rounded-full p-1 transition-colors ${
        value ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`${dims.knob} rounded-full bg-white shadow flex items-center justify-center ${
          value ? 'ml-auto' : ''
        }`}
      />
    </button>
  );
}