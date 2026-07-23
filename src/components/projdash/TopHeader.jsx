import { useState } from 'react';
import { Search, Bell } from 'lucide-react';

export default function TopHeader() {
  const [tab, setTab] = useState('done');
  const tabs = ['done', 'in progress'];
  return (
    <header
      className="flex items-center justify-between gap-4 h-16 px-4 sm:px-6 flex-shrink-0 z-20"
      style={{ background: 'rgba(15,15,23,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <h1 className="text-xl sm:text-2xl font-bold text-white">Overview</h1>

      <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)' }}>
        {tabs.map((opt) => (
          <button
            key={opt}
            onClick={() => setTab(opt)}
            className="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
            style={tab === opt ? { background: '#3b82f6', color: '#fff' } : { color: '#9ca3af' }}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: '#9ca3af' }}><Search className="w-4 h-4" /></button>
        <button className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/5" style={{ color: '#9ca3af' }}>
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }}>SP</div>
      </div>
    </header>
  );
}