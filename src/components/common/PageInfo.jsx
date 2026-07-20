import { Info } from 'lucide-react';

export default function PageInfo({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2.5 glass-card p-3 mb-4">
      <div className="w-6 h-6 rounded-lg glass-panel flex items-center justify-center flex-shrink-0 mt-0.5">
        <Info className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{text}</p>
    </div>
  );
}