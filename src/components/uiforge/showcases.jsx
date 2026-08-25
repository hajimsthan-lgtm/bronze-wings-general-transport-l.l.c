import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronDown, ChevronRight, Star, Plus, Minus, Play, Pause, SkipForward,
  TrendingUp, TrendingDown, Sun, Wind, Droplet, Wifi, Bluetooth, Moon, Plane,
  Mail, Bell, Wallet, Crown, Hexagon, Zap, Flame, Circle, Square,
} from 'lucide-react';

/* ───────────────── BUTTONS ───────────────── */
const AuroraButton = () => (
  <motion.button whileTap={{ scale: 0.95 }} className="uf-gradient-aurora text-white font-semibold text-sm px-6 py-2.5 rounded-xl uf-shadow-lg">Aurora Button</motion.button>
);
const IridescentButton = () => (
  <motion.button whileTap={{ scale: 0.95 }} className="uf-gradient-iridescent text-white font-semibold text-sm px-6 py-2.5 rounded-xl">Iridescent</motion.button>
);
const NeonGlowButton = () => (
  <motion.button whileTap={{ scale: 0.95 }} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-cyan-300 border border-cyan-400/50" style={{ background: 'rgba(6,182,212,0.1)', boxShadow: '0 0 20px rgba(6,182,212,0.4), inset 0 0 12px rgba(6,182,212,0.15)' }}>Neon Glow</motion.button>
);
const GlassButton = () => (
  <motion.button whileTap={{ scale: 0.95 }} className="uf-glass uf-text text-sm font-semibold px-6 py-2.5 rounded-xl">Glass Button</motion.button>
);
const NeumorphicButton = () => (
  <motion.button whileTap={{ scale: 0.97 }} className="uf-neu uf-text text-sm font-semibold px-6 py-2.5 rounded-xl">Neumorphic</motion.button>
);
const RippleButton = () => {
  const [ripples, setRipples] = useState([]);
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const id = Date.now();
        setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
        setTimeout(() => setRipples((r) => r.filter((x) => x.id !== id)), 600);
      }}
      className="relative overflow-hidden uf-bg-primary text-sm font-semibold px-6 py-2.5 rounded-xl"
      style={{ background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' }}
    >
      Tap for Ripple
      {ripples.map((r) => (
        <motion.span key={r.id} initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.6 }} className="absolute rounded-full bg-white/40 w-6 h-6" style={{ left: r.x - 12, top: r.y - 12 }} />
      ))}
    </motion.button>
  );
};
const LoadingButton = () => {
  const [loading, setLoading] = useState(false);
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }} className="uf-gradient-violet text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2 min-w-[130px] justify-center">
      {loading ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> : 'Loading Button'}
    </motion.button>
  );
};

