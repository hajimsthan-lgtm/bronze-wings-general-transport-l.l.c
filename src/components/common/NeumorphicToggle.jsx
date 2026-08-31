export default function NeumorphicToggle({ on = false, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-16 items-center rounded-full p-1 transition-colors shadow-[inset_2px_2px_4px_#cbd5e1,inset_-2px_-2px_4px_#fff] dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.05)] ${on ? 'bg-violet-500/20' : 'bg-slate-100 dark:bg-slate-800'} ${className}`}
    >
      <span
        className={`h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-600 shadow transition-transform duration-300 ${on ? 'translate-x-7' : 'translate-x-0'}`}
      />
    </button>
  );
}