import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Network, Clock, Bot, Mail, FileText, Zap, MessageSquare, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const ACCENT = '#3b82f6';
const ACCENT2 = '#a855f7';
const SUCCESS = '#34d399';

/* ── helpers ── */
const nextExpiry = (vehicles) => {
  const today = new Date().toISOString().split('T')[0];
  const dates = [];
  vehicles.forEach((v) => {
    if (v.registration_expiry && v.registration_expiry >= today) dates.push({ date: v.registration_expiry, label: 'Registration', plate: v.plate_number });
    if (v.insurance_expiry && v.insurance_expiry >= today) dates.push({ date: v.insurance_expiry, label: 'Insurance', plate: v.plate_number });
    if (v.next_service_date && v.next_service_date >= today) dates.push({ date: v.next_service_date, label: 'Service', plate: v.plate_number });
  });
  dates.sort((a, b) => a.date.localeCompare(b.date));
  return dates[0] || null;
};

const useCountdown = (targetDate) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!targetDate) return;
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, [targetDate]);
  return useMemo(() => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, overdue: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, overdue: false };
  }, [targetDate, tick]);
};

/* ── Radial Network Visualization ── */
function RadialNetwork({ vehicles }) {
  const nodes = useMemo(() => {
    const count = Math.min(vehicles.length || 6, 8);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const r = 70;
      return {
        id: i,
        x: 100 + Math.cos(angle) * r,
        y: 100 + Math.sin(angle) * r,
        label: vehicles[i]?.plate_number || `V${i + 1}`,
        status: vehicles[i]?.status || 'active',
      };
    });
  }, [vehicles]);

  return (
    <div className="glass-card p-5 relative overflow-hidden group" style={{ borderTop: `2px solid ${ACCENT}` }}>
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT, 0.5)} 0%, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(ACCENT, 0.14), border: `1px solid ${hexToRgba(ACCENT, 0.3)}` }}>
          <Network className="w-4.5 h-4.5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Insight Network</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Interconnected fleet intelligence</p>
        </div>
      </div>
      <div className="relative aspect-square max-w-[260px] mx-auto">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* connection lines */}
          {nodes.map((n) => (
            <line key={`l-${n.id}`} x1="100" y1="100" x2={n.x} y2={n.y} stroke={ACCENT} strokeWidth="0.5" opacity="0.3" strokeDasharray="2 2" className="animate-pulse" style={{ animationDelay: `${n.id * 0.3}s` }} />
          ))}
          {/* orbit ring */}
          <circle cx="100" cy="100" r="70" fill="none" stroke={ACCENT} strokeWidth="0.3" opacity="0.15" strokeDasharray="1 3" />
          <circle cx="100" cy="100" r="40" fill="none" stroke={ACCENT2} strokeWidth="0.3" opacity="0.15" strokeDasharray="1 3" />
          {/* satellite nodes */}
          {nodes.map((n) => {
            const color = n.status === 'active' ? SUCCESS : n.status === 'maintenance' ? '#f59e0b' : '#94a3b8';
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="6" fill={color} opacity="0.25" className="animate-ping" style={{ animationDuration: '2.5s', animationDelay: `${n.id * 0.2}s` }} />
                <circle cx={n.x} cy={n.y} r="3.5" fill={color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
              </g>
            );
          })}
          {/* central hub */}
          <circle cx="100" cy="100" r="14" fill={ACCENT} opacity="0.15" className="animate-ping" style={{ animationDuration: '2s' }} />
          <circle cx="100" cy="100" r="9" fill="none" stroke={ACCENT} strokeWidth="1.5" />
          <circle cx="100" cy="100" r="4" fill={ACCENT} />
          <text x="100" y="103" textAnchor="middle" className="fill-white" style={{ fontSize: '5px', fontWeight: 700 }}>HUB</text>
        </svg>
        {/* floating labels */}
        {nodes.slice(0, 4).map((n) => (
          <span key={`t-${n.id}`} className="absolute text-[8px] font-mono text-muted-foreground pointer-events-none" style={{ left: `${(n.x / 200) * 100}%`, top: `${(n.y / 200) * 100}%`, transform: 'translate(-50%, 12px)' }}>{n.label}</span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS }} /> Active</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} /> Maintenance</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#94a3b8' }} /> Idle</span>
      </div>
    </div>
  );
}

