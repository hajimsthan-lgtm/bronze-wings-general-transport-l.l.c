import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Check, Menu, List, Calculator, ChevronsUpDown } from 'lucide-react';
import AnalogClockPicker from '../AnalogClockPicker';
import TimeWheelPicker from '../TimeWheelPicker';
import TimeScrollList from './TimeScrollList';
import TimeKeypad from './TimeKeypad';
import TimeDropdowns from './TimeDropdowns';
import { pad2 } from './datetimeUtils';

const MODES = [
  { key: 'analog', label: 'Analog', Icon: Clock },
  { key: 'wheels', label: 'Wheels', Icon: Menu },
  { key: 'list', label: 'List', Icon: List },
  { key: 'keypad', label: 'Keypad', Icon: Calculator },
  { key: 'dropdowns', label: 'Dropdowns', Icon: ChevronsUpDown },
];
const STORAGE_KEY = 'bw.timepicker.mode';

function getMode() {
  try {
    const m = localStorage.getItem(STORAGE_KEY);
    if (MODES.find((x) => x.key === m)) return m;
    const legacy = localStorage.getItem('dtp-style');
    if (legacy === 'scroll_wheel') return 'wheels';
    if (legacy && legacy.startsWith('analog')) return 'analog';
  } catch {}
  return 'analog';
}
function saveMode(m) { try { localStorage.setItem(STORAGE_KEY, m); } catch {} }

export default function TimePicker({ timeStr, onTimeChange, onClose, dir }) {
  const [mode, setMode] = useState(getMode());
  const [manualTime, setManualTime] = useState('');
  const timeInputRef = useRef(null);

  const autoFormatTime = (s) => {
    const up = s.toUpperCase();
    const ap = up.match(/[AP]M/)?.[0] || '';
    const digits = up.replace(/[^0-9]/g, '').slice(0, 4);
    let out = digits.length >= 3 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    if (ap) out += ` ${ap}`;
    return out;
  };
  const commitManualTime = (override) => {
    const t = (override !== undefined ? override : manualTime).trim().toUpperCase();
    if (!t) return;
    const mt = t.match(/^(\d{1,2}):?(\d{2})\s*([AP]M)?$/);
    if (!mt) return;
    let hh = parseInt(mt[1], 10);
    const min = parseInt(mt[2], 10);
    const ap = mt[3];
    if (ap === 'PM' && hh !== 12) hh += 12;
    else if (ap === 'AM' && hh === 12) hh = 0;
    if (hh >= 0 && hh <= 23 && min >= 0 && min <= 59) {
      onTimeChange(`${pad2(hh)}:${pad2(min)}`);
      setManualTime('');
    }
  };

  const changeMode = (m) => { setMode(m); saveMode(m); };

  return (
    <div className="flex flex-col gap-2 w-full md:w-[15rem]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 flex items-center gap-1"><Clock className="w-3 h-3" /> Pick Time</span>
        <div className="flex items-center gap-0.5">
          {MODES.map(({ key, Icon, label }) => (
            <button key={key} type="button" onClick={() => changeMode(key)} title={label} className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${mode === key ? 'bg-primary/20 border border-primary/40 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] border border-transparent'}`}>
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-7 text-[11px] text-primary gap-1 ml-1"><Check className="w-3.5 h-3.5" /> Done</Button>
        </div>
      </div>
      <div className="min-h-[190px] flex items-center justify-center">
        {mode === 'analog' && <AnalogClockPicker value={timeStr} onChange={onTimeChange} onDone={onClose} variant="custom" />}
        {mode === 'wheels' && <TimeWheelPicker value={timeStr} onChange={onTimeChange} onDone={onClose} />}
        {mode === 'list' && <TimeScrollList value={timeStr} onChange={onTimeChange} onDone={onClose} />}
        {mode === 'keypad' && <TimeKeypad value={timeStr} onChange={onTimeChange} onDone={onClose} />}
        {mode === 'dropdowns' && <TimeDropdowns value={timeStr} onChange={onTimeChange} onDone={onClose} />}
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
        <Input ref={timeInputRef} type="text" value={manualTime} onChange={(e) => { const v = autoFormatTime(e.target.value); setManualTime(v); if (/^\d{2}:\d{2}([AP]M)?$/.test(v)) commitManualTime(v); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitManualTime(); } }} placeholder="Type HH:MM AM/PM" className="h-8 text-sm tabular-nums font-mono" />
        <Button type="button" size="sm" onClick={commitManualTime} className="h-8 px-3">Go</Button>
      </div>
    </div>
  );
}