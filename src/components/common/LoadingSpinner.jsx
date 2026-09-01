import LoadingSkeleton from '@/components/common/LoadingSkeleton';

/**
 * LoadingSpinner — now renders a shimmer skeleton grid by default so every
 * page that used the round spinner gets instant layout-aware skeleton
 * loading. Pass `variant="spinner"` for the legacy centered spinner (e.g.
 * inside small inline contexts), and `rows` to size the skeleton grid.
 */
export default function LoadingSpinner({ variant = 'skeleton', size = 'md', rows = 6, className = '' }) {
  if (variant === 'spinner') {
    const dim = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-12 w-12' }[size] || 'h-10 w-10';
    const border = { sm: 'border-2', md: 'border-4', lg: 'border-4' }[size] || 'border-4';
    return (
      <div className={`flex items-center justify-center py-10 px-4 w-full ${className}`}>
        <div className={`${dim} ${border} border-transparent border-t-violet-500 border-r-fuchsia-500 rounded-full animate-spin`} />
      </div>
    );
  }
  return <LoadingSkeleton rows={rows} className={className} />;
}