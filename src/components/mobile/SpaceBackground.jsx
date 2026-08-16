import React, { useMemo } from 'react';

export default function SpaceBackground() {
  const stars = useMemo(() =>
    Array.from({ length: 35 }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 1.5 + 0.5,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    })), []);

  const shootingStars = useMemo(() =>
    Array.from({ length: 2 }, (_, i) => ({
      top: Math.random() * 35,
      left: 50 + Math.random() * 50,
      delay: i * 4 + Math.random() * 3,
    })), []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Nebula glow orbs */}
      <div className="absolute mobile-bg-orb" style={{
        top: '-10%', left: '-5%', width: '60%', height: '40%',
        background: 'radial-gradient(ellipse, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        filter: 'blur(80px)', willChange: 'transform',
        animation: 'mobile-nebula-drift 20s ease-in-out infinite',
      }} />
      <div className="absolute mobile-bg-orb" style={{
        top: '30%', right: '-10%', width: '50%', height: '35%',
        background: 'radial-gradient(ellipse, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        filter: 'blur(80px)', willChange: 'transform',
        animation: 'mobile-nebula-drift 25s ease-in-out infinite',
        animationDelay: '5s',
      }} />
      <div className="absolute mobile-bg-orb" style={{
        bottom: '-5%', left: '20%', width: '55%', height: '35%',
        background: 'radial-gradient(ellipse, rgba(34, 211, 238, 0.10) 0%, transparent 70%)',
        filter: 'blur(80px)', willChange: 'transform',
        animation: 'mobile-nebula-drift 22s ease-in-out infinite',
        animationDelay: '10s',
      }} />

      {/* Twinkling stars */}
      {stars.map((s, i) => (
        <div key={i} className="absolute mobile-bg-star rounded-full" style={{
          top: `${s.top}%`, left: `${s.left}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          background: 'rgba(255, 255, 255, 0.8)',
          willChange: 'opacity, transform',
          animation: `mobile-star-twinkle ${s.duration}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((s, i) => (
        <div key={i} className="absolute mobile-bg-shoot" style={{
          top: `${s.top}%`, left: `${s.left}%`,
          width: '80px', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
          willChange: 'transform, opacity',
          animation: 'mobile-shooting-star 8s ease-out infinite',
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
}