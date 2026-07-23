export default function Section({ title, children }) {
  return (
    <div className="border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-white/60 uppercase tracking-wider font-medium mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}