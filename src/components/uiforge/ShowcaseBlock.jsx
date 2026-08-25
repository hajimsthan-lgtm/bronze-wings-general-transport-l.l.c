import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Bookmark, BookmarkCheck } from 'lucide-react';

export default function ShowcaseBlock({ index, title, subtitle, code, bookmarked, onBookmark, children }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code || title);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="uf-card uf-border uf-shadow-soft rounded-2xl overflow-hidden"
      style={{ border: '1px solid rgb(var(--uf-border))' }}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ borderColor: 'rgb(var(--uf-border))' }}>
        <span className="uf-bg-primary uf-primary-fg text-[10px] font-bold tabular-nums w-6 h-6 rounded-lg flex items-center justify-center" style={{ color: 'rgb(var(--uf-primary-fg))' }}>
          {String(index).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uf-text truncate">{title}</p>
          {subtitle && <p className="text-[10px] uf-muted truncate">{subtitle}</p>}
        </div>
        <button onClick={copy} className="p-1.5 rounded-lg uf-muted hover:uf-primary transition-colors" title="Copy code">
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <button onClick={onBookmark} className="p-1.5 rounded-lg transition-colors" title="Bookmark">
          {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5 uf-muted" />}
        </button>
      </div>
      <div className="p-4 flex items-center justify-center min-h-[88px]">
        {children}
      </div>
    </motion.div>
  );
}