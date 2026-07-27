import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour } from '@/lib/tour';
import { GraduationCap, ArrowRight, FastForward, Square, Volume2 } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'EN', voice: 'en-US', rtl: false },
  { code: 'ur', label: 'اردو', voice: 'ur-PK', rtl: true },
  { code: 'ml', label: 'മല', voice: 'ml-IN', rtl: false },
];

export default function GuidedTour() {
  const { active, steps, index, next, stop } = useTour();
  const [lang, setLang] = useState('en');
  const [rect, setRect] = useState(null);
  const [placeAbove, setPlaceAbove] = useState(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const step = active && index < steps.length ? steps[index] : null;

  // stop on route change
  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      stop();
    }
  });

  // finish if past last
  useEffect(() => {
    if (active && index >= steps.length) stop();
  }, [active, index, steps.length, stop]);

  // track target rect
  useEffect(() => {
    if (!active || !step) { setRect(null); return; }
    const el = step.el;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom });
      setPlaceAbove(r.bottom + 250 > window.innerHeight);
    };
    const t = setTimeout(update, 450);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { clearTimeout(t); window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [active, index, step]);

  // speak on step / language change
  useEffect(() => {
    if (!active || !step) return;
    const text = step[lang] || step.en;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGS.find((l) => l.code === lang)?.voice || 'en-US';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, [active, index, lang, step]);

  if (!active || !step) return null;

  const isLast = index >= steps.length - 1;
  const langObj = LANGS.find((l) => l.code === lang);
  const desc = step[lang] || step.en;

  const speak = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(desc);
      u.lang = langObj?.voice || 'en-US';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch {}
  };
  const handleNext = () => (isLast ? stop() : next());

  const vw = window.innerWidth || 360;
  const cardLeft = rect ? Math.max(12, Math.min(rect.left, vw - 392)) : 12;
  const cardTop = rect ? (placeAbove ? Math.max(12, rect.top - 240) : rect.bottom + 14) : 80;

  return (
    <div className="fixed inset-0 z-[100]">
      {rect && (
        <div className="absolute pointer-events-none transition-all duration-300" style={{
          top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
          borderRadius: 14,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 2px rgba(59,130,246,0.9), 0 0 28px rgba(59,130,246,0.5)',
        }} />
      )}
      <div className="absolute z-[101] w-[min(92vw,380px)] animate-fade-in-up" style={{ top: cardTop, left: cardLeft }}>
        <div className="glass-card p-4" style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
          {/* teacher guide avatar (animated gif-like) */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.32), rgba(59,130,246,0.12))', border: '1px solid rgba(59,130,246,0.45)' }}>
              <GraduationCap className="w-6 h-6 text-blue-300 animate-float" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold">Section {index + 1} / {steps.length}</div>
              <h3 className="text-base font-bold text-white truncate">{step.title}</h3>
            </div>
          </div>

          <p dir={langObj?.rtl ? 'rtl' : 'ltr'} className="text-sm text-white/80 leading-relaxed min-h-[64px]">{desc}</p>

          {/* language switch + voice */}
          <div className="flex items-center justify-between mt-3 mb-3">
            <div className="flex items-center gap-1">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${lang === l.code ? 'bg-blue-500/30 text-white border border-blue-500/50' : 'text-white/55 border border-white/10 hover:text-white'}`}>{l.label}</button>
              ))}
            </div>
            <button onClick={speak} title="Play voice" className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* controls — colored original icons */}
          <div className="flex items-center gap-2">
            <button onClick={handleNext} className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}>
              <ArrowRight className="w-4 h-4" /> {isLast ? 'Finish' : 'Next'}
            </button>
            <button onClick={stop} title="Skip tour" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-colors">
              <FastForward className="w-4 h-4" />
            </button>
            <button onClick={stop} title="Stop tour" className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-colors">
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}