/* ── Countdown + Chatbot Nudge ── */
function CountdownNudge({ vehicles }) {
  const target = useMemo(() => nextExpiry(vehicles), [vehicles]);
  const cd = useCountdown(target?.date);
  const [nudgeIdx, setNudgeIdx] = useState(0);
  const nudges = [
    `⏱ ${target ? target.label + ' for ' + target.plate : 'No pending expiries'} — automate renewal now.`,
    '🤖 I can draft a reminder email to the driver in 2 seconds.',
    '⚡ Auto-schedule the next service slot based on odometer trends.',
    '📊 3 vehicles need attention this week. Want a summary?',
  ];
  useEffect(() => {
    const i = setInterval(() => setNudgeIdx((x) => (x + 1) % nudges.length), 3500);
    return () => clearInterval(i);
  }, [nudges.length]);

  return (
    <div className="glass-card p-5 relative overflow-hidden flex flex-col" style={{ borderTop: `2px solid ${ACCENT2}` }}>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT2, 0.5)} 0%, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(ACCENT2, 0.14), border: `1px solid ${hexToRgba(ACCENT2, 0.3)}` }}>
          <Clock className="w-4.5 h-4.5" style={{ color: ACCENT2 }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Automation Countdown</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Save hours with auto-renewal</p>
        </div>
      </div>

      {cd ? (
        <div className="grid grid-cols-4 gap-2 my-3">
          {[['Days', cd.d], ['Hrs', cd.h], ['Min', cd.m], ['Sec', cd.s]].map(([label, val]) => (
            <div key={label} className="rounded-xl p-2 text-center border border-white/[0.06]" style={{ background: hexToRgba(cd.overdue ? '#f43f5e' : ACCENT2, 0.08) }}>
              <p className="text-xl font-bold text-foreground tabular-nums font-mono">{String(val).padStart(2, '0')}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-4 text-center text-xs text-muted-foreground border border-white/[0.06] my-3">All clear — no upcoming expiries</div>
      )}

      {/* chatbot nudge */}
      <div className="rounded-2xl p-3 border border-white/[0.06] flex items-start gap-2.5" style={{ background: hexToRgba(ACCENT, 0.05) }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 animate-glow-pulse" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p key={nudgeIdx} className="text-xs text-foreground leading-relaxed animate-fade-in">{nudges[nudgeIdx]}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-[9px] text-muted-foreground ml-1">AI typing…</span>
          </div>
        </div>
      </div>
      <button className="mt-3 inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, boxShadow: `0 4px 14px ${hexToRgba(ACCENT, 0.4)}` }}>
        <Zap className="w-3.5 h-3.5" /> Automate Now
      </button>
    </div>
  );
}

/* ── AI Tools Tiles ── */
function AITools({ vehicles, trips }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);

  const runTool = async (tool) => {
    setBusy(tool);
    setResult(null);
    try {
      const prompt = tool === 'email'
        ? `Draft a professional fleet status email summarizing ${vehicles.length} vehicles, ${trips.length} recent trips. Highlight any vehicles in maintenance. Keep it concise, business tone.`
        : tool === 'report'
        ? `Summarize fleet performance in 3 bullet points: ${vehicles.length} vehicles, ${trips.length} trips, total revenue ${formatCurrency(trips.reduce((s, t) => s + (t.revenue || 0), 0))}.`
        : `Give 3 smart insights about this fleet: ${vehicles.length} vehicles, ${trips.length} trips. Suggest optimizations.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: { type: 'object', properties: { text: { type: 'string' } } } });
      setResult(res?.text || res);
    } catch {
      setResult('Unable to reach AI right now.');
    } finally {
      setBusy(null);
    }
  };

  const tools = [
    { id: 'email', label: 'Email Generation', desc: 'Draft fleet status emails', icon: Mail, accent: ACCENT },
    { id: 'report', label: 'Smart Report', desc: 'Auto-summarize performance', icon: FileText, accent: ACCENT2 },
    { id: 'insights', label: 'AI Insights', desc: 'Optimization suggestions', icon: TrendingUp, accent: SUCCESS },
  ];

  return (
    <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: `2px solid ${SUCCESS}` }}>
      <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full pointer-events-none opacity-15" style={{ background: `radial-gradient(circle, ${hexToRgba(SUCCESS, 0.5)} 0%, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(SUCCESS, 0.14), border: `1px solid ${hexToRgba(SUCCESS, 0.3)}` }}>
          <Sparkles className="w-4.5 h-4.5" style={{ color: SUCCESS }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">AI Tools</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">More creativity, less busywork</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {tools.map((tool) => { const I = tool.icon; return (
          <button key={tool.id} onClick={() => runTool(tool.id)} disabled={busy} className="group rounded-xl p-3 text-left border border-white/[0.06] transition-all hover:scale-[1.03] hover:border-white/20 disabled:opacity-50" style={{ background: hexToRgba(tool.accent, 0.05) }}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-110" style={{ background: hexToRgba(tool.accent, 0.16), border: `1px solid ${hexToRgba(tool.accent, 0.3)}` }}>
                <I className="w-4 h-4" style={{ color: tool.accent }} />
              </div>
              {busy === tool.id && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
            </div>
            <p className="text-xs font-semibold text-foreground">{tool.label}</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{tool.desc}</p>
          </button>
        );})}
      </div>
      {result && (
        <div className="mt-3 rounded-xl p-3 border border-white/[0.06] animate-fade-in" style={{ background: hexToRgba(ACCENT, 0.05) }}>
          <div className="flex items-center gap-1.5 mb-1.5"><Bot className="w-3.5 h-3.5 text-primary" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Response</span></div>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
        </div>
      )}
    </div>
  );
}

/* ── Integration / Activity Feed ── */
function IntegrationFeed({ trips, fuelRecords, vehicles }) {
  const events = useMemo(() => {
    const list = [];
    trips.slice(0, 4).forEach((t) => list.push({ icon: 'trip', text: `Trip ${t.trip_number || '—'} · ${t.from_location} → ${t.to_location}`, sub: t.vehicle_plate, time: t.trip_date, accent: ACCENT }));
    fuelRecords.slice(0, 3).forEach((f) => list.push({ icon: 'fuel', text: `Fuel · ${f.liters}L · ${formatCurrency(f.total_cost)}`, sub: f.vehicle_plate, time: f.date, accent: '#f59e0b' }));
    list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    return list.slice(0, 5);
  }, [trips, fuelRecords]);

  return (
    <div className="glass-card p-5 relative overflow-hidden" style={{ borderTop: `2px solid ${ACCENT}` }}>
      <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-15" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT, 0.5)} 0%, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(ACCENT, 0.14), border: `1px solid ${hexToRgba(ACCENT, 0.3)}` }}>
          <MessageSquare className="w-4.5 h-4.5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Connected Activity</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Real-time fleet events</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: SUCCESS }} /><span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: SUCCESS }} /></span>
          Live
        </span>
      </div>
      <div className="space-y-2">
        {events.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No recent activity</p>}
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-lg p-2.5 border border-white/[0.05] transition-all hover:scale-[1.01] hover:border-white/15 animate-slide-in-right" style={{ background: hexToRgba(e.accent, 0.04), animationDelay: `${i * 0.08}s` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(e.accent, 0.14), border: `1px solid ${hexToRgba(e.accent, 0.25)}` }}>
              {e.icon === 'trip' ? <Activity className="w-3.5 h-3.5" style={{ color: e.accent }} /> : <Zap className="w-3.5 h-3.5" style={{ color: e.accent }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{e.text}</p>
              <p className="text-[10px] text-muted-foreground">{e.sub} · {e.time || '—'}</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VehicleAIInsights({ vehicles, trips, fuelRecords }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center animate-glow-pulse" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`, boxShadow: `0 0 20px ${hexToRgba(ACCENT, 0.5)}` }}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground font-display">AI Command Center</h2>
          <p className="text-xs text-muted-foreground">Turn fleet insights into strategy with automation</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RadialNetwork vehicles={vehicles} />
        <CountdownNudge vehicles={vehicles} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <AITools vehicles={vehicles} trips={trips} />
        <IntegrationFeed trips={trips} fuelRecords={fuelRecords} vehicles={vehicles} />
      </div>
    </div>
  );
}