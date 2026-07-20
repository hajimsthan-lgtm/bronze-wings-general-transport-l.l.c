import React from "react";
import { cn } from "@/lib/utils";

export default function GlassSummaryCard({ title, value, subtitle, icon: Icon, accent = 'cyan', onClick }) {
  const accents = {
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-300/20 shadow-cyan-400/20',
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-300/20 shadow-emerald-400/20',
    red: 'text-red-300 bg-red-400/10 border-red-300/20 shadow-red-400/20',
    amber: 'text-amber-300 bg-amber-400/10 border-amber-300/20 shadow-amber-400/20',
    blue: 'text-blue-300 bg-blue-400/10 border-blue-300/20 shadow-blue-400/20',
  };
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'relative w-full overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#111827]/70 p-5 text-left backdrop-blur-2xl shadow-[0_18px_45px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]',
        onClick && 'transition hover:-translate-y-0.5 hover:border-cyan-300/30 focus:outline-none focus:ring-2 focus:ring-cyan-300/40'
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.13),transparent_36%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF]">{title}</p>
          <p className="mt-3 text-2xl font-extrabold leading-tight text-white">{value}</p>
          {subtitle && <p className="mt-2 text-xs text-[#9CA3AF]">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-lg', accents[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Tag>
  );
}