import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

/**
 * Expandable search input — collapses to an icon, expands on focus/click.
 * Usage: <AnimatedInput placeholder="Search..." value={q} onChange={setQ} />
 */
export default function AnimatedInput({
  placeholder = 'Search...',
  value = '',
  onChange,
  openWidth = 220,
  closedWidth = 40,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <motion.input
        ref={inputRef}
        animate={{ width: open ? openWidth : closedWidth }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => !value && setOpen(false)}
        placeholder={placeholder}
        className="h-10 rounded-full bg-muted/60 border border-border/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
        style={{ paddingRight: open ? 36 : 10 }}
      />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {open && value ? (
          <X
            className="w-4 h-4"
            onClick={(e) => {
              e.stopPropagation();
              onChange?.('');
            }}
          />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}