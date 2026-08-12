import { useState } from 'react';
import { Boxes, Heart, Zap, Rocket, Check } from 'lucide-react';

const PLATFORMS = [
  { id: 'base44',  name: 'Base44',   badge: 'BaaS',     description: 'AI-native backend-as-a-service with instant entities & auth.', accent: 'blue',    rgb: '30,215,96',  icon: Boxes },
  { id: 'lovable', name: 'Lovable',  badge: 'AI Dev',   description: 'Conversational full-stack app builder for rapid prototypes.',   accent: 'rose',    rgb: '244,63,94',   icon: Heart },
  { id: 'bolt',    name: 'Bolt.new', badge: 'AI IDE',   description: 'In-browser AI IDE for shipping web apps at speed.',            accent: 'cyan',    rgb: '34,211,238',  icon: Zap },
  { id: 'emergent',name: 'Emergent', badge: 'Agent OS', description: 'Agent orchestration platform for autonomous workflows.',      accent: 'emerald', rgb: '16,185,129',  icon: Rocket },
];

// Literal class strings (Tailwind must see them to keep them)
const ACCENT_CLASSES = {
  blue:    { active: 'border-blue-500/50 bg-blue-500/10',       icon: 'text-blue-400',    name: 'text-blue-300' },
  rose:    { active: 'border-rose-500/50 bg-rose-500/10',       icon: 'text-rose-400',    name: 'text-rose-300' },
  cyan:    { active: 'border-cyan-500/50 bg-cyan-500/10',       icon: 'text-cyan-400',    name: 'text-cyan-300' },
  emerald: { active: 'border-emerald-500/50 bg-emerald-500/10', icon: 'text-emerald-400', name: 'text-emerald-300' },
};

const CLAY_SHADOW =
  '0 10px 25px -5px rgba(0,0,0,0.6), inset 1px 1px 1px rgba(255,255,255,0.10), inset -2px -2px 4px rgba(0,0,0,0.5)';

/**
 * TargetPlatformSelector — claymorphic dark-mode grid of selectable platforms.
 * @param {string}   value    - controlled selected id (optional)
 * @param {(id:string)=>void} onChange - selection callback
 */
export default function TargetPlatformSelector({ value, onChange }) {
  const [selected, setSelected] = useState(value || 'base44');

  const handleSelect = (id) => {
    setSelected(id);
    onChange?.(id);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {PLATFORMS.map((p) => {
        const active = selected === p.id;
        const a = ACCENT_CLASSES[p.accent];

        return (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSelect(p.id)}
            aria-pressed={active}
            className={`group relative w-full rounded-2xl p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0E14] ${
              active
                ? `${a.active} -translate-y-0.5`
                : 'border border-white/10 bg-[#131720] hover:-translate-y-0.5 hover:border-white/20'
            }`}
            style={{
              boxShadow: active
                ? `${CLAY_SHADOW}, 0 0 20px rgba(${p.rgb},0.25)`
                : CLAY_SHADOW,
            }}
          >
            {/* Icon badge + active check */}
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{
                  background: active ? `rgba(${p.rgb},0.15)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `rgba(${p.rgb},0.35)` : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <p.icon className={`w-4 h-4 ${active ? a.icon : 'text-white/60'}`} />
              </div>
              {active && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `rgba(${p.rgb},0.20)`, border: `1px solid rgba(${p.rgb},0.45)` }}
                >
                  <Check className={`w-3 h-3 ${a.name}`} />
                </span>
              )}
            </div>

            {/* Title + badge */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-sm font-semibold tracking-tight ${active ? a.name : 'text-white/80'}`}>
                {p.name}
              </span>
              <span
                className="text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-md"
                style={{
                  background: active ? `rgba(${p.rgb},0.12)` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? `rgba(${p.rgb},0.30)` : 'rgba(255,255,255,0.08)'}`,
                  color: active ? `rgb(${p.rgb})` : 'rgba(255,255,255,0.45)',
                }}
              >
                {p.badge}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-white/50">{p.description}</p>
          </button>
        );
      })}
    </div>
  );
}