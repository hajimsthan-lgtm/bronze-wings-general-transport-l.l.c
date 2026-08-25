import { useState } from 'react';
import { motion } from 'framer-motion';
import ShowcaseBlock from '../ShowcaseBlock';
import { CATEGORIES } from '../catalog';
import { SHOWCASES } from '../showcases';
import { MousePointerClick, Compass, Table, LayoutGrid, TextCursorInput, Bell, BarChart3, Layers, Sparkles, Palette, Zap } from 'lucide-react';

const ICONS = { MousePointerClick, Compass, Table, LayoutGrid, TextCursorInput, Bell, BarChart3, Layers, Sparkles, Palette, Zap };

export default function ComponentsScreen({ bookmarks, onToggleBookmark }) {
  const [activeChip, setActiveChip] = useState('all');
  const filtered = activeChip === 'all' ? CATEGORIES : CATEGORIES.filter((c) => c.id === activeChip);

  return (
    <div className="min-h-full pb-4">
      <div className="sticky top-0 z-30 px-4 pt-4 pb-2 uf-bg" style={{ background: 'rgb(var(--uf-bg))' }}>
        <p className="text-lg font-bold uf-text mb-2">Components</p>
        <div className="flex gap-2 overflow-x-auto uf-scroll pb-1 -mx-4 px-4">
          <button onClick={() => setActiveChip('all')} className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors" style={activeChip === 'all' ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : { background: 'rgb(var(--uf-card))', color: 'rgb(var(--uf-muted))', border: '1px solid rgb(var(--uf-border))' }}>All</button>
          {CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveChip(cat.id)} className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors" style={activeChip === cat.id ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : { background: 'rgb(var(--uf-card))', color: 'rgb(var(--uf-muted))', border: '1px solid rgb(var(--uf-border))' }}>{cat.name}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2 space-y-5">
        {filtered.map((cat) => {
          const items = SHOWCASES[cat.id] || [];
          if (!items.length) return null;
          const Icon = ICONS[cat.icon] || Sparkles;
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}><Icon className="w-3.5 h-3.5 text-white" /></div>
                <p className="text-sm font-bold uf-text">{cat.name}</p>
                <span className="text-[10px] uf-muted ml-auto">{items.length}</span>
              </div>
              <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="space-y-2.5">
                {items.map((item, idx) => {
                  const Comp = item.Component;
                  return (
                    <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}>
                      <ShowcaseBlock index={idx + 1} title={item.title} subtitle={item.subtitle} code={item.code} bookmarked={!!bookmarks[item.id]} onBookmark={() => onToggleBookmark(item.id, { id: item.id, title: item.title, category: cat.id, categoryName: cat.name })}>
                        <Comp />
                      </ShowcaseBlock>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}