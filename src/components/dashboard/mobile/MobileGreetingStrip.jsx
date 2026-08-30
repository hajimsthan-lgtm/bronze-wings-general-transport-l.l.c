import { useEffect, useState } from 'react';

function greeting(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function firstName(user) {
  if (!user) return '';
  const n = user.full_name || user.name || '';
  if (n) return n.split(' ')[0];
  if (user.email) return user.email.split('@')[0];
  return '';
}

export default function MobileGreetingStrip({ user }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="pt-1 flex items-end justify-between">
      <div>
        <h1 className="text-[24px] font-bold leading-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {greeting(now.getHours())}{user ? ', ' : ''}{firstName(user)}
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {dateStr} · <span className="tabular-nums">{timeStr}</span>
        </p>
      </div>
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--panel-accent-rgb),0.06))',
          border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
        }}
      >
        <span className="text-[15px]" style={{ color: 'rgb(var(--panel-accent2-rgb))' }}>🚚</span>
      </div>
    </div>
  );
}