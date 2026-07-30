import { Phone, MapPin, Calculator as CalcIcon, Calendar, HardDrive, StickyNote, Languages, MessageCircle, LayoutDashboard, Route, Receipt, TrendingUp, FileText, Truck, Users, Building2, FolderOpen, Bot } from 'lucide-react';

/* Real brand glyphs (inline SVG, brand colors) */
export const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const GmailIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#4caf50" d="M45 16v20c0 1.7-1.3 3-3 3h-5V21.5L24 30 11 21.5V39H6c-1.7 0-3-1.3-3-3V16c0-3.5 4-5.5 7-3.5l14 10.5L38 12.5c3-2 7 .5 7 3.5z" />
    <path fill="#fbc02d" d="M11 21.5V39H6c-1.7 0-3-1.3-3-3V16c0-3.5 4-5.5 7-3.5l1 .75z" />
    <path fill="#4285f4" d="M37 21.5V39h5c1.7 0 3-1.3 3-3V16c0-3.5-4-5.5-7-3.5l-1 .75z" />
    <path fill="#ea4335" d="M11 39V21.5L24 30l13-8.5V39H11z" />
  </svg>
);

/* Shared app registry — action values: 'calc' opens the calculator modal,
   everything else is a direct function. Used by the top header + horizontal fan. */
export const QUICK_APPS = [
  { key: 'whatsapp', label: 'WhatsApp', hex: '#25D366', icon: WhatsAppIcon, action: () => window.open('https://wa.me/', '_blank') },
  { key: 'gmail', label: 'Gmail', hex: '#EA4335', icon: GmailIcon, action: () => { window.location.href = 'mailto:?subject=Transport%20Update'; } },
  { key: 'call', label: 'Call', hex: '#10b981', icon: Phone, action: () => { window.location.href = 'tel:'; } },
  { key: 'maps', label: 'Maps', hex: '#3b82f6', icon: MapPin, action: () => window.open('https://maps.google.com', '_blank') },
  { key: 'calc', label: 'Calculator', hex: '#64748b', icon: CalcIcon, action: 'calc' },
  { key: 'message', label: 'Message', hex: '#0088cc', icon: MessageCircle, action: () => window.open('https://web.telegram.org', '_blank') },
  { key: 'calendar', label: 'Calendar', hex: '#4285f4', icon: Calendar, action: () => window.open('https://calendar.google.com', '_blank') },
  { key: 'drive', label: 'Drive', hex: '#0f9d58', icon: HardDrive, action: () => window.open('https://drive.google.com', '_blank') },
  { key: 'notes', label: 'Notes', hex: '#f59e0b', icon: StickyNote, action: () => window.open('https://keep.google.com', '_blank') },
  { key: 'translate', label: 'Translate', hex: '#8b5cf6', icon: Languages, action: () => window.open('https://translate.google.com', '_blank') },
];

/* In-app module shortcuts — rendered as the vertical fan column. */
export const QUICK_APPS_NAV = [
  { key: 'nav-dashboard', label: 'Dashboard', hex: '#6366f1', icon: LayoutDashboard, to: '/' },
  { key: 'nav-trips', label: 'Trips', hex: '#3b82f6', icon: Route, to: '/trips' },
  { key: 'nav-expenses', label: 'Expenses', hex: '#f59e0b', icon: Receipt, to: '/expenses' },
  { key: 'nav-pnl', label: 'P&L', hex: '#8b5cf6', icon: TrendingUp, to: '/reports/pnl' },
  { key: 'nav-soa', label: 'SOA', hex: '#f97316', icon: FileText, to: '/reports/soa' },
  { key: 'nav-vehicles', label: 'Vehicles', hex: '#6366f1', icon: Truck, to: '/admin/vehicles' },
  { key: 'nav-drivers', label: 'Drivers', hex: '#10b981', icon: Users, to: '/admin/drivers' },
  { key: 'nav-clients', label: 'Clients', hex: '#f43f5e', icon: Building2, to: '/admin/clients' },
  { key: 'nav-documents', label: 'Documents', hex: '#06b6d4', icon: FolderOpen, to: '/admin/documents' },
  { key: 'nav-agents', label: 'AI Agents', hex: '#22c55e', icon: Bot, to: '/agents' },
];