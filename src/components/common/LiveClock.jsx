import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const date = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  const sec = now.getSeconds();
  const secOffset = 2 * Math.PI * 10 * (1 - sec / 60);

  return null;































}