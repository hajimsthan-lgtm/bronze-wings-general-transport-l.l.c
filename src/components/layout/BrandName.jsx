export default function BrandName({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile';
  const nameSize = isMobile ? 'text-sm' : 'text-[15px]';
  const subSize = isMobile ? 'text-[8px]' : 'text-[9px]';
  const subTracking = isMobile ? 'tracking-[0.18em]' : 'tracking-[0.2em]';
  const sub = isMobile ? 'General Transport' : 'GENERAL TRANSPORT L.L.C';

  return (
    <div className="leading-tight relative">
      <span className={`relative inline-block font-extrabold tracking-tight hidden ${nameSize} brand-shine`}>
        Bronze Wings
      </span>
      <span className={`block uppercase hidden ${subTracking} text-white/40 ${subSize}`}>{sub}</span>
    </div>);

}