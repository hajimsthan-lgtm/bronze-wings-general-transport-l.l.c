import { useState } from 'react';
import { X, Delete } from 'lucide-react';

export default function CalculatorModal({ open, onClose }) {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(false);

  if (!open) return null;

  const inputDigit = (d) => {
    if (fresh) { setDisplay(d); setFresh(false); }
    else setDisplay(display === '0' ? d : display + d);
  };
  const inputDot = () => {
    if (fresh) { setDisplay('0.'); setFresh(false); return; }
    if (!display.includes('.')) setDisplay(display + '.');
  };
  const clear = () => { setDisplay('0'); setPrev(null); setOp(null); setFresh(false); };
  const del = () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0');

  const compute = (a, b, o) => {
    const x = parseFloat(a), y = parseFloat(b);
    switch (o) {
      case '+': return x + y;
      case '−': return x - y;
      case '×': return x * y;
      case '÷': return y === 0 ? 0 : x / y;
      case '%': return (x * y) / 100;
      default: return y;
    }
  };

  const chooseOp = (o) => {
    if (op && !fresh) {
      const r = compute(prev, display, op);
      setDisplay(String(+r.toFixed(6)));
      setPrev(String(+r.toFixed(6)));
    } else {
      setPrev(display);
    }
    setOp(o);
    setFresh(true);
  };

  const equals = () => {
    if (op === null || prev === null) return;
    const r = compute(prev, display, op);
    setDisplay(String(+r.toFixed(6)));
    setPrev(null);
    setOp(null);
    setFresh(true);
  };

  const Btn = ({ label, onClick, variant = 'num', wide = false }) => {
    const styles = {
      num: 'bg-[#232636] text-white hover:bg-[#2a2e42]',
      op: 'text-white',
      eq: 'text-white',
      fn: 'bg-[#1e2130] text-[#a0a5b8] hover:bg-[#262a3d]',
    };
    const opBg = variant === 'op' ? 'linear-gradient(135deg,#1ED760,#2563eb)' : variant === 'eq' ? 'linear-gradient(135deg,#10b981,#059669)' : null;
    return (
      <button
        onClick={onClick}
        className={`rounded-2xl h-16 text-lg font-semibold transition-all active:scale-95 flex items-center justify-center ${styles[variant]} ${wide ? 'col-span-2' : ''}`}
        style={opBg ? { background: opBg, boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' } : { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 2px 6px rgba(0,0,0,0.25)' }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-xs glass-card p-5 animate-enter-up"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: 28 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-wider text-[#6b7280] font-semibold">Calculator</span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#a0a5b8] hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-black/30 border border-white/[0.06] p-4 mb-4 text-right">
          {op && prev !== null && <div className="text-sm text-[#6b7280] font-mono tabular-nums h-5">{prev} {op}</div>}
          <div className="text-4xl font-light text-white font-mono tabular-nums truncate">{display}</div>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          <Btn label="AC" onClick={clear} variant="fn" />
          <Btn label="%" onClick={() => chooseOp('%')} variant="fn" />
          <Btn label="÷" onClick={() => chooseOp('÷')} variant="op" />
          <Btn label={<Delete className="w-5 h-5" />} onClick={del} variant="fn" />

          <Btn label="7" onClick={() => inputDigit('7')} />
          <Btn label="8" onClick={() => inputDigit('8')} />
          <Btn label="9" onClick={() => inputDigit('9')} />
          <Btn label="×" onClick={() => chooseOp('×')} variant="op" />

          <Btn label="4" onClick={() => inputDigit('4')} />
          <Btn label="5" onClick={() => inputDigit('5')} />
          <Btn label="6" onClick={() => inputDigit('6')} />
          <Btn label="−" onClick={() => chooseOp('−')} variant="op" />

          <Btn label="1" onClick={() => inputDigit('1')} />
          <Btn label="2" onClick={() => inputDigit('2')} />
          <Btn label="3" onClick={() => inputDigit('3')} />
          <Btn label="+" onClick={() => chooseOp('+')} variant="op" />

          <Btn label="0" onClick={() => inputDigit('0')} wide />
          <Btn label="." onClick={inputDot} />
          <Btn label="=" onClick={equals} variant="eq" />
        </div>
      </div>
    </div>
  );
}