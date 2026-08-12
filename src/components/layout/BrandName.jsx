export default function BrandName({ variant = 'desktop' }) {
  const isMobile = variant === 'mobile';
  const nameSize = isMobile ? 'text-sm' : 'text-[15px]';
  const subSize = isMobile ? 'text-[8px]' : 'text-[9px]';
  const subTracking = isMobile ? 'tracking-[0.18em]' : 'tracking-[0.2em]';
  const sub = isMobile ? 'General Transport' : 'GENERAL TRANSPORT L.L.C';

  return (
    <div className="leading-tight relative">
      

      
      
    </div>);

}