import { Clock, Check } from 'lucide-react';
import { usePickerStyle, setPickerStyle } from '@/lib/dateTimePickerStyle';

function WheelPreview() {
  const mkCol = (nums) => (
    <div className="flex flex-col items-center text-[9px] tabular-nums leading-[14px]">
      {nums.map((n, i) => (
        <span key={i} className={i === 2 ? 'text-primary font-bold' : 'text-muted-foreground'} style={{ opacity: i === 2 ? 1 : 0.35 + (2 - Math.abs(i - 2)) * 0.15 }}>
          {n}
        </span>
      ))}
    </div>
  );
  return (
    <div className="flex gap-0.5 items-center justify-center">
      {mkCol(['22', '23', '00', '01', '02'])}
      <span className="text-muted-foreground text-[10px]">:</span>
      {mkCol(['58', '59', '00', '01', '02'])}
    </div>
  );
}

function AnalogPreview({ variant }) {
  const isCustom = variant === 'custom';
  const hourAngle = (10 * 30 - 90) * Math.PI / 180;
  const minAngle = (10 * 6 - 90) * Math.PI / 180;
  return (
    <svg viewBox="0 0 60 60" className="w-12 h-12">
      <circle
        cx="30" cy="30" r="27"
        fill={isCustom ? 'hsl(var(--card))' : 'hsl(var(--card))'}
        stroke={isCustom ? 'rgba(var(--panel-accent-rgb),0.3)' : 'hsl(var(--border))'}
        strokeWidth="1"
      />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        return <line key={i} x1={30 + 23 * Math.cos(a)} y1={30 + 23 * Math.sin(a)} x2={30 + 27 * Math.cos(a)} y2={30 + 27 * Math.sin(a)} stroke="hsl(var(--muted-foreground))" strokeWidth="0.6" opacity="0.4" />;
      })}
      <line x1="30" y1="30" x2={30 + 16 * Math.cos(hourAngle)} y2={30 + 16 * Math.sin(hourAngle)} stroke="hsl(var(--primary))" strokeWidth={isCustom ? 1.5 : 1.2} strokeLinecap="round" filter={isCustom ? 'drop-shadow(0 0 2px hsl(var(--primary)))' : undefined} />
      <line x1="30" y1="30" x2={30 + 20 * Math.cos(minAngle)} y2={30 + 20 * Math.sin(minAngle)} stroke="hsl(var(--primary))" strokeWidth={isCustom ? 1 : 0.8} strokeLinecap="round" opacity="0.5" />
      <circle cx="30" cy="30" r="2" fill="hsl(var(--primary))" />
    </svg>
  );
}

const OPTIONS = [
  { key: 'scroll_wheel', label: 'Scroll Wheel', desc: 'iOS-style scrollable columns', preview: <WheelPreview /> },
  { key: 'analog_custom', label: 'Analog Clock (Custom)', desc: 'Premium drag-the-hand dial with glow', preview: <AnalogPreview variant="custom" /> },
  { key: 'analog_library', label: 'Analog Clock (Library)', desc: 'Clean flat clock face', preview: <AnalogPreview variant="library" /> },
];

export default function DateTimePickerStyleCard() {
  const current = usePickerStyle();
  return (
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="hud-icon-tile w-10 h-10 flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg">Date &amp; Time Picker</h3>
          <p className="text-sm text-white/50 mt-0.5">Choose how time selection appears across the app.</p>
        </div>
      </div>
      <div className="space-y-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setPickerStyle(opt.key)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${
              current === opt.key
                ? 'bg-primary/10 border-primary/40'
                : 'border-border hover:bg-white/[0.04] hover:border-white/15'
            }`}
          >
            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-lg bg-background/50 border border-border/50">
              {opt.preview}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm font-semibold ${current === opt.key ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </div>
            {current === opt.key && (
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}