/* ───────────────── NAVIGATION ───────────────── */
const SegmentedControl = () => {
  const [tab, setTab] = useState(0);
  const items = ['Day', 'Week', 'Month'];
  return (
    <div className="uf-neu-inset rounded-xl p-1 flex gap-1 w-full max-w-[240px]">
      {items.map((item, i) => (
        <button key={item} onClick={() => setTab(i)} className="relative flex-1 py-2 text-xs font-semibold z-10" style={{ color: tab === i ? 'rgb(var(--uf-primary))' : 'rgb(var(--uf-muted))' }}>
          {tab === i && <motion.div layoutId="seg-ctrl" className="absolute inset-0 uf-card rounded-lg uf-shadow-soft" />}
          <span className="relative z-10">{item}</span>
        </button>
      ))}
    </div>
  );
};
const StepperNav = () => {
  const [step, setStep] = useState(1);
  return (
    <div className="flex items-center gap-1 w-full max-w-[260px]">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <motion.div animate={{ scale: step === i ? 1.15 : 1 }} onClick={() => setStep(i)} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer" style={step >= i ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : {}}>
            {step > i ? <Check className="w-3.5 h-3.5 text-white" /> : i + 1}
          </motion.div>
          {i < 3 && <div className="flex-1 h-1 mx-1 rounded-full" style={{ background: step > i ? 'rgb(var(--uf-primary))' : 'rgb(var(--uf-border))' }} />}
        </div>
      ))}
    </div>
  );
};
const Breadcrumbs = () => (
  <div className="flex items-center gap-1 text-xs">
    <span className="uf-muted">Home</span><ChevronRight className="w-3 h-3 uf-muted" />
    <span className="uf-muted">Category</span><ChevronRight className="w-3 h-3 uf-muted" />
    <span className="font-semibold" style={{ color: 'rgb(var(--uf-primary))' }}>Current</span>
  </div>
);
const Pagination = () => {
  const [page, setPage] = useState(2);
  return (
    <div className="flex items-center gap-1.5">
      <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="uf-neu w-8 h-8 rounded-lg flex items-center justify-center uf-muted"><ChevronRight className="w-4 h-4 rotate-180" /></button>
      {[1, 2, 3].map((p) => (
        <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-xs font-bold" style={page === p ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : {}}>{p}</button>
      ))}
      <button onClick={() => setPage((p) => Math.min(3, p + 1))} className="uf-neu w-8 h-8 rounded-lg flex items-center justify-center uf-muted"><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
};
const DrawerNav = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(true)} className="uf-glass uf-text text-sm font-semibold px-5 py-2.5 rounded-xl">Open Drawer</motion.button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-[60]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }} className="fixed left-0 top-0 bottom-0 w-64 uf-card uf-shadow-lg z-[61] p-5">
              <p className="uf-text font-bold mb-4">Menu</p>
              {['Dashboard', 'Profile', 'Settings', 'Logout'].map((item) => (
                <div key={item} className="uf-muted text-sm py-2.5 px-3 rounded-lg cursor-pointer">{item}</div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────────── TABLES ───────────────── */
const GlassTable = () => (
  <div className="uf-glass rounded-xl overflow-hidden w-full text-xs">
    <div className="grid grid-cols-3 px-3 py-2 font-bold uf-text border-b" style={{ borderColor: 'rgb(var(--uf-border))' }}>
      <span>Name</span><span>Role</span><span className="text-right">Status</span>
    </div>
    {[{ n: 'Alice', r: 'Admin', s: 'Active' }, { n: 'Bob', r: 'Editor', s: 'Pending' }, { n: 'Carol', r: 'Viewer', s: 'Active' }].map((row) => (
      <div key={row.n} className="grid grid-cols-3 px-3 py-2 uf-muted border-b last:border-0" style={{ borderColor: 'rgb(var(--uf-border))' }}>
        <span className="uf-text font-medium">{row.n}</span><span>{row.r}</span><span className="text-right text-emerald-500">{row.s}</span>
      </div>
    ))}
  </div>
);
const ExpandableRow = () => {
  const [open, setOpen] = useState(null);
  const rows = [{ id: 1, n: 'Order #1024', v: 'AED 1,250' }, { id: 2, n: 'Order #1025', v: 'AED 890' }];
  return (
    <div className="w-full text-xs">
      {rows.map((r) => (
        <div key={r.id}>
          <div onClick={() => setOpen(open === r.id ? null : r.id)} className="flex items-center justify-between px-3 py-2.5 uf-card rounded-xl mb-1 cursor-pointer">
            <span className="uf-text font-medium">{r.n}</span>
            <div className="flex items-center gap-2"><span className="uf-muted">{r.v}</span><ChevronDown className={`w-3.5 h-3.5 uf-muted transition-transform ${open === r.id ? 'rotate-180' : ''}`} /></div>
          </div>
          <AnimatePresence>
            {open === r.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-3 py-2 uf-muted text-[11px]">Details: This order contains 3 items shipped to Dubai.</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
const Leaderboard = () => (
  <div className="w-full space-y-1.5">
    {[{ n: 'Sarah K.', pts: 9840, m: '🥇' }, { n: 'Mike R.', pts: 9520, m: '🥈' }, { n: 'Emma L.', pts: 9100, m: '🥉' }].map((r) => (
      <div key={r.n} className="flex items-center gap-3 uf-card rounded-xl px-3 py-2">
        <span className="text-lg">{r.m}</span><span className="uf-text font-semibold text-sm flex-1">{r.n}</span><span className="uf-muted text-xs tabular-nums">{r.pts.toLocaleString()}</span>
      </div>
    ))}
  </div>
);
const KPICards = () => (
  <div className="grid grid-cols-2 gap-2 w-full">
    {[{ l: 'Revenue', v: 'AED 48K', up: true, i: 12 }, { l: 'Orders', v: '1,204', up: true, i: 8 }, { l: 'Refunds', v: '23', up: false, i: 3 }, { l: 'Growth', v: '18.2%', up: true, i: 5 }].map((k) => (
      <div key={k.l} className="uf-card rounded-xl p-3">
        <p className="text-[10px] uf-muted">{k.l}</p><p className="text-base font-bold uf-text">{k.v}</p>
        <p className={`text-[10px] flex items-center gap-0.5 ${k.up ? 'text-emerald-500' : 'text-rose-500'}`}>{k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {k.i}%</p>
      </div>
    ))}
  </div>
);
const HeatmapGrid = () => (
  <div className="grid grid-cols-7 gap-1 w-full max-w-[240px]">
    {Array.from({ length: 35 }, () => Math.random()).map((v, i) => (
      <div key={i} className="aspect-square rounded-sm" style={{ background: `rgba(139,92,246,${0.1 + v * 0.8})` }} />
    ))}
  </div>
);
const CryptoRow = () => (
  <div className="w-full space-y-1.5">
    {[{ n: 'BTC', p: 'AED 245K', c: 2.4, up: true }, { n: 'ETH', p: 'AED 12.4K', c: -1.2, up: false }].map((r) => (
      <div key={r.n} className="flex items-center gap-3 uf-card rounded-xl px-3 py-2.5">
        <div className="w-8 h-8 rounded-full uf-gradient-violet flex items-center justify-center text-white text-[10px] font-bold">{r.n.slice(0, 2)}</div>
        <span className="uf-text font-semibold text-sm">{r.n}</span>
        <div className="flex-1 text-right"><p className="uf-text text-xs font-bold">{r.p}</p><p className={`text-[10px] ${r.up ? 'text-emerald-500' : 'text-rose-500'}`}>{r.up ? '+' : ''}{r.c}%</p></div>
      </div>
    ))}
  </div>
);
const SkeletonTable = () => {
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 2000); return () => clearTimeout(t); }, []);
  if (!loading) return <div className="w-full text-xs uf-muted text-center py-3">Data loaded ✓</div>;
  return (
    <div className="w-full space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--uf-border)) 25%, rgb(var(--uf-muted)) 50%, rgb(var(--uf-border)) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div className="h-3 flex-1 rounded" style={{ background: 'linear-gradient(90deg, rgb(var(--uf-border)) 25%, rgb(var(--uf-muted)) 50%, rgb(var(--uf-border)) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
        </div>
      ))}
    </div>
  );
};

/* ───────────────── CARDS ───────────────── */
const FlipCard3D = () => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="w-32 h-40 cursor-pointer" style={{ perspective: 800 }} onClick={() => setFlipped(!flipped)}>
      <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0 uf-gradient-violet rounded-2xl flex flex-col items-center justify-center text-white p-3" style={{ backfaceVisibility: 'hidden' }}>
          <Crown className="w-8 h-8 mb-2" /><p className="text-sm font-bold">Premium</p><p className="text-[10px] opacity-80">Tap to flip</p>
        </div>
        <div className="absolute inset-0 uf-card rounded-2xl flex flex-col items-center justify-center p-3" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <Star className="w-8 h-8 mb-2 text-amber-500" /><p className="text-sm font-bold uf-text">Member</p><p className="text-[10px] uf-muted">Tap to flip</p>
        </div>
      </motion.div>
    </div>
  );
};
const HolographicCard = () => (
  <motion.div whileHover={{ scale: 1.03 }} className="uf-gradient-iridescent rounded-2xl p-4 w-40 text-white relative overflow-hidden">
    <div className="relative z-10"><Hexagon className="w-6 h-6 mb-2" /><p className="font-bold text-sm">Holographic</p><p className="text-[10px] opacity-90">Iridescent surface</p></div>
  </motion.div>
);
const PricingCard = () => (
  <div className="uf-card rounded-2xl p-4 w-40 uf-shadow-lg border-2" style={{ borderColor: 'rgb(var(--uf-primary))' }}>
    <p className="text-[10px] uf-muted uppercase tracking-wider">Pro Plan</p>
    <p className="text-2xl font-bold uf-text mt-1">AED 49<span className="text-xs uf-muted">/mo</span></p>
    <div className="space-y-1.5 mt-3">
      {['Unlimited trips', 'Advanced reports', 'Priority support'].map((f) => (
        <div key={f} className="flex items-center gap-1.5 text-[11px] uf-text"><Check className="w-3 h-3 text-emerald-500" /> {f}</div>
      ))}
    </div>
    <motion.button whileTap={{ scale: 0.96 }} className="w-full text-xs font-bold py-2 rounded-lg mt-3" style={{ background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' }}>Choose Plan</motion.button>
  </div>
);
const StatsCard = () => (
  <div className="uf-glass rounded-2xl p-4 w-40">
    <div className="flex items-center justify-between mb-2"><span className="text-[10px] uf-muted uppercase">Visitors</span><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /></div>
    <p className="text-2xl font-bold uf-text">12.4K</p>
    <div className="flex items-end gap-0.5 mt-2 h-8">
      {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
        <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} className="flex-1 rounded-sm" style={{ background: 'rgb(var(--uf-primary))' }} />
      ))}
    </div>
  </div>
);
const ProfileCard = () => (
  <div className="uf-card rounded-2xl p-4 w-40 text-center uf-shadow-soft">
    <div className="w-14 h-14 rounded-full uf-gradient-violet mx-auto mb-2 flex items-center justify-center text-white text-lg font-bold">SK</div>
    <p className="font-bold uf-text text-sm">Sarah Khan</p><p className="text-[10px] uf-muted">Fleet Manager</p>
    <div className="flex justify-center gap-3 mt-2 text-[10px]"><span className="uf-muted"><b className="uf-text">128</b> Trips</span><span className="uf-muted"><b className="uf-text">4.9</b> Rating</span></div>
  </div>
);

/* ───────────────── FORMS ───────────────── */
const GlassInput = () => (
  <div className="uf-glass rounded-xl flex items-center gap-2 px-3 py-2.5 w-full max-w-[240px]">
    <Mail className="w-4 h-4 uf-muted" />
    <input placeholder="Email address" className="bg-transparent flex-1 text-sm uf-text outline-none" />
  </div>
);
const NeumorphicInput = () => (
  <div className="uf-neu-inset rounded-xl px-3 py-2.5 w-full max-w-[240px]">
    <input placeholder="Search..." className="bg-transparent w-full text-sm uf-text outline-none" />
  </div>
);
const IOSToggle = () => {
  const [on, setOn] = useState(true);
  return (
    <div className="flex items-center gap-4">
      <button onClick={() => setOn(!on)} className="flex items-center gap-2">
        <motion.div animate={{ background: on ? 'rgb(var(--uf-primary))' : 'rgb(var(--uf-border))' }} className="w-11 h-6 rounded-full p-0.5 flex items-center">
          <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} className="w-5 h-5 bg-white rounded-full shadow-md" style={{ marginLeft: on ? 20 : 0 }} />
        </motion.div>
        <span className="text-xs uf-muted">Wi-Fi</span>
      </button>
    </div>
  );
};
const NeumorphicSlider = () => {
  const [val, setVal] = useState(50);
  return (
    <div className="w-full max-w-[240px]">
      <input type="range" min="0" max="100" value={val} onChange={(e) => setVal(e.target.value)} className="w-full" style={{ accentColor: 'rgb(var(--uf-primary))' }} />
      <p className="text-xs uf-muted text-center mt-1">{val}%</p>
    </div>
  );
};
const OTPInput = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  return (
    <div className="flex gap-2">
      {otp.map((d, i) => (
        <input key={i} maxLength={1} value={d} onChange={(e) => { const n = [...otp]; n[i] = e.target.value; setOtp(n); if (e.target.value && i < 3) e.target.nextSibling?.focus(); }} className="w-9 h-11 text-center text-lg font-bold uf-card rounded-xl uf-shadow-soft uf-text outline-none" style={{ border: '1px solid rgb(var(--uf-border))' }} />
      ))}
    </div>
  );
};
const NeumorphicKeypad = () => {
  const [val, setVal] = useState('');
  return (
    <div className="text-center">
      <p className="uf-text text-xl font-bold mb-2 tabular-nums">{val || '—'}</p>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} disabled={!k} onClick={() => setVal(k === '⌫' ? val.slice(0, -1) : val + k)} className="uf-neu w-12 h-12 rounded-full uf-text font-bold text-sm disabled:opacity-0">{k}</motion.button>
        ))}
      </div>
    </div>
  );
};
const NeumorphicStepper = () => {
  const [val, setVal] = useState(3);
  return (
    <div className="flex items-center gap-3">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setVal((v) => Math.max(0, v - 1))} className="uf-neu w-10 h-10 rounded-full flex items-center justify-center uf-text"><Minus className="w-4 h-4" /></motion.button>
      <span className="uf-text text-xl font-bold tabular-nums w-8 text-center">{val}</span>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setVal((v) => v + 1)} className="uf-neu w-10 h-10 rounded-full flex items-center justify-center uf-text"><Plus className="w-4 h-4" /></motion.button>
    </div>
  );
};

