/**
 * ResponsiveStats — mobile carousel + desktop grid.
 * Takes a stats array (same shape as ReportStatCard props) and renders
 * a swipeable MobileStatCarousel on mobile, a ReportStatCard grid on desktop.
 *
 * Usage: <ResponsiveStats stats={[{ label, value, icon, color, format, onClick, to }]} desktopGridClass="md:grid-cols-2 lg:grid-cols-4" className="mb-6" />
 */
import ReportStatCard from '@/components/reports/ReportStatCard';
import MobileStatCarousel from '@/components/mobile/MobileStatCarousel';

export default function ResponsiveStats({ stats = [], desktopGridClass = 'md:grid-cols-2 lg:grid-cols-4', className = '' }) {
  const mobileStats = stats.map((s) => ({
    label: s.label,
    value: s.format ? s.format(s.value) : String(s.value ?? ''),
    icon: s.icon,
    color: s.color,
    sub: s.sub,
  }));

  return (
    <>
      <MobileStatCarousel stats={mobileStats} className={className} />
      <div className={`hidden md:grid ${desktopGridClass} gap-4 ${className}`}>
        {stats.map((s, i) => (
          <ReportStatCard key={i} {...s} index={s.index ?? i} />
        ))}
      </div>
    </>
  );
}