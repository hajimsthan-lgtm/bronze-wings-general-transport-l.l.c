export default function LoadingSpinner({ size = 'md', className = '', color = 'blue' }) {
  const dim = { sm: 'w-5 h-5', md: 'w-6 h-6', lg: 'w-7 h-7' }[size] || 'w-6 h-6';
  return (
    <div className={`flex items-center justify-center py-10 px-4 w-full ${className}`}>
      <div className={`${dim} border-2 border-muted border-t-primary rounded-full animate-spin`} />
    </div>
  );
}