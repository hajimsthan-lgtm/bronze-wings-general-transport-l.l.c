import { pad2 } from './datetimeUtils';

export default function TimeDropdowns({ value, onChange }) {
  const [h, m] = value ? value.split(':').map(Number) : [0, 0];
  const isPM = h >= 12;
  const h12 = h % 12 === 0 ? 12 : h % 12;

  const setHour = (nh12) => {
    const h24 = isPM ? (nh12 === 12 ? 12 : nh12 + 12) : (nh12 === 12 ? 0 : nh12);
    onChange(`${pad2(h24)}:${pad2(m)}`);
  };
  const setMin = (nm) => onChange(`${pad2(h)}:${pad2(nm)}`);
  const setAp = (ap) => {
    const nh24 = ap === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    onChange(`${pad2(nh24)}:${pad2(m)}`);
  };

  const sel = 'h-9 rounded-lg bg-muted/40 border border-border text-sm px-2 text-foreground focus-visible:outline-none focus-visible:border-primary/40 cursor-pointer';

  return (
    <div className="flex items-center justify-center gap-2">
      <select value={h12} onChange={(e) => setHour(parseInt(e.target.value, 10))} className={sel} aria-label="Hour">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{pad2(n)}</option>)}
      </select>
      <span className="text-muted-foreground">:</span>
      <select value={m} onChange={(e) => setMin(parseInt(e.target.value, 10))} className={sel} aria-label="Minute">
        {Array.from({ length: 60 }, (_, i) => i).map((n) => <option key={n} value={n}>{pad2(n)}</option>)}
      </select>
      <select value={isPM ? 'PM' : 'AM'} onChange={(e) => setAp(e.target.value)} className={sel} aria-label="AM/PM">
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}