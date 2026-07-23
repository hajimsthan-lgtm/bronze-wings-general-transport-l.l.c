import { Info } from 'lucide-react';

export default function PageInfo({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 px-3.5 py-2.5 mb-5">
      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}