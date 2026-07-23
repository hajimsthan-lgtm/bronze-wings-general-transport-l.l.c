export default function PageHeader({ title, description, action }) {
  return (
    <div
      className="sticky top-0 z-30 mb-6 rounded-2xl px-4 py-3.5"
      style={{
        background: 'linear-gradient(180deg, rgba(20,24,38,0.92) 0%, rgba(20,24,38,0.78) 100%)',
        backdropFilter: 'blur(16px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-display font-bold text-foreground tracking-tight leading-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}