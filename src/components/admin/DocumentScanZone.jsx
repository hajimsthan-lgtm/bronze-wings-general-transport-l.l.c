import { useState, useRef, useCallback } from 'react';
import { UploadCloud, ScanLine, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Generic document scan zone — uploads a file and runs an AI extraction
 * function (extractFn) to pull structured fields. Used by Vehicle, Driver,
 * and Client scan-based forms. Falls back to manual entry if scan fails.
 *
 * Props:
 *  - extractFn: async (file) => { file_url, data }
 *  - onExtracted: (data, file_url) => void
 *  - title: string (e.g. "Scan UAE Vehicle License")
 *  - description: string
 *  - disabled: boolean
 */
export default function DocumentScanZone({ extractFn, onExtracted, title = 'Scan Document', description = 'Drag & drop a PDF or image, or browse. AI extracts all fields — review before saving.', disabled }) {
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const progressTimer = useRef(null);

  const startProgressSim = () => {
    setProgress(0);
    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 8 : p));
    }, 400);
  };

  const stopProgressSim = (final = 100) => {
    clearInterval(progressTimer.current);
    setProgress(final);
  };

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError('');
    setDone(false);
    setScanning(true);
    startProgressSim();
    try {
      const { file_url, data } = await extractFn(file);
      stopProgressSim(100);
      setDone(true);
      onExtracted?.(data, file_url);
      setTimeout(() => { setScanning(false); setDone(false); setProgress(0); }, 1800);
    } catch (e) {
      stopProgressSim(0);
      setError(e?.message || 'Extraction failed. Try manual entry.');
      setScanning(false);
    }
  }, [extractFn, onExtracted]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || scanning) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [disabled, scanning, handleFile]);

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !scanning) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${dragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/15 bg-white/[0.02]'}
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={onPick} />

      {scanning && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-md px-6 text-center">
          <div className="relative w-14 h-14">
            <Loader2 className="w-14 h-14 text-primary animate-spin" />
            <ScanLine className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
          </div>
          <div className="w-full max-w-[220px]">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <p className="text-xs font-medium text-muted-foreground">Scanning document… extracting fields</p>
        </div>
      )}

      {done && !scanning && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-md">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          <p className="text-xs font-medium text-emerald-400">Fields extracted — review below</p>
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-2 px-6 py-7 text-center">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <UploadCloud className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">{description}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || scanning}
          className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 transition disabled:opacity-50"
        >
          <ScanLine className="w-3.5 h-3.5" /> Browse file
        </button>
        {error && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
            <button onClick={() => setError('')} className="ml-1"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>
    </div>
  );
}