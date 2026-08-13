import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Cloud, Sparkles, Activity, Wallet, FileWarning, TrendingUp, Truck, CalendarDays, ArrowUpRight } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { whatsappUrl } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/formatters';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { formatDate } from '@/lib/formatters';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24', gradient: 'rgba(251,191,36,0.10)' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316', gradient: 'rgba(249,115,22,0.10)' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#5eead4', gradient: 'rgba(167,139,250,0.10)' };
  return { text: 'Good Night', Icon: Moon, tone: '#4ADE80', gradient: 'rgba(110,231,183,0.10)' };
}

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0 }) {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handlePanelMove = (e) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: (e.clientX - rect.left) / rect.width * 100,
      y: (e.clientY - rect.top) / rect.height * 100
    });
  };

  const handleCardMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${(e.clientX - r.left) / r.width * 100}%`);
    e.currentTarget.style.setProperty('--my', `${(e.clientY - r.top) / r.height * 100}%`);
  };

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    import('@/api/base44Client').then(({ base44 }) =>
    base44.auth.me().then((u) => setUserName(u?.full_name || '')).catch(() => {})
    );
  }, []);

  const hour = now.getHours();
  const { text: greet, Icon: GreetIcon, tone, gradient } = getGreeting(hour);
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });

  const stats = [
  { label: 'Active Trips', value: activeTrips, hex: '#34d399', Icon: Activity, sub: 'in progress', path: '/trips' },
  { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#4ADE80', Icon: Wallet, sub: 'period total', path: '/reports/pnl' },
  { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24', Icon: FileWarning, sub: 'awaiting', path: '/reports/soa' }];


  return (
    <div ref={panelRef} onMouseMove={handlePanelMove} className="relative overflow-hidden rounded-3xl animate-fade-in-up"
    style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--panel-border-color)',
      boxShadow: 'var(--panel-inner-highlight), 0 24px 70px rgba(0,0,0,0.45)',
      backdropFilter: 'var(--panel-blur)',
      WebkitBackdropFilter: 'var(--panel-blur)'
    }}>
      {/* cursor-following spotlight */}
      <div className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500" style={{ background: `radial-gradient(500px circle at ${mouse.x}% ${mouse.y}%, rgba(var(--panel-accent-rgb),0.10), transparent 65%)` }} />
      {/* ambient mesh */}
      <div className="pointer-events-none absolute -top-24 right-0 w-72 h-72 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${gradient}, transparent 70%)` }} />

      

























































































      
    </div>);

}