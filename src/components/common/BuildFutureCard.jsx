export default function BuildFutureCard({ className = '', onGetStarted }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-6 text-white ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,27,75,0.88) 100%)',
        border: '1px solid rgba(139,92,246,0.25)',
        boxShadow: '0 8px 32px -8px rgba(139,92,246,0.35)',
      }}
    >
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-violet-500/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-fuchsia-500/40 blur-3xl pointer-events-none" />
      <div className="relative">
        <h2 className="text-2xl font-bold">Build the future</h2>
        <p className="text-sm text-white/70 mt-1">Ship faster with premium UI.</p>
        <button
          onClick={onGetStarted}
          className="mt-3 px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-medium hover:scale-105 active:scale-95 transition-transform"
        >
          Get started
        </button>
      </div>
    </div>
  );
}