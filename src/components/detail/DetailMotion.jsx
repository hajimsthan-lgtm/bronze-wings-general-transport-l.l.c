export default function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="skel-block h-8 w-24" />
      </div>
      <div className="rounded-2xl p-6" style={{ background: '#232636', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="space-y-2">
            <div className="skel-block h-7 w-56" />
            <div className="skel-block h-4 w-32" />
          </div>
          <div className="skel-block h-6 w-20 rounded-full" />
        </div>
        <div className="h-px w-10 bg-white/[0.06] mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skel-block h-3 w-16 mb-2" />
              <div className="skel-block h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="skel-block h-10 w-40 rounded-xl" />
        <div className="skel-block h-10 w-40 rounded-xl" />
      </div>
      <div className="skel-block h-24 w-full rounded-xl" />
      <div className="space-y-2">
        <div className="skel-block h-12 w-full rounded-xl" />
        <div className="skel-block h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}