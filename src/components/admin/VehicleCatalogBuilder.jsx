import { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, FileText, LayoutGrid, Image, Download, Check, X, Sparkles, Layers } from 'lucide-react';
import { buildVehicleDisplayName, parseLicenseNotes } from '@/lib/vehicleLicenseNotes';
import { getCompanySettings } from '@/lib/companySettings';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';

const TEMPLATES = [
  { id: 'showroom', label: 'Showroom', icon: LayoutGrid, desc: '2-column grid with photos' },
  { id: 'brochure', label: 'Brochure', icon: FileText, desc: '1-per-page detail sheets' },
  { id: 'compact', label: 'Compact', icon: Layers, desc: 'Dense list with specs' },
];

const TYPE_ACCENT = {
  truck: '#1ED760', tanker: '#F59E0B', pickup: '#14b8a6', trailer: '#22C55E', other: '#1ED760',
};

function specFromNotes(notes) {
  const lic = parseLicenseNotes(notes || '');
  return {
    vehicleType: lic.vehicleType || '',
    vehicleCategory: lic.vehicleCategory || '',
    color: lic.vehicleColor || '',
    origin: lic.origin || '',
    gvw: lic.gvw || '',
    passengers: lic.numOfPassengers || '',
    chassisNo: lic.chassisNo || '',
    engineNo: lic.engineNo || '',
    insurer: lic.insurer || '',
  };
}

