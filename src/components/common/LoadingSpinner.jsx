import LoadingSkeleton from '@/components/common/LoadingSkeleton';

/**
 * LoadingSpinner — renders a shimmer skeleton by default so every page gets
 * instant layout-aware loading. Pass `layout` ('grid' | 'list' | 'stats') to
 * match the real content shape, `variant="spinner"` for the legacy centered
 * spinner (small inline contexts), and `rows` to size the skeleton grid.
 */
export default function LoadingSpinner({ variant = 'skeleton', size = 'md', rows = 6, layout = 'grid', className = '' }) {
  if (variant === 'spinner') {
    const dim = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-12 w-12' }[size] || 'h-10 w-10';
    const border = { sm: 'border-2', md: 'border-4', lg: 'border-4' }[size] || 'border-4';
    return (
      <div className={`flex items-center justify-center py-10 px-4 w-full ${className}`}>
        <div className={`${dim} ${border} border-transparent border-t-violet-500 border-r-fuchsia-500 rounded-full animate-spin`} />
      </div>
    );
  }
  return <LoadingSkeleton rows={rows} layout={layout} className={className} />;
}