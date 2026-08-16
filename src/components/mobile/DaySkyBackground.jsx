import React, { useMemo } from 'react';

export default function DaySkyBackground() {
  const dustParticles = useMemo(() =>
    Array.from({ length: 18 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 6,
      duration: Math.random() * 4 + 4,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Sun-glow orb */}
      <div className="absolute mobile-bg-sun" style={{
        top: '-15%', right: '-10%', width: '70%', height: '50%',
        background: 'radial-gradient(ellipse, rgba(255, 220, 150, 0.25) 0%, rgba(255, 200, 120, 0.08) 40%, transparent 70%)',
        filter: 'blur(60px)', willChange: 'opacity, transform',
        animation: 'mobile-sun-pulse 8s ease-in-out infinite',
      }} />

      {/* Pastel cloud blobs */}
      <div className="absolute mobile-bg-cloud" style={{
        top: '10%', left: '-10%', width: '60%', height: '30%',
        background: 'radial-gradient(ellipse, rgba(255, 200, 220, 0.20) 0%, transparent 70%)',
        filter: 'blur(70px)', willChange: 'transform',
        animation: 'mobile-cloud-drift 25s ease-in-out infinite',
      }} />
      <div className="absolute mobile-bg-cloud" style={{
        top: '40%', right: '-15%', width: '55%', height: '28%',
        background: 'radial-gradient(ellipse, rgba(200, 220, 255, 0.18) 0%, transparent 70%)',
        filter: 'blur(70px)', willChange: 'transform',
        animation: 'mobile-cloud-drift 30s ease-in-out infinite',
        animationDelay: '5s',
      }} />
      <div className="absolute mobile-bg-cloud" style={{
        bottom: '0%', left: '10%', width: '50%', height: '30%',
        background: 'radial-gradient(ellipse, rgba(200, 255, 220, 0.15) 0%, transparent 70%)',
        filter: 'blur(70px)', willChange: 'transform',
        animation: 'mobile-cloud-drift 28s ease-in-out infinite',
        animationDelay: '10s',
      }} />

      {/* Dust particles */}
      {dustParticles.map((p, i) => (
        <div key={i} className="absolute mobile-bg-dust rounded-full" style={{
          top: `${p.top}%`, left: `${p.left}%`,
          width: `${p.size}px`, height: `${p.size}px`,
          background: 'rgba(255, 240, 220, 0.4)',
          willChange: 'opacity, transform',
          animation: `mobile-dust-float ${p.duration}s ease-in-out infinite`,
          animationDelay: `${p.delay}s`,
        }} />
      ))}
    </div>
  );
}