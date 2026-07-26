import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, X, ImagePlus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function ImageUpload({ value, onChange, label = 'Photo', shape = 'square' }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const round = shape === 'circle';

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch {} finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center gap-3">
        <div className={`relative ${round ? 'w-16 h-16 rounded-full' : 'w-20 h-20 rounded-xl'} overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center flex-shrink-0`}>
          {value
            ? <img src={value} alt="" className="w-full h-full object-cover" />
            : <ImagePlus className="w-5 h-5 text-muted-foreground/50" />}
        </div>
        <div className="flex items-center gap-2">
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handle} />
          <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={uploading} className="border-border">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> {uploading ? t('loading') : 'Upload'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-muted-foreground hover:text-red-400">
              <X className="w-3.5 h-3.5 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}