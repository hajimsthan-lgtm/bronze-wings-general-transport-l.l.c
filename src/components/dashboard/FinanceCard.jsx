import React from 'react';

export default function FinanceCard({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <div className={`relative rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.04] to-transparent overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40 bg-white/[0.02]">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{title}</h3>
            {subtitle && (
              <p className="text-[10px] text-white/30 uppercase tracking-widest truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}