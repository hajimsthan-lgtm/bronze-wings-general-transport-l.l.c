import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Users, Search, Plus, Pencil, Filter, X, Check } from 'lucide-react';

export default function ContactPersonSmartSelector({ contactPersons = [], activeFilter, onFilter, onAdd, onEdit }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = contactPersons.filter((cp) => `${cp.name || ''} ${cp.department || ''} ${cp.email || ''}`.toLowerCase().includes(q.toLowerCase()));
  const active = activeFilter ? contactPersons.find((cp) => cp.name === activeFilter) : null;

  return (
    <div className="glass-card p-3 mb-4 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
        <Users className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Contact Person</p>
        <p className="text-sm font-medium text-foreground truncate">{active ? active.name : 'All contacts'}</p>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors whitespace-nowrap">
            <Filter className="w-3.5 h-3.5" /> Select
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0 bg-popover border-border" align="end">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-8 h-8 bg-background border-border text-xs" />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            <button
              onClick={() => { onFilter(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors ${!activeFilter ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <Users className="w-3.5 h-3.5" /> All contacts
              {!activeFilter && <Check className="w-3.5 h-3.5 ml-auto" />}
            </button>
            {list.map((cp, i) => (
              <div key={i} className={`w-full flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs transition-colors ${activeFilter === cp.name ? 'bg-primary/15' : 'hover:bg-white/5'}`}>
                <button onClick={() => { onFilter(cp.name); setOpen(false); }} className="flex-1 flex items-center gap-2 text-left min-w-0">
                  <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0">{(cp.name || '?')[0].toUpperCase()}</div>
                  <div className="min-w-0">
                    <p className="text-foreground truncate">{cp.name}</p>
                    {cp.department && <p className="text-[10px] text-muted-foreground truncate">{cp.department}</p>}
                  </div>
                  {activeFilter === cp.name && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                </button>
                <button onClick={() => { onEdit?.(i); setOpen(false); }} className="text-muted-foreground hover:text-primary p-1 flex-shrink-0">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            ))}
            {list.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">No contacts found</p>}
          </div>
          <div className="p-2 border-t border-border">
            <button
              onClick={() => { onAdd?.(); setOpen(false); }}
              className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add new contact
            </button>
          </div>
        </PopoverContent>
      </Popover>
      {active && (
        <button onClick={() => onFilter(null)} className="inline-flex items-center gap-1 h-8 px-2 rounded-lg bg-muted/40 text-muted-foreground text-[11px] hover:text-foreground transition-colors whitespace-nowrap">
          <X className="w-3 h-3" /> Clear
        </button>
      )}
    </div>
  );
}