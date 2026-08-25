export default function ThemeScreen() {
  const tokens = [
    { label: 'Background', var: '--uf-bg', raw: 'rgb(var(--uf-bg))' },
    { label: 'Card', var: '--uf-card', raw: 'rgb(var(--uf-card))' },
    { label: 'Foreground', var: '--uf-foreground', raw: 'rgb(var(--uf-foreground))' },
    { label: 'Muted', var: '--uf-muted', raw: 'rgb(var(--uf-muted))' },
    { label: 'Border', var: '--uf-border', raw: 'rgb(var(--uf-border))' },
    { label: 'Primary', var: '--uf-primary', raw: 'rgb(var(--uf-primary))' },
    { label: 'Accent', var: '--uf-accent', raw: 'rgb(var(--uf-accent))' },
  ];
  const typeScale = [
    { label: 'Display', cls: 'text-2xl font-bold' },
    { label: 'Heading', cls: 'text-lg font-bold' },
    { label: 'Subheading', cls: 'text-sm font-semibold' },
    { label: 'Body', cls: 'text-sm' },
    { label: 'Caption', cls: 'text-xs' },
  ];
  const shadows = [
    { label: 'Soft', cls: 'uf-shadow-soft' },
    { label: 'Large', cls: 'uf-shadow-lg' },
    { label: 'Neumorphic', cls: 'uf-neu' },
    { label: 'Inset', cls: 'uf-neu-inset' },
  ];
  const spacing = [4, 8, 12, 16, 20, 24, 32, 40];

  return (
    <div className="min-h-full pb-4 px-4 pt-5">
      <p className="text-lg font-bold uf-text mb-4">Theme</p>

      {/* Colors */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Colors</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        {tokens.map((t) => (
          <div key={t.label} className="uf-card rounded-xl p-2.5 flex items-center gap-2.5" style={{ border: '1px solid rgb(var(--uf-border))' }}>
            <div className="w-8 h-8 rounded-lg uf-shadow-soft" style={{ background: t.raw }} />
            <div><p className="text-[11px] font-semibold uf-text">{t.label}</p><p className="text-[9px] uf-muted">{t.var}</p></div>
          </div>
        ))}
      </div>

      {/* Typography */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Typography</p>
      <div className="uf-card rounded-xl p-3.5 mb-5 space-y-2" style={{ border: '1px solid rgb(var(--uf-border))' }}>
        {typeScale.map((t) => (
          <div key={t.label} className="flex items-center justify-between">
            <span className={`${t.cls} uf-text`}>The quick brown fox</span>
            <span className="text-[9px] uf-muted">{t.label}</span>
          </div>
        ))}
      </div>

      {/* Glassmorphism */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Glassmorphism</p>
      <div className="uf-glass rounded-2xl p-4 mb-5">
        <p className="text-sm font-bold uf-text">Frosted Glass Panel</p>
        <p className="text-[10px] uf-muted">Backdrop blur · translucent border</p>
      </div>

      {/* Neumorphism */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Neumorphism</p>
      <div className="flex gap-3 mb-5">
        <div className="uf-neu w-16 h-16 rounded-2xl flex items-center justify-center"><span className="text-xs uf-muted">Raised</span></div>
        <div className="uf-neu-inset w-16 h-16 rounded-2xl flex items-center justify-center"><span className="text-xs uf-muted">Inset</span></div>
      </div>

      {/* Shadows */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Shadows</p>
      <div className="flex gap-3 mb-5">
        {shadows.map((s) => (
          <div key={s.label} className="text-center">
            <div className={`${s.cls} uf-card w-14 h-14 rounded-xl mb-1`} />
            <span className="text-[9px] uf-muted">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Spacing */}
      <p className="text-xs font-bold uf-muted uppercase tracking-wider mb-2">Spacing</p>
      <div className="uf-card rounded-xl p-4 flex items-end gap-2" style={{ border: '1px solid rgb(var(--uf-border))' }}>
        {spacing.map((s) => (
          <div key={s} className="text-center">
            <div className="rounded-sm" style={{ width: s / 2, height: s, background: 'rgb(var(--uf-primary))' }} />
            <span className="text-[8px] uf-muted block mt-1">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}