export default function VehicleCatalogBuilder({ vehicles, open, onOpenChange }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [template, setTemplate] = useState('showroom');
  const [generating, setGenerating] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(true);

  const sortedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => (a.plate_number || '').localeCompare(b.plate_number || '')),
    [vehicles]
  );

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(sortedVehicles.map((v) => v.id)));
  const clearAll = () => setSelected(new Set());

  const selectedVehicles = sortedVehicles.filter((v) => selected.has(v.id));

  const generatePDF = async () => {
    if (selectedVehicles.length === 0) {
      toast({ title: 'No vehicles selected', description: 'Select at least one vehicle for the catalog.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const settings = await getCompanySettings();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.width;
      const pageH = doc.internal.pageSize.height;
      const margin = 15;

      // ── Cover page ──────────────────────────────────────────────
      doc.setFillColor(10, 11, 14);
      doc.rect(0, 0, pageW, pageH, 'F');

      // Accent gradient strip
      const accent = [0, 117, 255];
      for (let i = 0; i < 60; i++) {
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.setGState(doc.GState({ opacity: 0.04 + (i / 60) * 0.08 }));
        doc.rect(0, 40 + i * 0.8, pageW, 0.8, 'F');
      }
      doc.setGState(doc.GState({ opacity: 1 }));

      // Logo
      let logoH = 0;
      if (settings.logo_url) {
        try {
          const logo = await fetchImage(settings.logo_url);
          const maxW = 40, maxH = 30;
          const aspect = logo.w / logo.h;
          let lw = maxW, lh = maxW / aspect;
          if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
          doc.addImage(logo.dataUrl, logo.format, (pageW - lw) / 2, 35, lw, lh);
          logoH = lh;
        } catch (e) {}
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26); doc.setFont(undefined, 'bold');
      doc.text(settings.company_name || 'Fleet Catalog', pageW / 2, 80 + logoH * 0.3, { align: 'center' });

      doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(180, 180, 180);
      if (settings.tagline) doc.text(settings.tagline, pageW / 2, 88 + logoH * 0.3, { align: 'center' });

      doc.setFontSize(42); doc.setFont(undefined, 'bold'); doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text('VEHICLE', pageW / 2, pageH / 2 - 5, { align: 'center' });
      doc.setTextColor(255, 255, 255);
      doc.text('CATALOG', pageW / 2, pageH / 2 + 15, { align: 'center' });

      doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(140, 140, 140);
      doc.text(`${selectedVehicles.length} vehicle${selectedVehicles.length !== 1 ? 's' : ''}  ·  ${new Date().toLocaleDateString('en-GB')}`, pageW / 2, pageH / 2 + 28, { align: 'center' });

      // Footer
      doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text(`${settings.address || ''}  ·  TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}`, pageW / 2, pageH - 15, { align: 'center' });

      // ── Vehicle pages ────────────────────────────────────────────
      for (const v of selectedVehicles) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, 'F');

        const spec = specFromNotes(v.notes);
        const accentColor = TYPE_ACCENT[v.type] || '#1ED760';
        const accentRgb = hexToRgb(accentColor);

        // Header band
        doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
        doc.rect(0, 0, pageW, 6, 'F');

        let yPos = 22;

        // Photo
        let photoH = 0;
        if (includePhotos && v.image_url) {
          try {
            const photo = await fetchImage(v.image_url);
            const maxW = pageW - margin * 2;
            const maxH = template === 'brochure' ? 90 : 55;
            const aspect = photo.w / photo.h;
            let pw = maxW, ph = maxW / aspect;
            if (ph > maxH) { ph = maxH; pw = maxH * aspect; }
            const px = (pageW - pw) / 2;
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(px - 1, yPos - 1, pw + 2, ph + 2, 2, 2, 'F');
            doc.addImage(photo.dataUrl, photo.format, px, yPos, pw, ph);
            photoH = ph + 6;
          } catch (e) {}
        }

        if (template === 'brochure') {
          // ── Brochure: 1 per page, large detail ──
          yPos += photoH || 10;

          doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);
          yPos += 8;

          doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 20, 20);
          doc.text(buildVehicleDisplayName(v), margin, yPos);
          yPos += 7;

          doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text(v.plate_number || '', margin, yPos);
          yPos += 12;

          // Specs grid — 2 columns
          yPos = drawSpecGrid(doc, margin, yPos, pageW - margin * 2, [
            { label: 'Make', value: v.make },
            { label: 'Model', value: v.model },
            { label: 'Year', value: v.year ? String(v.year) : '' },
            { label: 'Type', value: v.type },
            { label: 'Category', value: spec.vehicleCategory || (v.type || '') },
            { label: 'Vehicle Type', value: spec.vehicleType },
            { label: 'Color', value: spec.color },
            { label: 'Origin', value: spec.origin },
            { label: 'GVW', value: spec.gvw },
            { label: 'Passengers', value: spec.passengers },
            { label: 'Fuel', value: v.fuel_type },
            { label: 'Status', value: (v.status || '').replace(/_/g, ' ') },
            { label: 'Driver', value: v.assigned_driver },
            { label: 'Reg Expiry', value: v.registration_expiry },
            { label: 'Ins Expiry', value: v.insurance_expiry },
            { label: 'Insurer', value: spec.insurer },
            { label: 'Chassis No', value: spec.chassisNo },
            { label: 'Engine No', value: spec.engineNo },
          ]);

          if (v.notes) {
            const cleanNotes = (v.notes || '').split('\n').filter((l) => l.startsWith('Notes:')).map((l) => l.replace(/^Notes:\s*/, '')).join(' ');
            if (cleanNotes) {
              yPos += 4;
              doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(60, 60, 60);
              doc.text('Notes', margin, yPos);
              yPos += 4;
              doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
              const lines = doc.splitTextToSize(cleanNotes, pageW - margin * 2);
              doc.text(lines, margin, yPos);
            }
          }
        } else if (template === 'showroom') {
          // ── Showroom: 2-column grid, 2 per page ──
          yPos += photoH || 8;

          doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);
          yPos += 6;

          doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 20, 20);
          doc.text(buildVehicleDisplayName(v), margin, yPos);
          yPos += 6;

          doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text(v.plate_number || '', margin, yPos);
          yPos += 8;

          yPos = drawSpecGrid(doc, margin, yPos, pageW - margin * 2, [
            { label: 'Year', value: v.year ? String(v.year) : '' },
            { label: 'Type', value: v.type },
            { label: 'Category', value: spec.vehicleCategory || (v.type || '') },
            { label: 'Vehicle Type', value: spec.vehicleType },
            { label: 'Color', value: spec.color },
            { label: 'Fuel', value: v.fuel_type },
            { label: 'Status', value: (v.status || '').replace(/_/g, ' ') },
            { label: 'Driver', value: v.assigned_driver },
            { label: 'Reg Expiry', value: v.registration_expiry },
            { label: 'Ins Expiry', value: v.insurance_expiry },
          ]);
        } else {
          // ── Compact: dense list ──
          yPos = 22;
          doc.setFontSize(7); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);

          doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 20, 20);
          doc.text(buildVehicleDisplayName(v), margin + 25, yPos);

          doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
          doc.text(v.plate_number || '', pageW - margin, yPos, { align: 'right' });
          yPos += 6;

          doc.setDrawColor(230, 230, 230); doc.setLineWidth(0.3);
          doc.line(margin, yPos, pageW - margin, yPos);
          yPos += 4;

          const specLines = [
            `Year: ${v.year || '—'}`,
            `Type: ${v.type || '—'}`,
            `Category: ${spec.vehicleCategory || v.type || '—'}`,
            `Vehicle Type: ${spec.vehicleType || '—'}`,
            `Color: ${spec.color || '—'}`,
            `Fuel: ${v.fuel_type || '—'}`,
            `Status: ${(v.status || '—').replace(/_/g, ' ')}`,
            `Driver: ${v.assigned_driver || '—'}`,
            `Reg: ${v.registration_expiry || '—'}`,
            `Ins: ${v.insurance_expiry || '—'}`,
            `GVW: ${spec.gvw || '—'}`,
            `Chassis: ${spec.chassisNo || '—'}`,
          ];
          doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(80, 80, 80);
          const colW = (pageW - margin * 2) / 3;
          specLines.forEach((line, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            doc.text(line, margin + col * colW, yPos + row * 4.5);
          });
        }

        // Footer
        doc.setFontSize(6); doc.setFont(undefined, 'normal'); doc.setTextColor(150, 150, 150);
        doc.text(settings.company_name || '', margin, pageH - 8);
        doc.text(`${v.plate_number || ''}`, pageW / 2, pageH - 8, { align: 'center' });
        doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 8, { align: 'right' });
      }

      // ── Back cover ─────────────────────────────────────────────
      doc.addPage();
      doc.setFillColor(10, 11, 14);
      doc.rect(0, 0, pageW, pageH, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont(undefined, 'bold');
      doc.text(settings.company_name || '', pageW / 2, pageH / 2 - 10, { align: 'center' });
      doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(160, 160, 160);
      doc.text(`${settings.address || ''}`, pageW / 2, pageH / 2, { align: 'center' });
      doc.text(`TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}  ·  ${settings.email || ''}`, pageW / 2, pageH / 2 + 6, { align: 'center' });
      doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, pageW / 2, pageH - 15, { align: 'center' });

      const dateStr = new Date().toISOString().split('T')[0];
      doc.save(`vehicle-catalog-${dateStr}.pdf`);
      toast({ title: 'Catalog generated', description: `${selectedVehicles.length} vehicle${selectedVehicles.length !== 1 ? 's' : ''} included.` });
    } catch (e) {
      toast({ title: 'Generation failed', description: e?.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/25">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Vehicle Catalog Builder
          </DialogTitle>
        </DialogHeader>

        {/* Template selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Catalog Template</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const active = template === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setTemplate(tpl.id)}
                  className={`relative p-3 rounded-xl border text-left transition-all ${active ? 'border-primary/50 bg-primary/10' : 'border-border bg-background hover:border-primary/30'}`}
                >
                  {active && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-primary" />}
                  <Icon className={`w-5 h-5 mb-1.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
                  <p className="text-[10px] text-muted-foreground">{tpl.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={includePhotos} onCheckedChange={setIncludePhotos} />
            <span className="text-sm text-foreground flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> Include vehicle photos</span>
          </label>
        </div>

        {/* Vehicle selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Vehicles <span className="text-primary">({selected.size}/{sortedVehicles.length})</span>
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} className="h-7 text-xs">Select all</Button>
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">Clear</Button>
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-border divide-y divide-border">
            {sortedVehicles.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No vehicles available.</div>
            ) : sortedVehicles.map((v) => {
              const isSel = selected.has(v.id);
              return (
                <button
                  key={v.id}
                  onClick={() => toggle(v.id)}
                  className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${isSel ? 'bg-primary/8' : 'hover:bg-white/5'}`}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-primary border-primary' : 'border-border'}`}>
                    {isSel && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${TYPE_ACCENT[v.type] || '#1ED760'}15` }}>
                    <Truck className="w-3.5 h-3.5" style={{ color: TYPE_ACCENT[v.type] || '#1ED760' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{buildVehicleDisplayName(v)}</p>
                    <p className="text-xs text-muted-foreground truncate">{v.plate_number} · {v.type || 'vehicle'}</p>
                  </div>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: `${TYPE_ACCENT[v.status === 'active' ? 'truck' : 'tanker']}15`, color: v.status === 'active' ? '#22C55E' : v.status === 'maintenance' ? '#F59E0B' : '#94A3B8' }}>
                    {(v.status || '').replace(/_/g, ' ')}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {selected.size > 0 ? `${selected.size} vehicle${selected.size !== 1 ? 's' : ''} selected · ${template} layout` : 'Select vehicles to include'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button onClick={generatePDF} disabled={generating || selected.size === 0}>
              {generating ? (
                <><div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-1" /> Generating…</>
              ) : (
                <><Download className="w-4 h-4 mr-1" /> Generate Catalog</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function drawSpecGrid(doc, x, y, totalW, specs) {
  const cols = 2;
  const colW = totalW / cols;
  const rowH = 6;
  const labelH = 3;
  let maxRows = 0;

  specs.forEach((s, i) => {
    if (!s.value) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    maxRows = Math.max(maxRows, row + 1);
    const cx = x + col * colW;
    const cy = y + row * rowH;

    doc.setFontSize(6); doc.setFont(undefined, 'bold'); doc.setTextColor(140, 140, 140);
    doc.text(s.label.toUpperCase(), cx, cy);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(30, 30, 30);
    doc.text(String(s.value), cx, cy + labelH);
  });

  return y + maxRows * rowH + 4;
}

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m ? m.map((h) => parseInt(h, 16)) : [30, 215, 96];
}

async function fetchImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const format = blob.type.includes('jpeg') ? 'JPEG' : blob.type.includes('webp') ? 'WEBP' : 'PNG';
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
  return { dataUrl, format, ...dims };
}