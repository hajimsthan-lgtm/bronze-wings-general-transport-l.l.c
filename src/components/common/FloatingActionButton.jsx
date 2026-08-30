import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Truck, FileText, Receipt, X } from 'lucide-react';

export default function FloatingActionButton({ onNewTrip, onInvoice, onExpense }) {
  const [open, setOpen] = useState(false);

  const items = [
    { icon: Truck, color: '#fb923c', onClick: onNewTrip, label: 'New Trip' },
    { icon: FileText, color: '#22c55e', onClick: onInvoice, label: 'Invoice' },
    { icon: Receipt, color: '#f97316', onClick: onExpense, label: 'Expense' },
  ];

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => { item.onClick?.(); setOpen(false); }}
              className="flex items-center gap-2"
            >
              <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-full border border-white/10">
                {item.label}
              </span>
              <span
                className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: item.color, boxShadow: `0 4px 14px -2px ${item.color}80` }}
              >
                <Icon className="w-4 h-4 text-white" />
              </span>
            </motion.button>
          );
        })}
      </AnimatePresence>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full text-white shadow-xl flex items-center justify-center"
        style={{
          background: open
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
          boxShadow: '0 8px 24px -4px rgba(139,92,246,0.6)',
        }}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}