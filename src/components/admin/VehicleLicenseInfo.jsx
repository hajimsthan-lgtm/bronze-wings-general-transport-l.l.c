import { FileText, User, ShieldCheck, Car, Hash } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

/**
 * Parses the vehicle `notes` field (a "Label: value" text block generated
 * from the AI license scan) into a structured key→value object.
 */
export function parseLicenseNotes(notes = '') {
  const map = {};
  notes.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) map[key] = val;
  });
  return map;
}

export const LICENSE_SECTIONS = [
  {
    id: 'registration', icon: FileText, title: 'Registration', accent: '#0ea5e9',
    fields: [
      { key: 'Place of Issue', label: 'Place of Issue' },
      { key: 'TC No', label: 'TC No' },
      { key: 'Plate Category', label: 'Plate Category' },
      { key: 'Reg Date', label: 'Reg Date' },
    ],
  },
  {
    id: 'ownership', icon: User, title: 'Ownership', accent: '#8b5cf6',
    fields: [
      { key: 'Owner', label: 'Owner (English)' },
      { key: 'Owner (AR)', label: 'Owner (Arabic)', rtl: true },
      { key: 'Nationality', label: 'Nationality' },
    ],
  },
  {
    id: 'insurance', icon: ShieldCheck, title: 'Insurance', accent: '#22c55e',
    fields: [
      { key: 'Insurer', label: 'Insurer' },
      { key: 'Policy No', label: 'Policy No' },
      { key: 'Insurance Type', label: 'Insurance Type' },
      { key: 'Mortgage By', label: 'Mortgage By' },
    ],
  },
  {
    id: 'specs', icon: Car, title: 'Vehicle Specs', accent: '#f59e0b',
    fields: [
      { key: 'Vehicle Category', label: 'Category' },
      { key: 'Vehicle Type', label: 'Type' },
      { key: 'Color', label: 'Color' },
      { key: 'Origin', label: 'Origin' },
      { key: 'GVW', label: 'GVW' },
      { key: 'Empty Weight', label: 'Empty Weight' },
      { key: 'Passengers', label: 'Passengers' },
    ],
  },
  {
    id: 'ids', icon: Hash, title: 'Identification Numbers', accent: '#ec4899',
    fields: [
      { key: 'Engine No', label: 'Engine No' },
      { key: 'Chassis No', label: 'Chassis No' },
    ],
  },
];

const ARABIC_RE = /[\u0600-\u06FF]/;

function FieldCell({ label, value, rtl }) {
  const isArabic = rtl || (value && ARABIC_RE.test(value));
  return (
    <div className="rounded-lg p-2.5 border border-white/[0.06]" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      {isArabic ? (
        <p dir="rtl" className="text-sm font-semibold text-foreground leading-snug text-right break-words">{value || '—'}</p>
      ) : (
        <p className="text-sm font-semibold text-foreground leading-snug break-words">{value || '—'}</p>
      )}
    </div>
  );
}

function SectionBlock({ icon: Icon, title, accent, fields, data }) {
  const visible = fields.filter((f) => data[f.key]);
  if (visible.length === 0) return null;
  return (
    <div className="trip-section" style={{ '--section-accent': accent }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="trip-section-icon"><Icon className="w-4 h-4" /></div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {visible.map((f) => (
          <FieldCell key={f.key} label={f.label} value={data[f.key]} rtl={f.rtl} />
        ))}
      </div>
    </div>
  );
}

export default function VehicleLicenseInfo({ notes }) {
  const data = parseLicenseNotes(notes);
  const hasAny = Object.keys(data).length > 0;
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      {LICENSE_SECTIONS.map((s) => (
        <SectionBlock key={s.id} icon={s.icon} title={s.title} accent={s.accent} fields={s.fields} data={data} />
      ))}
    </div>
  );
}