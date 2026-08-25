import { useState } from 'react';
import { Search, X, Clock } from 'lucide-react';
import { SHOWCASES } from '../showcases';
import { CATEGORIES } from '../catalog';

export default function SearchScreen({ history, onAddHistory, onRemoveHistory, onGoComponents }) {
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('all');

  const term = q.toLowerCase().trim();
  const results = [];
  Object.entries(SHOWCASES).forEach(([catId, items]) => {
    if (chip !== 'all' && chip !== catId) return;
    items.forEach((item) => {
      if (!term || item.title.toLowerCase().includes(term) || item.subtitle.toLowerCase().includes(term)) {
        const cat = CATEGORIES.find((c) => c.id === catId);
        results.push({ ...item, catId, catName: cat?.name || catId });
      }
    });
  });

  const submit = (term) => { if (term.trim()) onAddHistory(term); };

  return (
    <div className="min-h-full pb-4 px-4 pt-5">
      <p className="text-lg font-bold uf-text mb-3">Search</p>
      <div className="uf-card rounded-xl flex items-center gap-2 px-3 py-2.5 mb-3" style={{ border: '1px solid rgb(var(--uf-border))' }}>
        <Search className="w-4 h-4 uf-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit(q)} placeholder="Search components..." className="bg-transparent flex-1 text-sm uf-text outline-none" autoFocus />
        {q && <button onClick={() => setQ('')} className="uf-muted"><X className="w-4 h-4" /></button>}
      </div>

      {/* Quick filter chips */}
      <div className="flex gap-2 overflow-x-auto uf-scroll pb-1 -mx-4 px-4 mb-3">
        <button onClick={() => setChip('all')} className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={chip === 'all' ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : { background: 'rgb(var(--uf-card))', color: 'rgb(var(--uf-muted))', border: '1px solid rgb(var(--uf-border))' }}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setChip(c.id)} className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap" style={chip === c.id ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : { background: 'rgb(var(--uf-card))', color: 'rgb(var(--uf-muted))', border: '1px solid rgb(var(--uf-border))' }}>{c.name}</button>
        ))}
      </div>

      {/* Recent history */}
      {!term && history.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uf-muted uppercase tracking-wider font-bold mb-2">Recent</p>
          <div className="space-y-1">
            {history.map((h) => (
              <div key={h} className="flex items-center gap-2 px-2 py-1.5">
                <Clock className="w-3.5 h-3.5 uf-muted" />
                <button onClick={() => setQ(h)} className="flex-1 text-left text-xs uf-text">{h}</button>
                <button onClick={() => onRemoveHistory(h)} className="uf-muted"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {term && (
        <div>
          <p className="text-[10px] uf-muted uppercase tracking-wider font-bold mb-2">{results.length} result{results.length !== 1 ? 's' : ''}</p>
          <div className="space-y-1.5">
            {results.map((r) => (
              <button key={r.id} onClick={onGoComponents} className="w-full flex items-center justify-between px-3 py-2.5 uf-card rounded-xl" style={{ border: '1px solid rgb(var(--uf-border))' }}>
                <div className="text-left">
                  <p className="text-xs font-semibold uf-text">{r.title}</p>
                  <p className="text-[10px] uf-muted">{r.catName}</p>
                </div>
                <span className="text-[10px] uf-muted">{r.subtitle}</span>
              </button>
            ))}
            {results.length === 0 && <p className="text-xs uf-muted text-center py-8">No components found</p>}
          </div>
        </div>
      )}
    </div>
  );
}