/* ───────────────── FEEDBACK ───────────────── */
const ShimmerLoader = () => (
  <div className="w-full max-w-[200px] space-y-2">
    <div className="h-3 rounded" style={{ background: 'linear-gradient(90deg, rgb(var(--uf-border)) 25%, rgb(var(--uf-muted)) 50%, rgb(var(--uf-border)) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    <div className="h-3 w-3/4 rounded" style={{ background: 'linear-gradient(90deg, rgb(var(--uf-border)) 25%, rgb(var(--uf-muted)) 50%, rgb(var(--uf-border)) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
  </div>
);
const BouncingDots = () => (
  <div className="flex items-center gap-1.5">
    {[0, 1, 2].map((i) => (
      <motion.div key={i} animate={{ y: [0, -8, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} className="w-3 h-3 rounded-full" style={{ background: 'rgb(var(--uf-primary))' }} />
    ))}
  </div>
);
const EqualizerBars = () => (
  <div className="flex items-end gap-1 h-10">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div key={i} animate={{ height: ['30%', '100%', '50%', '80%', '30%'] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 rounded-full" style={{ background: 'rgb(var(--uf-primary))' }} />
    ))}
  </div>
);
const DualRingSpinner = () => (
  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-10 h-10 rounded-full" style={{ borderTopColor: 'rgb(var(--uf-primary))', borderBottomColor: 'rgb(var(--uf-accent))', borderWidth: 3, borderStyle: 'solid', borderColor: 'transparent' }} />
);
const ProgressBar = () => {
  const [p, setP] = useState(0);
  useEffect(() => { const t = setInterval(() => setP((v) => (v >= 100 ? 0 : v + 5)), 200); return () => clearInterval(t); }, []);
  return (
    <div className="w-full max-w-[200px]">
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgb(var(--uf-border))' }}>
        <motion.div animate={{ width: `${p}%` }} className="h-full uf-gradient-violet rounded-full" />
      </div>
      <p className="text-[10px] uf-muted text-center mt-1">{p}%</p>
    </div>
  );
};
const Badge = () => (
  <div className="flex gap-2 flex-wrap justify-center">
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-500 bg-emerald-500/15 border border-emerald-500/30">Active</span>
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-500 bg-amber-500/15 border border-amber-500/30">Pending</span>
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-rose-500 bg-rose-500/15 border border-rose-500/30">Failed</span>
  </div>
);
const AlertBanner = () => (
  <div className="uf-glass rounded-xl px-3 py-2.5 flex items-center gap-2 w-full max-w-[260px]">
    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><Bell className="w-4 h-4 text-amber-500" /></div>
    <p className="text-xs uf-text">License expiring in 5 days</p>
  </div>
);

/* ───────────────── DATA DISPLAY ───────────────── */
const Sparkline = () => {
  const pts = [20, 35, 28, 45, 40, 60, 55, 70, 65, 80];
  const max = Math.max(...pts);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * 200} ${50 - (p / max) * 40}`).join(' ');
  return (
    <svg viewBox="0 0 200 50" className="w-full max-w-[200px]">
      <defs><linearGradient id="spk" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--uf-primary))" stopOpacity="0.3" /><stop offset="100%" stopColor="rgb(var(--uf-primary))" stopOpacity="0" /></linearGradient></defs>
      <path d={`${path} L 200 50 L 0 50 Z`} fill="url(#spk)" /><path d={path} fill="none" stroke="rgb(var(--uf-primary))" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
const DonutChart = () => {
  const data = [{ v: 45, c: '#8b5cf6' }, { v: 30, c: '#ec4899' }, { v: 25, c: '#f59e0b' }];
  const total = data.reduce((s, d) => s + d.v, 0);
  let offset = 0;
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {data.map((d, i) => { const dash = (d.v / total) * 100; const el = <circle key={i} cx="18" cy="18" r="15.5" fill="none" stroke={d.c} strokeWidth="4" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} />; offset += dash; return el; })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="uf-text text-lg font-bold">{total}%</span></div>
    </div>
  );
};
const BarChart = () => (
  <div className="flex items-end gap-2 h-24 w-full max-w-[240px]">
    {[45, 70, 55, 85, 60, 95, 75].map((h, i) => (
      <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex-1 rounded-t-md" style={{ background: 'linear-gradient(180deg, rgb(var(--uf-primary)), rgb(var(--uf-accent)))' }} />
    ))}
  </div>
);
const LineChart = () => {
  const pts = [10, 30, 25, 45, 35, 55, 50, 70];
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * 200} ${60 - p * 0.7}`).join(' ');
  return (
    <svg viewBox="0 0 200 60" className="w-full max-w-[240px]">
      <defs><linearGradient id="ln" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" /></linearGradient></defs>
      <path d={`${path} L 200 60 L 0 60 Z`} fill="url(#ln)" /><path d={path} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
};
const Accordion = () => {
  const [open, setOpen] = useState(0);
  const items = [{ q: 'What is UIForge?', a: 'A mobile component showcase library.' }, { q: 'How many components?', a: '335+ premium components.' }];
  return (
    <div className="w-full max-w-[260px] space-y-1.5">
      {items.map((item, i) => (
        <div key={i} className="uf-card rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uf-text">
            {item.q}<ChevronDown className={`w-4 h-4 uf-muted transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {open === i && (<motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden"><p className="px-3 pb-2.5 text-[11px] uf-muted">{item.a}</p></motion.div>)}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
const Timeline = () => (
  <div className="w-full max-w-[240px]">
    {[{ t: 'Order placed', d: '10:30 AM', done: true }, { t: 'Driver assigned', d: '10:45 AM', done: true }, { t: 'In transit', d: '11:00 AM', done: false }].map((s, i) => (
      <div key={i} className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={s.done ? { background: 'rgb(var(--uf-primary))' } : {}}>{s.done && <Check className="w-3 h-3 text-white" />}</div>
          {i < 2 && <div className="w-0.5 h-8" style={{ background: 'rgb(var(--uf-border))' }} />}
        </div>
        <div className="pb-3"><p className="text-xs font-semibold uf-text">{s.t}</p><p className="text-[10px] uf-muted">{s.d}</p></div>
      </div>
    ))}
  </div>
);

/* ───────────────── OVERLAYS ───────────────── */
const ModalZoom = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(true)} className="uf-gradient-violet text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Open Modal</motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="uf-card rounded-2xl p-5 w-full max-w-[260px] uf-shadow-lg">
              <p className="uf-text font-bold mb-2">Modal Dialog</p>
              <p className="text-xs uf-muted mb-4">This modal zooms in with a spring animation.</p>
              <button onClick={() => setOpen(false)} className="w-full text-sm font-semibold py-2 rounded-lg" style={{ background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' }}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
const SheetSlideUp = () => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(true)} className="uf-glass uf-text text-sm font-semibold px-5 py-2.5 rounded-xl">Open Sheet</motion.button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-[60]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 350, damping: 35 }} className="fixed bottom-0 left-0 right-0 uf-card rounded-t-3xl z-[61] p-5 pb-8">
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgb(var(--uf-border))' }} />
              <p className="uf-text font-bold mb-2">Bottom Sheet</p>
              <p className="text-xs uf-muted">Slides up from the bottom with spring physics.</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
const PopoverDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setOpen(!open)} className="uf-neu uf-text text-sm font-semibold px-5 py-2.5 rounded-xl">Toggle Popover</motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }} className="absolute top-full mt-2 left-0 uf-card rounded-xl p-3 uf-shadow-lg w-44 z-10">
            <p className="text-xs uf-text font-semibold mb-1">Popover Content</p>
            <p className="text-[10px] uf-muted">A floating panel anchored to the trigger.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────────── PATTERNS ───────────────── */
const GlassWallet = () => (
  <div className="uf-glass rounded-2xl p-4 w-48 uf-shadow-lg">
    <div className="flex items-center justify-between mb-3"><span className="text-[10px] uf-muted uppercase">Wallet</span><Wallet className="w-4 h-4 uf-muted" /></div>
    <p className="text-xl font-bold uf-text">AED 12,450</p>
    <p className="text-[10px] text-emerald-500 mt-0.5">+2.4% this week</p>
    <div className="flex gap-1.5 mt-3">
      <div className="flex-1 text-center py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' }}>Send</div>
      <div className="flex-1 text-center py-1.5 rounded-lg uf-neu uf-text text-[10px] font-bold">Receive</div>
    </div>
  </div>
);
const MusicPlayer = () => {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="uf-glass rounded-2xl p-4 w-48">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl uf-gradient-violet flex items-center justify-center"><Play className="w-5 h-5 text-white" /></div>
        <div className="flex-1 min-w-0"><p className="text-xs font-bold uf-text truncate">Midnight Drive</p><p className="text-[10px] uf-muted truncate">The Synthwave</p></div>
      </div>
      <div className="h-1 rounded-full mb-3" style={{ background: 'rgb(var(--uf-border))' }}><div className="h-full w-1/3 rounded-full" style={{ background: 'rgb(var(--uf-primary))' }} /></div>
      <div className="flex items-center justify-center gap-4">
        <SkipForward className="w-4 h-4 uf-muted rotate-180" />
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlaying(!playing)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgb(var(--uf-primary))' }}>
          {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </motion.button>
        <SkipForward className="w-4 h-4 uf-muted" />
      </div>
    </div>
  );
};
const WeatherCard = () => (
  <div className="uf-gradient-violet rounded-2xl p-4 w-44 text-white">
    <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold">Dubai, UAE</span><Sun className="w-5 h-5" /></div>
    <p className="text-3xl font-bold">32°</p><p className="text-[10px] opacity-90">Sunny · H:35° L:24°</p>
    <div className="flex justify-between mt-3 text-[10px]"><span className="flex items-center gap-1"><Wind className="w-3 h-3" /> 12km/h</span><span className="flex items-center gap-1"><Droplet className="w-3 h-3" /> 45%</span></div>
  </div>
);
const ChatBubble = () => (
  <div className="w-full max-w-[260px] space-y-2">
    <div className="flex justify-start"><div className="uf-card rounded-2xl rounded-bl-sm px-3 py-2 text-xs uf-text max-w-[70%]">Hey! Check out this new UI kit 👀</div></div>
    <div className="flex justify-end"><div className="rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white max-w-[70%]" style={{ background: 'rgb(var(--uf-primary))' }}>Looks amazing! 🔥</div></div>
  </div>
);
const CalendarGrid = () => {
  const [sel, setSel] = useState(15);
  return (
    <div className="w-full max-w-[260px]">
      <div className="grid grid-cols-7 gap-1 text-center mb-1">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i} className="text-[9px] uf-muted font-bold">{d}</span>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
          <motion.button key={d} whileTap={{ scale: 0.9 }} onClick={() => setSel(d)} className="aspect-square rounded-lg text-[10px] font-semibold flex items-center justify-center" style={sel === d ? { background: 'rgb(var(--uf-primary))', color: 'rgb(var(--uf-primary-fg))' } : { color: 'rgb(var(--uf-foreground))' }}>{d}</motion.button>
        ))}
      </div>
    </div>
  );
};
const ControlCenter = () => (
  <div className="uf-glass rounded-2xl p-3 w-full max-w-[260px]">
    <div className="grid grid-cols-2 gap-2">
      {[{ icon: Plane, label: 'Airplane', on: false }, { icon: Wifi, label: 'Wi-Fi', on: true }, { icon: Bluetooth, label: 'Bluetooth', on: true }, { icon: Moon, label: 'Focus', on: false }].map((c) => {
        const Icon = c.icon;
        return (
          <motion.button key={c.label} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 rounded-xl p-2.5" style={{ background: c.on ? 'rgba(var(--uf-primary),0.2)' : 'rgb(var(--uf-bg))' }}>
            <Icon className="w-4 h-4" style={{ color: c.on ? 'rgb(var(--uf-primary))' : 'rgb(var(--uf-muted))' }} />
            <span className="text-[10px] uf-text font-medium">{c.label}</span>
          </motion.button>
        );
      })}
    </div>
  </div>
);
const LiquidBlob = () => (
  <motion.div animate={{ borderRadius: ['42% 58% 63% 37% / 42% 38% 62% 58%', '58% 42% 37% 63% / 58% 62% 38% 42%', '42% 58% 63% 37% / 42% 38% 62% 58%'] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="w-20 h-20 uf-gradient-aurora" />
);
const NeumorphicDial = () => {
  const [angle, setAngle] = useState(135);
  return (
    <div className="relative w-28 h-28">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--uf-border))" strokeWidth="6" />
        <motion.circle cx="50" cy="50" r="40" fill="none" stroke="rgb(var(--uf-primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray="251" animate={{ strokeDashoffset: 251 - (251 * angle) / 360 }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="uf-text text-xl font-bold">{Math.round((angle / 360) * 100)}%</span>
        <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(+e.target.value)} className="w-20 mt-1" style={{ accentColor: 'rgb(var(--uf-primary))' }} />
      </div>
    </div>
  );
};

/* ───────────────── THEME ───────────────── */
const ColorTokens = () => (
  <div className="grid grid-cols-4 gap-2 w-full">
    {['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981', '#ef4444', '#6366f1', '#a855f7'].map((c) => (
      <div key={c} className="aspect-square rounded-xl uf-shadow-soft" style={{ background: c }} />
    ))}
  </div>
);
const TypographyDemo = () => (
  <div className="w-full text-left space-y-1">
    <p className="text-2xl font-bold uf-text">Heading</p>
    <p className="text-base font-semibold uf-text">Subheading</p>
    <p className="text-sm uf-text">Body text sample</p>
    <p className="text-xs uf-muted">Caption / muted text</p>
  </div>
);
const GlassmorphismDemo = () => (
  <div className="uf-glass rounded-2xl p-4 w-full max-w-[240px]">
    <p className="text-sm font-bold uf-text">Frosted Glass</p>
    <p className="text-[10px] uf-muted">Backdrop blur with translucent surface</p>
  </div>
);
const NeumorphismDemo = () => (
  <div className="flex gap-3">
    <div className="uf-neu w-14 h-14 rounded-2xl flex items-center justify-center"><Circle className="w-5 h-5 uf-muted" /></div>
    <div className="uf-neu-inset w-14 h-14 rounded-2xl flex items-center justify-center"><Square className="w-5 h-5 uf-muted" /></div>
  </div>
);
const ShadowGallery = () => (
  <div className="flex gap-3">
    <div className="uf-shadow-soft uf-card rounded-xl w-16 h-16" />
    <div className="uf-shadow-lg uf-card rounded-xl w-16 h-16" />
  </div>
);
const SpacingDemo = () => (
  <div className="flex items-end gap-1.5">
    {[8, 16, 24, 32, 40].map((s) => (
      <div key={s} className="rounded-sm" style={{ width: s / 3, height: s, background: 'rgb(var(--uf-primary))' }} />
    ))}
  </div>
);

/* ───────────────── LATEST (motion transitions) ───────────────── */
const ScalePop = () => {
  const [show, setShow] = useState(true);
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={() => setShow(!show)} className="text-[10px] uf-muted">Toggle</button>
      <AnimatePresence>{show && <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="uf-gradient-violet w-14 h-14 rounded-2xl" />}</AnimatePresence>
    </div>
  );
};
const CrossfadeDemo = () => {
  const [i, setI] = useState(0);
  const colors = ['#8b5cf6', '#ec4899', '#f59e0b'];
  return (
    <div className="relative w-16 h-16 cursor-pointer" onClick={() => setI((i + 1) % 3)}>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0 rounded-2xl" style={{ background: colors[i] }} />
      </AnimatePresence>
    </div>
  );
};
const ConfettiBurst = () => {
  const [burst, setBurst] = useState(0);
  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setBurst((b) => b + 1)} className="uf-gradient-aurora text-white text-sm font-semibold px-5 py-2.5 rounded-xl">Celebrate 🎉</motion.button>
      <AnimatePresence>
        {burst > 0 && (
          <div key={burst} className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return <motion.div key={i} initial={{ x: 0, y: 0, opacity: 1, scale: 1 }} animate={{ x: Math.cos(angle) * 60, y: Math.sin(angle) * 60, opacity: 0, scale: 0.3 }} transition={{ duration: 0.8 }} className="absolute w-2 h-2 rounded-sm" style={{ background: ['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'][i % 4] }} />;
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
const TiltParallax = () => (
  <motion.div whileHover={{ rotateY: 15, rotateX: -10, scale: 1.05 }} transition={{ type: 'spring', stiffness: 300 }} style={{ transformStyle: 'preserve-3d' }} className="uf-gradient-mesh rounded-2xl w-24 h-24 flex items-center justify-center">
    <Zap className="w-8 h-8 text-white" />
  </motion.div>
);
const GlowPulse = () => (
  <motion.div animate={{ boxShadow: ['0 0 10px rgba(139,92,246,0.3)', '0 0 30px rgba(139,92,246,0.7)', '0 0 10px rgba(139,92,246,0.3)'] }} transition={{ duration: 2, repeat: Infinity }} className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(var(--uf-primary))' }}>
    <Flame className="w-7 h-7 text-white" />
  </motion.div>
);
const LetterStagger = () => {
  const text = 'UIFORGE';
  return (
    <div className="flex gap-0.5">
      {text.split('').map((ch, i) => (
        <motion.span key={i} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="uf-text text-lg font-bold">{ch}</motion.span>
      ))}
    </div>
  );
};
const IrisReveal = () => {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col items-center gap-2">
      <button onClick={() => setOpen(!open)} className="text-[10px] uf-muted">Toggle</button>
      <div className="relative w-16 h-16 overflow-hidden rounded-2xl">
        <AnimatePresence>{open && <motion.div initial={{ clipPath: 'circle(0% at 50% 50%)' }} animate={{ clipPath: 'circle(75% at 50% 50%)' }} exit={{ clipPath: 'circle(0% at 50% 50%)' }} transition={{ duration: 0.4 }} className="absolute inset-0 uf-gradient-violet" />}</AnimatePresence>
      </div>
    </div>
  );
};
const Cube3D = () => (
  <motion.div animate={{ rotateY: 360, rotateX: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} style={{ transformStyle: 'preserve-3d' }} className="relative w-16 h-16">
    {[{ t: 'rotateY(0deg) translateZ(32px)', c: '#8b5cf6' }, { t: 'rotateY(90deg) translateZ(32px)', c: '#ec4899' }, { t: 'rotateY(180deg) translateZ(32px)', c: '#f59e0b' }, { t: 'rotateY(-90deg) translateZ(32px)', c: '#06b6d4' }, { t: 'rotateX(90deg) translateZ(32px)', c: '#10b981' }, { t: 'rotateX(-90deg) translateZ(32px)', c: '#ef4444' }].map((f, i) => (
      <div key={i} className="absolute w-16 h-16 rounded-lg flex items-center justify-center" style={{ transform: f.t, background: f.c, backfaceVisibility: 'hidden' }}><span className="text-white text-xs font-bold">{i + 1}</span></div>
    ))}
  </motion.div>
);

export const SHOWCASES = {
  buttons: [
    { id: 'btn-aurora', title: 'Aurora Gradient', subtitle: 'Multi-color gradient', Component: AuroraButton, code: '<button className="uf-gradient-aurora">Aurora</button>' },
    { id: 'btn-iridescent', title: 'Iridescent', subtitle: 'Shifting gradient', Component: IridescentButton, code: '<button className="uf-gradient-iridescent">Iridescent</button>' },
    { id: 'btn-neon', title: 'Neon Glow', subtitle: 'Glowing border', Component: NeonGlowButton, code: '<button className="shadow-glow">Neon</button>' },
    { id: 'btn-glass', title: 'Glass Button', subtitle: 'Frosted backdrop', Component: GlassButton, code: '<button className="uf-glass">Glass</button>' },
    { id: 'btn-neu', title: 'Neumorphic', subtitle: 'Soft 3D shadow', Component: NeumorphicButton, code: '<button className="uf-neu">Neu</button>' },
    { id: 'btn-ripple', title: 'Ripple Effect', subtitle: 'Tap ripple', Component: RippleButton, code: '<button onClick={ripple}>Ripple</button>' },
    { id: 'btn-loading', title: 'Loading Button', subtitle: 'Spinner state', Component: LoadingButton, code: '<button>Loading...</button>' },
  ],
  navigation: [
    { id: 'nav-segmented', title: 'Segmented Control', subtitle: 'Animated indicator', Component: SegmentedControl, code: '<SegmentedControl />' },
    { id: 'nav-stepper', title: 'Stepper Nav', subtitle: 'Progress steps', Component: StepperNav, code: '<StepperNav />' },
    { id: 'nav-breadcrumb', title: 'Breadcrumbs', subtitle: 'Trail navigation', Component: Breadcrumbs, code: '<Breadcrumbs />' },
    { id: 'nav-pagination', title: 'Pagination', subtitle: 'Page controls', Component: Pagination, code: '<Pagination />' },
    { id: 'nav-drawer', title: 'Drawer', subtitle: 'Slide-out menu', Component: DrawerNav, code: '<Drawer />' },
  ],
  tables: [
    { id: 'tbl-glass', title: 'Glass Data Table', subtitle: 'Frosted rows', Component: GlassTable, code: '<GlassTable />' },
    { id: 'tbl-expand', title: 'Expandable Rows', subtitle: 'Click to expand', Component: ExpandableRow, code: '<ExpandableRow />' },
    { id: 'tbl-leader', title: 'Leaderboard', subtitle: 'Ranked list', Component: Leaderboard, code: '<Leaderboard />' },
    { id: 'tbl-kpi', title: 'KPI Cards', subtitle: 'Metric tiles', Component: KPICards, code: '<KPICards />' },
    { id: 'tbl-heat', title: 'Heatmap Grid', subtitle: 'Activity map', Component: HeatmapGrid, code: '<HeatmapGrid />' },
    { id: 'tbl-crypto', title: 'Crypto Rows', subtitle: 'Token list', Component: CryptoRow, code: '<CryptoRow />' },
    { id: 'tbl-skel', title: 'Skeleton Table', subtitle: 'Loading state', Component: SkeletonTable, code: '<SkeletonTable />' },
  ],
  cards: [
    { id: 'card-flip', title: '3D Flip Card', subtitle: 'Tap to flip', Component: FlipCard3D, code: '<FlipCard3D />' },
    { id: 'card-holo', title: 'Holographic', subtitle: 'Iridescent surface', Component: HolographicCard, code: '<HolographicCard />' },
    { id: 'card-pricing', title: 'Pricing Card', subtitle: 'Plan selector', Component: PricingCard, code: '<PricingCard />' },
    { id: 'card-stats', title: 'Stats Card', subtitle: 'Mini bar chart', Component: StatsCard, code: '<StatsCard />' },
    { id: 'card-profile', title: 'Profile Card', subtitle: 'User info', Component: ProfileCard, code: '<ProfileCard />' },
  ],
  forms: [
    { id: 'frm-glass', title: 'Glass Input', subtitle: 'Frosted field', Component: GlassInput, code: '<GlassInput />' },
    { id: 'frm-neu', title: 'Neumorphic Input', subtitle: 'Inset shadow', Component: NeumorphicInput, code: '<NeumorphicInput />' },
    { id: 'frm-ios', title: 'iOS Toggle', subtitle: 'Spring switch', Component: IOSToggle, code: '<IOSToggle />' },
    { id: 'frm-slider', title: 'Neumorphic Slider', subtitle: 'Range control', Component: NeumorphicSlider, code: '<NeumorphicSlider />' },
    { id: 'frm-otp', title: 'OTP Input', subtitle: 'Code entry', Component: OTPInput, code: '<OTPInput />' },
    { id: 'frm-keypad', title: 'Neumorphic Keypad', subtitle: 'Numeric pad', Component: NeumorphicKeypad, code: '<NeumorphicKeypad />' },
    { id: 'frm-stepper', title: 'Neumorphic Stepper', subtitle: 'Counter control', Component: NeumorphicStepper, code: '<NeumorphicStepper />' },
  ],
  feedback: [
    { id: 'fb-shimmer', title: 'Shimmer Loader', subtitle: 'Skeleton sweep', Component: ShimmerLoader, code: '<ShimmerLoader />' },
    { id: 'fb-dots', title: 'Bouncing Dots', subtitle: 'Staggered bounce', Component: BouncingDots, code: '<BouncingDots />' },
    { id: 'fb-eq', title: 'Equalizer Bars', subtitle: 'Audio waveform', Component: EqualizerBars, code: '<EqualizerBars />' },
    { id: 'fb-ring', title: 'Dual Ring Spinner', subtitle: 'Dual color spin', Component: DualRingSpinner, code: '<DualRingSpinner />' },
    { id: 'fb-progress', title: 'Progress Bar', subtitle: 'Animated fill', Component: ProgressBar, code: '<ProgressBar />' },
    { id: 'fb-badge', title: 'Status Badges', subtitle: 'Color-coded pills', Component: Badge, code: '<Badge />' },
    { id: 'fb-alert', title: 'Alert Banner', subtitle: 'Notification row', Component: AlertBanner, code: '<AlertBanner />' },
  ],
  data: [
    { id: 'dat-spark', title: 'Sparkline', subtitle: 'Mini trend line', Component: Sparkline, code: '<Sparkline />' },
    { id: 'dat-donut', title: 'Donut Chart', subtitle: 'Proportion ring', Component: DonutChart, code: '<DonutChart />' },
    { id: 'dat-bar', title: 'Bar Chart', subtitle: 'Vertical bars', Component: BarChart, code: '<BarChart />' },
    { id: 'dat-line', title: 'Line Chart', subtitle: 'Gradient fill', Component: LineChart, code: '<LineChart />' },
    { id: 'dat-acc', title: 'Accordion', subtitle: 'Expandable FAQ', Component: Accordion, code: '<Accordion />' },
    { id: 'dat-tl', title: 'Timeline', subtitle: 'Status history', Component: Timeline, code: '<Timeline />' },
  ],
  overlays: [
    { id: 'ovl-modal', title: 'Modal Zoom', subtitle: 'Spring pop-in', Component: ModalZoom, code: '<ModalZoom />' },
    { id: 'ovl-sheet', title: 'Bottom Sheet', subtitle: 'Slide up panel', Component: SheetSlideUp, code: '<SheetSlideUp />' },
    { id: 'ovl-pop', title: 'Popover', subtitle: 'Floating panel', Component: PopoverDemo, code: '<PopoverDemo />' },
  ],
  patterns: [
    { id: 'pat-wallet', title: 'Glass Wallet', subtitle: 'Balance card', Component: GlassWallet, code: '<GlassWallet />' },
    { id: 'pat-music', title: 'Music Player', subtitle: 'Mini controls', Component: MusicPlayer, code: '<MusicPlayer />' },
    { id: 'pat-weather', title: 'Weather Card', subtitle: 'Forecast widget', Component: WeatherCard, code: '<WeatherCard />' },
    { id: 'pat-chat', title: 'Chat Bubbles', subtitle: 'Message UI', Component: ChatBubble, code: '<ChatBubble />' },
    { id: 'pat-cal', title: 'Calendar Grid', subtitle: 'Date picker', Component: CalendarGrid, code: '<CalendarGrid />' },
    { id: 'pat-cc', title: 'Control Center', subtitle: 'iOS toggles', Component: ControlCenter, code: '<ControlCenter />' },
    { id: 'pat-blob', title: 'Liquid Blob', subtitle: 'Morphing shape', Component: LiquidBlob, code: '<LiquidBlob />' },
    { id: 'pat-dial', title: 'Neumorphic Dial', subtitle: 'Circular gauge', Component: NeumorphicDial, code: '<NeumorphicDial />' },
  ],
  theme: [
    { id: 'thm-color', title: 'Color Tokens', subtitle: 'Palette swatches', Component: ColorTokens, code: '<ColorTokens />' },
    { id: 'thm-type', title: 'Typography', subtitle: 'Type scale', Component: TypographyDemo, code: '<TypographyDemo />' },
    { id: 'thm-glass', title: 'Glassmorphism', subtitle: 'Frosted panel', Component: GlassmorphismDemo, code: '<GlassmorphismDemo />' },
    { id: 'thm-neu', title: 'Neumorphism', subtitle: 'Soft 3D', Component: NeumorphismDemo, code: '<NeumorphismDemo />' },
    { id: 'thm-shadow', title: 'Shadows', subtitle: 'Elevation scale', Component: ShadowGallery, code: '<ShadowGallery />' },
    { id: 'thm-space', title: 'Spacing', subtitle: 'Scale bars', Component: SpacingDemo, code: '<SpacingDemo />' },
  ],
  latest: [
    { id: 'lat-scale', title: 'Scale Pop', subtitle: 'Spring scale', Component: ScalePop, code: '<ScalePop />' },
    { id: 'lat-fade', title: 'Crossfade', subtitle: 'Opacity swap', Component: CrossfadeDemo, code: '<CrossfadeDemo />' },
    { id: 'lat-conf', title: 'Confetti Burst', subtitle: 'Particle explosion', Component: ConfettiBurst, code: '<ConfettiBurst />' },
    { id: 'lat-tilt', title: 'Tilt Parallax', subtitle: '3D hover tilt', Component: TiltParallax, code: '<TiltParallax />' },
    { id: 'lat-glow', title: 'Glow Pulse', subtitle: 'Breathing light', Component: GlowPulse, code: '<GlowPulse />' },
    { id: 'lat-letter', title: 'Letter Stagger', subtitle: 'Sequential reveal', Component: LetterStagger, code: '<LetterStagger />' },
    { id: 'lat-iris', title: 'Iris Reveal', subtitle: 'Clip-path open', Component: IrisReveal, code: '<IrisReveal />' },
    { id: 'lat-cube', title: '3D Cube', subtitle: 'Rotating faces', Component: Cube3D, code: '<Cube3D />' },
  ],
};

export const ALL_COMPONENTS = Object.entries(SHOWCASES).flatMap(([cat, items]) =>
  items.map((item, idx) => ({ ...item, category: cat, globalIndex: idx + 1 }))
);