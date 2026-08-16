import React from 'react';

export default function PremiumCard({ children, className = '', style = {}, hover = true, padding = 'p-6' }) {
  return (
    <div
      className={`rounded-[20px] ${padding} ${hover ? 'transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-0.5' : ''} ${className}`}
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.86) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        ...style
      }}
    >
      {children}
    </div>
  );
}