import { Sparkles } from 'lucide-react';

export default function BrandName({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile';
  const nameSize = isMobile ? 'text-sm' : 'text-[15px]';
  const subSize = isMobile ? 'text-[8px]' : 'text-[9px]';
  const subTracking = isMobile ? 'tracking-[0.18em]' : 'tracking-[0.2em]';
  const sub = isMobile ? 'General Transport' : 'GENERAL TRANSPORT L.L.C';
  const star1 = isMobile ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const star2 = isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="leading-tight relative">
      <span className={`relative inline-block font-extrabold tracking-tight ${nameSize} brand-shine`}>
        Bronze Wings
        <Sparkles className={`absolute -top-1 -right-2.5 ${star1} text-cyan-300 animate-twinkle`} />
        <Sparkles className={`absolute top-1.5 right-0.5 ${star2} text-blue-300 animate-twinkle`} style={{ animationDelay: '0.9s' }} />
      </span>
      <span className={`block uppercase ${subTracking} text-white/40 ${subSize}`}>{sub}</span>
    </div>
  );
}