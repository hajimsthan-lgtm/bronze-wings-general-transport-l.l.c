import { motion } from 'framer-motion';
import { Search, Sun, Moon, ArrowRight, Copy, Check, MousePointerClick, Compass, Table, LayoutGrid, TextCursorInput, Bell, BarChart3, Layers, Sparkles, Palette, Zap } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES, PROMPT_TEXT } from '../catalog';
import { SHOWCASES } from '../showcases';

const ICONS = { MousePointerClick, Compass, Table, LayoutGrid, TextCursorInput, Bell, BarChart3, Layers, Sparkles, Palette, Zap };

export default function HomeScreen({ theme, onToggleTheme, onGoSearch, onGoComponents }) {
  const [copied, setCopied] = useState(false);
  const copyPrompt = () => { navigator.clipboard?.writeText(PROMPT_TEXT); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="min-h-full pb-4">
      {/* Hero */}
      <div className="rounded-b-3xl px-5 pt-8 pb-6" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 50%, #6d28d9 100%)' }}>
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/90 font-bold text-lg tracking-tight">UIForge</span>
          <div className="flex items-center gap-2">
            <button onClick={onGoSearch} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center"><Search className="w-4 h-4 text-white" /></button>
            <button onClick={onToggleTheme} className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">{theme === 'dark' ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-white" />}</button>
          </div>
        </div>
        <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-white text-2xl font-bold leading-tight mb-1">100+ UI Components</motion.h1>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 text-sm mb-4">Premium mobile-first showcase</motion.p>
        <motion.button whileTap={{ scale: 0.96 }} onClick={onGoComponents} className="bg-white text-violet-700 text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-1.5">
          Start exploring <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Category grid */}
      <div className="px-4 pt-5">
        <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-3">Categories</p>
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = ICONS[cat.icon] || Sparkles;
            const count = (SHOWCASES[cat.id] || []).length;
            return (
              <motion.button key={cat.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} whileTap={{ scale: 0.97 }} onClick={onGoComponents} className="uf-card rounded-2xl p-3.5 text-left uf-shadow-soft" style={{ border: '1px solid rgb(var(--uf-border))' }}>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-2`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <p className="text-xs font-bold uf-text">{cat.name}</p>
                <p className="text-[10px] uf-muted">{count} components</p>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Prompt card */}
      <div className="px-4 pt-5">
        <div className="uf-glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uf-text">Base44 Prompt</p>
            <button onClick={copyPrompt} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--uf-primary),0.15)' }}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" style={{ color: 'rgb(var(--uf-primary))' }} />}
            </button>
          </div>
          <p className="text-[10px] uf-muted leading-relaxed line-clamp-4">Copy this prompt into a new Base44 app to rebuild this showcase...</p>
        </div>
      </div>
    </div>
  );
}