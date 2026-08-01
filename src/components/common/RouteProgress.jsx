import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Thin top progress bar on route change — perceived performance, no full-screen loader.
export default function RouteProgress() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(8);
    const t1 = setTimeout(() => setProgress(35), 80);
    const t2 = setTimeout(() => setProgress(65), 200);
    const t3 = setTimeout(() => setProgress(90), 400);
    const t4 = setTimeout(() => setProgress(100), 600);
    const t5 = setTimeout(() => setVisible(false), 850);
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [location.pathname]);

  if (!visible) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none">
      <div
        className="h-full transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))',
          boxShadow: '0 0 8px rgba(var(--panel-accent-rgb),0.6)',
        }}
      />
    </div>
  );
}