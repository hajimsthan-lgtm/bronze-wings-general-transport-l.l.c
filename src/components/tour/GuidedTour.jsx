import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTour } from '@/lib/tour';
import { base44 } from '@/api/base44Client';
import { GraduationCap, ArrowRight, FastForward, Square, Volume2, Play, Pause, VolumeX, Loader2 } from 'lucide-react';

const LANGS = [
  { code: 'en', label: 'EN', voice: 'en-US', rtl: false },
  { code: 'ur', label: 'اردو', voice: 'ur-PK', rtl: true },
  { code: 'ml', label: 'മല', voice: 'ml-IN', rtl: false },
];

const translateCache = new Map();
async function translateTo(text, lang) {
  const key = lang + '::' + text;
  if (translateCache.has(key)) return translateCache.get(key);
  const langName = lang === 'ur' ? 'Urdu (اردو)' : 'Malayalam (മലയാളം)';
  try {
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Translate this English software UI tour description into ${langName}. Keep it natural, concise and friendly. Return JSON {"text": "..."}.\nEnglish: ${text}`,
      response_json_schema: { type: 'object', properties: { text: { type: 'string' } } },
    });
    const out = res?.text || res?.output?.text || text;
    translateCache.set(key, out);
    return out;
  } catch { return text; }
}

export default function GuidedTour() {
  const { active, steps, index, next, stop } = useTour();
  const [lang, setLang] = useState('en');
  const [rect, setRect] = useState(null);
  const [placeAbove, setPlaceAbove] = useState(false);
  const [desc, setDesc] = useState('');
  const [translating, setTranslating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  const step = active && index < steps.length ? steps[index] : null;
  const langObj = LANGS.find((l) => l.code === lang);

  useEffect(() => {
    if (location.pathname !== prevPath.current) { prevPath.current = location.pathname; stop(); }
  });

  useEffect(() => { if (active && index >= steps.length) stop(); }, [active, index, steps.length, stop]);

  // track target rect
  useEffect(() => {
    if (!active || !step) { setRect(null); return; }
    const el = step.el;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom });
      setPlaceAbove(r.bottom + 270 > window.innerHeight);
    };
    const t = setTimeout(update, 450);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { clearTimeout(t); window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [active, index, step]);

  // resolve description + auto-speak (on-demand LLM translation for ur/ml)
  useEffect(() => {
    if (!active || !step) { setDesc(''); return; }
    let cancelled = false;
    (async () => {
      let text = step[lang] || step.en;
      if (lang !== 'en' && !step[lang] && step.en) {
        setTranslating(true);
        text = await translateTo(step.en, lang);
        if (cancelled) return;
        step[lang] = text;
        setTranslating(false);
      }
      setDesc(text);
      try {
        window.speechSynthesis.cancel();
        setPaused(false);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = langObj?.voice || 'en-US';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      } catch {}
    })();
    return () => { cancelled = true; try { window.speechSynthesis.cancel(); } catch {} };
  }, [active, index, step, lang]);

  // poll speaking state
  useEffect(() => {
    const id = setInterval(() => {
      try {
        setSpeaking(window.speechSynthesis.speaking);
        if (!window.speechSynthesis.speaking) setPaused(false);
      } catch {}
    }, 300);
    return () => clearInterval(id);
  }, []);

  if (!active || !step) return null;

  const isLast = index >= steps.length - 1;
  const speak = (text) => {
    try { window.speechSynthesis.cancel(); setPaused(false); const u = new SpeechSynthesisUtterance(text); u.lang = langObj?.voice || 'en-US'; u.rate = 0.95; window.speechSynthesis.speak(u); } catch {}
  };
  const toggleVoice = () => {
    try {
      if (!window.speechSynthesis.speaking) { speak(desc || step.en); }
      else if (window.speechSynthesis.paused) { window.speechSynthesis.resume(); setPaused(false); }
      else { window.speechSynthesis.pause(); setPaused(true); }
    } catch {}
  };
  const stopVoice = () => { try { window.speechSynthesis.cancel(); setSpeaking(false); setPaused(false); } catch {} };
  const handleNext = () => { stopVoice(); isLast ? stop() : next(); };

  const vw = window.innerWidth || 360;
  const cardLeft = rect ? Math.max(12, Math.min(rect.left, vw - 392)) : 12;
  const cardTop = rect ? (placeAbove ? Math.max(12, rect.top - 250) : rect.bottom + 14) : 80;

  return (
    <div className="fixed inset-0 z-[100]">
      {rect && (
        <div className="absolute pointer-events-none transition-all duration-300" style={{
          top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
          borderRadius: 14,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.62), 0 0 0 2px rgba(30,215,96,0.9), 0 0 28px rgba(30,215,96,0.5)',
        }} />
      )}
      <div className="absolute z-[101] w-[min(92vw,380px)] animate-fade-in-up" style={{ top: cardTop, left: cardLeft }}>
        <div className="glass-card p-4" style={{ borderColor: 'rgba(30,215,96,0.4)' }}>
          {/* teacher avatar + numeric identifier */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, rgba(30,215,96,0.32), rgba(30,215,96,0.12))', border: '1px solid rgba(30,215,96,0.45)' }}>
              <GraduationCap className="w-6 h-6 text-blue-300 animate-float" />
              <span className="absolute -bottom-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#0f1320]" style={{ boxShadow: '0 0 10px rgba(30,215,96,0.7)' }}>{index + 1}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-wider text-blue-300/70 font-semibold flex items-center gap-2">
                Section {index + 1} / {steps.length}
                {speaking && <span className="inline-flex items-center gap-1 text-emerald-300 normal-case tracking-normal"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{paused ? 'paused' : 'speaking'}</span>}
              </div>
              <h3 className="text-base font-bold text-white truncate">{step.title}</h3>
            </div>
          </div>

          <div className="relative">
            <p dir={langObj?.rtl ? 'rtl' : 'ltr'} className="text-sm text-white/80 leading-relaxed min-h-[64px]">{desc || step.en}</p>
            {translating && (
              <div className="absolute top-0 right-0 inline-flex items-center gap-1 text-[10px] text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-full px-2 py-0.5">
                <Loader2 className="w-3 h-3 animate-spin" /> translating
              </div>
            )}
          </div>

          {/* language switch + voice controls */}
          <div className="flex items-center justify-between mt-3 mb-3">
            <div className="flex items-center gap-1">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code)} className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${lang === l.code ? 'bg-blue-500/30 text-white border border-blue-500/50' : 'text-white/55 border border-white/10 hover:text-white'}`}>{l.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={toggleVoice} title="Play / pause voice" className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors">
                {speaking && !paused ? <Pause className="w-4 h-4" /> : (speaking && paused ? <Play className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />)}
              </button>
              <button onClick={stopVoice} title="Stop voice" className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                <VolumeX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* tour controls */}
          <div className="flex items-center gap-2">
            <button onClick={handleNext} className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #1ED760, #1ED760)', boxShadow: '0 4px 12px rgba(30,215,96,0.4)' }}>
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