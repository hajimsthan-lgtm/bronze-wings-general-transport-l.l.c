import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, ImagePlus, Upload } from 'lucide-react';

/**
 * Vehicle ownership card — front/back attachable (JPG/PNG only), flip to view either side.
 * Sized to an ownership-card aspect ratio.
 */
export default function OwnershipCard({ front, back, onChange }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [side, setSide] = useState('front');
  const [uploading, setUploading] = useState(false);

  const hasAny = !!(front || back);
  const current = side === 'front' ? front : back;

  const doUpload = async (file, which) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('Only JPG or PNG images are allowed');
      return;
    }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const next = { front, back, [which]: file_url };
      onChange?.(next.front, next.back);
    } catch {} finally { setUploading(false); }
  };

  return (
    <div className="relative mt-3 w-full" style={{ aspectRatio: '1.585 / 1' }}>
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-white/10 bg-muted/30 flex items-center justify-center">
        {current ? (
          <img src={current} alt={`ownership ${side}`} className="absolute inset-0 w-full h-full object-cover" />
        ) : !hasAny ? (
          <div className="flex flex-col items-center justify-center text-center px-3 gap-2">
            <ImagePlus className="w-7 h-7 text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground">No ownership card attached</p>
            <div className="flex gap-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); frontRef.current?.click(); }} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-colors">
                <Upload className="w-3 h-3" /> Front
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); backRef.current?.click(); }} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-primary hover:bg-white/10 transition-colors">
                <Upload className="w-3 h-3" /> Back
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-3">
            <ImagePlus className="w-6 h-6 text-muted-foreground/50 mb-1" />
            <p className="text-[10px] text-muted-foreground">No {side} attached</p>
            <button type="button" onClick={(e) => { e.stopPropagation(); (side === 'front' ? frontRef : backRef).current?.click(); }} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
              <Upload className="w-3 h-3" /> Attach {side} (JPG/PNG)
            </button>
          </div>
        )}

        {/* Flip toggle */}
        {hasAny && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setSide((s) => (s === 'front' ? 'back' : 'front')); }}
            title="Flip side"
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/55 backdrop-blur text-white flex items-center justify-center hover:bg-black/75 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Side indicator */}
        {hasAny && (
          <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/55 text-white backdrop-blur">
            {side}
          </span>
        )}

        {/* Replace current side */}
        {hasAny && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); (side === 'front' ? frontRef : backRef).current?.click(); }}
            className="absolute bottom-1.5 right-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/55 text-white backdrop-blur hover:bg-black/75 transition-colors"
          >
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
        )}

        <input ref={frontRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => doUpload(e.target.files?.[0], 'front')} />
        <input ref={backRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => doUpload(e.target.files?.[0], 'back')} />
      </div>
    </div>
  );
}