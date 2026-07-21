import { Info } from 'lucide-react';

export default function PageInfo({ text }) {
  if (!text) return null;
  return (
    <div className="flex border border-white/10 bg-white/[0.03] py-1 shadow-sm backdrop-blur-sm transition-colors focus-visible:border-primary/30 disabled:cursor-not-allowed disabled:opacity-50 w-full clay-input rounded-xl px-3 pl-9 h-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
      <div className="w-6 h-6 rounded-lg glass-panel flex items-center justify-center flex-shrink-0 mt-0.5">
        <Info className="w-3.5 h-3.5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">{text}</p>
    </div>);

}