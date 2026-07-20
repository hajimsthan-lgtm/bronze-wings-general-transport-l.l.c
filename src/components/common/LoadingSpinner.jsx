export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-[3px]',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className={`${sizes[size]} border-white/10 border-t-primary rounded-full animate-spin`} />
    </div>
  );
}