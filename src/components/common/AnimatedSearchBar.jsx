import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

export default function AnimatedSearchBar({ onSearch, placeholder = 'Search...', className = '' }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div className={`flex items-center justify-end ${className}`}>
      <motion.div
        animate={{ width: open ? 240 : 44 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative h-11 rounded-full overflow-hidden"
        style={{
          background: 'rgba(var(--surf-1-rgb), 0.50)',
          border: '1px solid rgba(var(--panel-accent-rgb), 0.12)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="absolute inset-0 flex items-center px-3.5">
          {open ? (
            <div className="flex items-center gap-2 w-full">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); onSearch?.(e.target.value); }}
                onBlur={() => { if (!value) setOpen(false); }}
                placeholder={placeholder}
                className="flex-1 min-w-0 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => { setValue(''); onSearch?.(''); setOpen(false); }}
                className="text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center">
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}