import { useState, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { pad2 } from './datetimeUtils';

export default function TimeKeypad({ value, onChange, onDone }) {
  const [h, m] = value ? value.split(':').map(Number) : [0, 0];
  const [digits, setDigits] = useState('');
  const [ap, setAp] = useState(h >= 12 ? 'PM' : 'AM');

  useEffect(() => { setDigits(''); setAp(h >= 12 ? 'PM' : 'AM'); }, [value]);

  const curH12 = h % 12 === 0 ? 12 : h % 12;
  const display = digits.length === 0
    ? `${pad2(curH12)}:${pad2(m)}`
    : `${digits.slice(0, 2).padEnd(2, '_')}:${digits.slice(2, 4).padEnd(2, '_')}`;

  const commit = (entered, apVal) => {
    if (entered.length < 4) return;
    const hh = parseInt(entered.slice(0, 2), 10);
    const mm = parseInt(entered.slice(2, 4), 10);
    if (hh >= 1 && hh <= 12 && mm <= 59) {
      const h24 = apVal === 'PM' ? (hh === 12 ? 12 : hh + 12) : (hh === 12 ? 0 : hh);
      onChange(`${pad2(h24)}:${pad2(mm)}`);
    }
  };

  const press = (k) => {
    if (digits.length >= 4) return;
    const next = digits + k;
    setDigits(next);
    if (next.length === 4) commit(next, ap);
  };
  const backspace = () => setDigits((d) => d.slice(0, -1));
  const toggleAp = () => {
    const next = ap === 'PM' ? 'AM' : 'PM';
    setAp(next);
    if (digits.length >= 2) {
      const mm = digits.length >= 4 ? parseInt(digits.slice(2, 4), 10) : m;
      const hh = parseInt(digits.slice(0, 2), 10);
      if (hh >= 1 && hh <= 12 && mm <= 59) {
        const h24 = next === 'PM' ? (hh === 12 ? 12 : hh + 12) : (hh === 12 ? 0 : hh);
        onChange(`${pad2(h24)}:${pad2(mm)}`);
      }
    } else {
      const h24 = next === 'PM' ? (curH12 === 12 ? 12 : curH12 + 12) : (curH12 === 12 ? 0 : curH12);
      onChange(`${pad2(h24)}:${pad2(m)}`);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const keyBtn = 'h-10 w-14 rounded-lg bg-muted/40 border border-border text-sm font-semibold hover:bg-white/[0.06] hover:text-foreground transition-colors';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-2xl font-mono tabular-nums text-foreground tracking-wider">{display} <span className="text-primary text-sm">{ap}</span></div>
      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((k) => <button key={k} type="button" onClick={() => press(k)} className={keyBtn}>{k}</button>)}
        <button type="button" onClick={toggleAp} className={`h-10 w-14 rounded-lg border text-sm font-semibold transition-colors ${ap === 'PM' ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-muted/40 border-border hover:bg-white/[0.06]'}`}>{ap}</button>
        <button type="button" onClick={() => press('0')} className={keyBtn}>0</button>
        <button type="button" onClick={backspace} className="h-10 w-14 rounded-lg bg-muted/40 border border-border text-sm hover:bg-white/[0.06] flex items-center justify-center"><Delete className="w-4 h-4" /></button>
      </div>
    </div>
  );
}