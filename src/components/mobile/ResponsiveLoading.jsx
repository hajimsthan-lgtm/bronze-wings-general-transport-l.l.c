/**
 * ResponsiveLoading — mobile skeleton + desktop spinner.
 * Shows MobileSkeleton on mobile, LoadingSpinner on desktop.
 *
 * Usage: <ResponsiveLoading type="stat" count={4} />
 * or:    {loading ? <ResponsiveLoading type="list" count={4} /> : <Content />}
 */
import MobileSkeleton from '@/components/mobile/MobileSkeleton';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function ResponsiveLoading({ type = 'stat', count = 4, className = '' }) {
  return (
    <>
      <MobileSkeleton type={type} count={count} className={className} />
      <div className="hidden md:flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    </>
  );
}