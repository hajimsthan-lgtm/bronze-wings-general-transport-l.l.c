export default function GradientDivider({ className = '' }) {
  return (
    <div className={`h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent ${className}`} />
  );
}