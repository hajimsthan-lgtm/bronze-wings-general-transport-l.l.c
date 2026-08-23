import { useState } from 'react';
import { Phone, Mail, BadgeCheck, Hash, CalendarClock, MapPin, Users, UserRound, Wrench, FileText, Pencil, Plus, Trash2, X, Check, Info } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { base44 } from '@/api/base44Client';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const TYPE_LABELS = { vehicle_supplier: 'Vehicle Supplier', driver_supplier: 'Driver Supplier', both: 'Both' };
const TYPE_COLORS = { vehicle_supplier: '#3b82f6', driver_supplier: '#0ea5e9', both: '#8b5cf6' };

const CARD_BASE = {
  ['--row-accent']: '#3b82f6',
  borderTop: '3px solid #3b82f6',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

export default function VendorProfileCard({ vendor, stats, onEdit }) {
  const tone = TYPE_COLORS[vendor.provider_type] || '#3b82f6';
  const isActive = vendor.status === 'active';
  const dotColor = isActive ? '#34d399' : '#94a3b8';

  const [contacts, setContacts] = useState(vendor.contact_persons || []);
  const [showForm, setShowForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', position: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const [generalInfo, setGeneralInfo] = useState(vendor.general_info || []);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [newInfo, setNewInfo] = useState({ label: '', value: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  const addContact = async () => {
    if (!newContact.name.trim()) return;
    setSaving(true);
    const updated = [...contacts, { name: newContact.name.trim(), position: newContact.position.trim(), phone: newContact.phone.trim() }];
    try {
      await base44.entities.Vendor.update(vendor.id, { contact_persons: updated });
      setContacts(updated);
      setNewContact({ name: '', position: '', phone: '' });
      setShowForm(false);
    } catch (e) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    try {
      await base44.entities.Vendor.update(vendor.id, { contact_persons: updated });
      setContacts(updated);
    } catch (e) {
      // ignore
    }
  };

  const addInfo = async () => {
    if (!newInfo.label.trim() || !newInfo.value.trim()) return;
    setSavingInfo(true);
    const updated = [...generalInfo, { label: newInfo.label.trim(), value: newInfo.value.trim() }];
    try {
      await base44.entities.Vendor.update(vendor.id, { general_info: updated });
      setGeneralInfo(updated);
      setNewInfo({ label: '', value: '' });
      setShowInfoForm(false);
    } catch (e) {
      // ignore
    } finally {
      setSavingInfo(false);
    }
  };

  const removeInfo = async (index) => {
    const updated = generalInfo.filter((_, i) => i !== index);
    try {
      await base44.entities.Vendor.update(vendor.id, { general_info: updated });
      setGeneralInfo(updated);
    } catch (e) {
      // ignore
    }
  };

  const statsList = [
    { label: 'Vehicles', value: stats?.vehicles ?? 0, accent: '#3b82f6' },
    { label: 'Drivers', value: stats?.drivers ?? 0, accent: '#0ea5e9' },
    { label: 'Spend', value: stats?.spend ?? 0, accent: '#f43f5e' },
    { label: 'Expenses', value: stats?.expenses ?? 0, accent: '#f59e0b' },
  ];

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={{ ...CARD_BASE, ['--row-accent']: tone, borderTop: `3px solid ${tone}` }}>
      {/* header band */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba(tone, 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba(tone, 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(tone, 0.40)} 0%, transparent 70%)` }} />
            <div className="relative w-14 h-14 rounded-xl flex items-center justify-center border border-white/10" style={{ background: hexToRgba(tone, 0.14) }}>
              <Wrench className="w-7 h-7" style={{ color: tone }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground leading-tight break-words">{vendor.name}</h2>
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2">
                {isActive && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
              </span>
              <span className="text-xs text-muted-foreground">{TYPE_LABELS[vendor.provider_type] || 'Service Provider'}</span>
            </div>
          </div>
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit vendor">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          <StatusBadge status={vendor.status} />
        </div>
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info rows */}
      <div className="px-5 py-4 space-y-2.5">
        {vendor.contact_person && (
          <div className="flex items-center gap-2.5 text-xs">
            <UserRound className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Contact</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vendor.contact_person}</span>
          </div>
        )}
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Phone</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vendor.phone}</span>
          </a>
        )}
        {vendor.email && (
          <a href={`mailto:${vendor.email}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Email</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vendor.email}</span>
          </a>
        )}
        {vendor.trn && (
          <div className="flex items-center gap-2.5 text-xs">
            <Hash className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-muted-foreground">TRN</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vendor.trn}</span>
          </div>
        )}
        {vendor.rate_terms && (
          <div className="flex items-center gap-2.5 text-xs">
            <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-muted-foreground">Rate Terms</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vendor.rate_terms}</span>
          </div>
        )}

        {/* Other Contacts */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Other Contacts</span>
            <button
              onClick={() => setShowForm(s => !s)}
              className="ml-auto w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              title="Add contact"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showForm && (
            <div className="mb-2.5 rounded-xl border border-primary/20 bg-primary/[0.04] p-2.5 space-y-2">
              <input
                value={newContact.name}
                onChange={e => setNewContact(p => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                className="w-full h-8 rounded-lg bg-input border border-white/10 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <input
                value={newContact.position}
                onChange={e => setNewContact(p => ({ ...p, position: e.target.value }))}
                placeholder="Position"
                className="w-full h-8 rounded-lg bg-input border border-white/10 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <input
                value={newContact.phone}
                onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))}
                placeholder="Contact Number"
                className="w-full h-8 rounded-lg bg-input border border-white/10 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowForm(false); setNewContact({ name: '', position: '', phone: '' }); }}
                  className="px-2.5 h-7 rounded-lg text-xs text-muted-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={addContact}
                  disabled={saving || !newContact.name.trim()}
                  className="px-2.5 h-7 rounded-lg text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          )}

          {contacts.length > 0 ? (
            <div className="space-y-1.5">
              {contacts.map((cp, i) => (
                <div key={i} className="flex items-center gap-2 text-xs group">
                  <div className="w-6 h-6 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-sky-300">{initialsOf(cp.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-foreground truncate block leading-tight">{cp.name}</span>
                    {cp.position && <span className="text-[10px] text-muted-foreground truncate block leading-tight">{cp.position}</span>}
                  </div>
                  {cp.phone && <a href={`tel:${cp.phone}`} onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-primary flex-shrink-0"><Phone className="w-3 h-3" /></a>}
                  <button
                    onClick={() => removeContact(i)}
                    className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : !showForm && (
            <p className="text-[10px] text-muted-foreground/60 italic">No other contacts yet</p>
          )}
        </div>

        {/* General Information */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">General Information</span>
            <button
              onClick={() => setShowInfoForm(s => !s)}
              className="ml-auto w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
              title="Add info"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showInfoForm && (
            <div className="mb-2.5 rounded-xl border border-primary/20 bg-primary/[0.04] p-2.5 space-y-2">
              <input
                value={newInfo.label}
                onChange={e => setNewInfo(p => ({ ...p, label: e.target.value }))}
                placeholder="Label (e.g. Trade License No.)"
                className="w-full h-8 rounded-lg bg-input border border-white/10 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <input
                value={newInfo.value}
                onChange={e => setNewInfo(p => ({ ...p, value: e.target.value }))}
                placeholder="Value"
                className="w-full h-8 rounded-lg bg-input border border-white/10 px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowInfoForm(false); setNewInfo({ label: '', value: '' }); }}
                  className="px-2.5 h-7 rounded-lg text-xs text-muted-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={addInfo}
                  disabled={savingInfo || !newInfo.label.trim() || !newInfo.value.trim()}
                  className="px-2.5 h-7 rounded-lg text-xs font-medium bg-primary text-primary-foreground flex items-center gap-1 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          )}

          {generalInfo.length > 0 ? (
            <div className="space-y-1.5">
              {generalInfo.map((gi, i) => (
                <div key={i} className="flex items-center gap-2 text-xs group">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-emerald-300">{gi.label[0]?.toUpperCase() || 'i'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-muted-foreground truncate block leading-tight">{gi.label}</span>
                    <span className="font-semibold text-foreground truncate block leading-tight">{gi.value}</span>
                  </div>
                  <button
                    onClick={() => removeInfo(i)}
                    className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    title="Remove"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : !showInfoForm && (
            <p className="text-[10px] text-muted-foreground/60 italic">No general information yet</p>
          )}
        </div>
      </div>

      {/* address footer */}
      {vendor.address && (
        <div className="mx-5 mb-5 flex items-start gap-2.5 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#f43f5e', 0.06) }}>
          <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">{vendor.address}</p>
        </div>
      )}
    </div>
  );
}