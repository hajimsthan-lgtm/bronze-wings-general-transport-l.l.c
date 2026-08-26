import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Truck, FileText, LayoutGrid, Image, Download, Check, X, Sparkles, Layers, List, Crown, Upload } from 'lucide-react';
import { buildVehicleDisplayName, parseLicenseNotes } from '@/lib/vehicleLicenseNotes';
import { getCompanySettings } from '@/lib/companySettings';
import { useToast } from '@/components/ui/use-toast';
import jsPDF from 'jspdf';
import CatalogImageUpload from './CatalogImageUpload';

const TEMPLATES = [
  { id: 'premium', label: 'Premium', icon: Crown, desc: 'Full-page executive showcase' },
  { id: 'showroom', label: 'Showroom', icon: LayoutGrid, desc: '2-column grid with photos' },
  { id: 'brochure', label: 'Brochure', icon: FileText, desc: '1-per-page detail sheets' },
  { id: 'list', label: 'One-Page List', icon: List, desc: 'All vehicles on one page' },
  { id: 'compact', label: 'Compact', icon: Layers, desc: 'Dense list with specs' },
];

// Professional palette — navy, gold, charcoal
const PRO = {
  navy: [11, 20, 55],
  navyDark: [6, 10, 33],
  gold: [201, 169, 97],
  goldLight: [218, 191, 130],
  charcoal: [26, 26, 46],
  textDark: [25, 25, 35],
  textMuted: [107, 114, 128],
  bgLight: [250, 250, 252],
  border: [226, 232, 240],
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

const imageCache = new Map();
async function fetchImage(url) {
  if (!url) return null;
  if (imageCache.has(url)) return imageCache.get(url);
  try {
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
    const result = { dataUrl, format, ...dims };
    imageCache.set(url, result);
    return result;
  } catch (e) {
    return null;
  }
}

export default function VehicleCatalogBuilder({ vehicles, open, onOpenChange }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [template, setTemplate] = useState('premium');
  const [generating, setGenerating] = useState(false);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [customImages, setCustomImages] = useState({});

  const sortedVehicles = useMemo(
    () => [...vehicles].sort((a, b) => (a.plate_number || '').localeCompare(b.plate_number || '')),
    [vehicles]
  );

  const toggle = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const selectAll = () => setSelected(new Set(sortedVehicles.map((v) => v.id)));
  const clearAll = () => setSelected(new Set());

  const selectedVehicles = sortedVehicles.filter((v) => selected.has(v.id));
  const getPhotoUrl = (v) => customImages[v.id] || v.image_url;

  const generatePDF = async () => {
    if (selectedVehicles.length === 0) {
      toast({ title: 'No vehicles selected', description: 'Select at least one vehicle for the catalog.', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    try {
      const settings = await getCompanySettings();
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Preload all images
      const allUrls = [settings.logo_url, ...selectedVehicles.map((v) => getPhotoUrl(v))].filter(Boolean);
      await Promise.all(allUrls.map((u) => fetchImage(u)));

      // Cover page
      drawCoverPage(doc, settings, selectedVehicles.length);

      if (template === 'list') {
        drawListPage(doc, settings, selectedVehicles, getPhotoUrl);
      } else {
        for (const v of selectedVehicles) {
          doc.addPage();
          if (template === 'premium') {
            drawPremiumPage(doc, v, settings, getPhotoUrl, includePhotos);
          } else if (template === 'brochure') {
            drawBrochurePage(doc, v, settings, getPhotoUrl, includePhotos);
          } else if (template === 'showroom') {
            drawShowroomPage(doc, v, settings, getPhotoUrl, includePhotos);
          } else {
            drawCompactPage(doc, v, settings, getPhotoUrl);
          }
        }
      }

      drawBackCover(doc, settings);

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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ background: `rgb(${PRO.gold[0]},${PRO.gold[1]},${PRO.gold[2]},0.12)`, borderColor: `rgb(${PRO.gold[0]},${PRO.gold[1]},${PRO.gold[2]},0.3)` }}>
              <Crown className="w-4 h-4" style={{ color: `rgb(${PRO.gold.join(',')})` }} />
            </div>
            Vehicle Catalog Builder
          </DialogTitle>
        </DialogHeader>

        {/* Template selector */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Catalog Template</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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
                  <p className="text-[10px] text-muted-foreground leading-tight">{tpl.desc}</p>
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
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Upload className="w-3.5 h-3.5" /> Upload custom photos per vehicle below
          </span>
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
                <div key={v.id} className={`w-full flex items-center gap-3 p-2.5 text-left transition-colors ${isSel ? 'bg-primary/8' : 'hover:bg-white/5'}`}>
                  <button onClick={() => toggle(v.id)} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-primary border-primary' : 'border-border'}`}>
                      {isSel && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                    </div>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/40">
                      <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{buildVehicleDisplayName(v)}</p>
                      <p className="text-xs text-muted-foreground truncate">{v.plate_number} · {v.type || 'vehicle'}</p>
                    </div>
                  </button>
                  {isSel && (
                    <CatalogImageUpload
                      vehicle={v}
                      onUpload={(url) => setCustomImages((prev) => ({ ...prev, [v.id]: url }))}
                    />
                  )}
                </div>
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

// ════════════════════════════════════════════════════════════
//  PROFESSIONAL PDF PAGE RENDERERS
// ════════════════════════════════════════════════════════════

function drawCoverPage(doc, settings, count) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  doc.setFillColor(PRO.navy[0], PRO.navy[1], PRO.navy[2]);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 0, pageW, 4, 'F');

  for (let i = 0; i < 40; i++) {
    doc.setGState(doc.GState({ opacity: 0.02 + (i / 40) * 0.03 }));
    doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
    doc.rect(0, 60 + i * 2, pageW, 2, 'F');
  }
  doc.setGState(doc.GState({ opacity: 1 }));

  let logoH = 0;
  if (settings.logo_url) {
    const logo = imageCache.get(settings.logo_url);
    if (logo) {
      const maxW = 45, maxH = 35;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.setDrawColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect((pageW - lw) / 2 - 3, 32, lw + 6, lh + 6, 2, 2, 'S');
      doc.addImage(logo.dataUrl, logo.format, (pageW - lw) / 2, 35, lw, lh);
      logoH = lh;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24); doc.setFont(undefined, 'bold');
  doc.text(settings.company_name || 'Fleet Catalog', pageW / 2, 85 + logoH * 0.2, { align: 'center' });

  doc.setDrawColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 25, 90 + logoH * 0.2, pageW / 2 + 25, 90 + logoH * 0.2);

  if (settings.tagline) {
    doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.goldLight[0], PRO.goldLight[1], PRO.goldLight[2]);
    doc.text(settings.tagline, pageW / 2, 96 + logoH * 0.2, { align: 'center' });
  }

  doc.setFontSize(38); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text('VEHICLE', pageW / 2, pageH / 2 - 5, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.text('CATALOG', pageW / 2, pageH / 2 + 15, { align: 'center' });

  doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(180, 180, 190);
  doc.text(`${count} vehicle${count !== 1 ? 's' : ''}  ·  ${new Date().toLocaleDateString('en-GB')}`, pageW / 2, pageH / 2 + 28, { align: 'center' });

  doc.setDrawColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.setLineWidth(0.3);
  doc.line(30, pageH - 22, pageW - 30, pageH - 22);
  doc.setFontSize(7); doc.setTextColor(140, 140, 150);
  doc.text(`${settings.address || ''}  ·  TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}`, pageW / 2, pageH - 15, { align: 'center' });

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, pageH - 4, pageW, 4, 'F');
}

function drawPremiumPage(doc, v, settings, getPhotoUrl, includePhotos) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 18;
  const spec = specFromNotes(v.notes);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.navy[0], PRO.navy[1], PRO.navy[2]);
  doc.rect(0, 0, pageW, 50, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 50, pageW, 1.5, 'F');

  let logoW = 0;
  if (settings.logo_url) {
    const logo = imageCache.get(settings.logo_url);
    if (logo) {
      const maxW = 22, maxH = 16;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.addImage(logo.dataUrl, logo.format, margin, 8, lw, lh);
      logoW = lw;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8); doc.setFont(undefined, 'bold');
  doc.text((settings.company_name || '').toUpperCase(), margin + logoW + 4, 14);
  doc.setFontSize(6); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.goldLight[0], PRO.goldLight[1], PRO.goldLight[2]);
  doc.text('VEHICLE CATALOG', margin + logoW + 4, 19);

  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text('PREMIUM SHOWCASE', pageW - margin, 14, { align: 'right' });
  doc.setFontSize(6); doc.setTextColor(180, 180, 190);
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, 19, { align: 'right' });

  let yPos = 65;
  doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);

  yPos += 10;
  doc.setFontSize(24); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
  doc.text(buildVehicleDisplayName(v), margin, yPos);

  yPos += 9;
  doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text(v.plate_number || '', margin, yPos);

  yPos += 6;
  let photoH = 0;
  const photoUrl = getPhotoUrl(v);
  if (includePhotos && photoUrl) {
    const photo = imageCache.get(photoUrl);
    if (photo) {
      const maxW = pageW - margin * 2;
      const maxH = 75;
      const aspect = photo.w / photo.h;
      let pw = maxW, ph = maxW / aspect;
      if (ph > maxH) { ph = maxH; pw = maxH * aspect; }
      const px = (pageW - pw) / 2;
      doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(px - 2, yPos - 2, pw + 4, ph + 4, 2, 2, 'S');
      doc.addImage(photo.dataUrl, photo.format, px, yPos, pw, ph);
      photoH = ph + 8;
    }
  }

  yPos += photoH || 10;
  drawPremiumSpecs(doc, margin, yPos, pageW - margin * 2, [
    { label: 'Make', value: v.make },
    { label: 'Model', value: v.model },
    { label: 'Year', value: v.year ? String(v.year) : '' },
    { label: 'Category', value: spec.vehicleCategory || v.type || '' },
    { label: 'Vehicle Type', value: spec.vehicleType },
    { label: 'Color', value: spec.color },
    { label: 'Origin', value: spec.origin },
    { label: 'GVW', value: spec.gvw },
    { label: 'Fuel', value: v.fuel_type },
    { label: 'Status', value: (v.status || '').replace(/_/g, ' ') },
    { label: 'Driver', value: v.assigned_driver },
    { label: 'Reg Expiry', value: v.registration_expiry },
    { label: 'Ins Expiry', value: v.insurance_expiry },
    { label: 'Insurer', value: spec.insurer },
    { label: 'Chassis No', value: spec.chassisNo },
    { label: 'Engine No', value: spec.engineNo },
  ]);

  doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.setFontSize(6); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.textMuted[0], PRO.textMuted[1], PRO.textMuted[2]);
  doc.text(settings.company_name || '', margin, pageH - 10);
  doc.text(v.plate_number || '', pageW / 2, pageH - 10, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 10, { align: 'right' });
}

function drawBrochurePage(doc, v, settings, getPhotoUrl, includePhotos) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const spec = specFromNotes(v.notes);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 0, pageW, 3, 'F');

  let yPos = 20;
  let photoH = 0;
  const photoUrl = getPhotoUrl(v);
  if (includePhotos && photoUrl) {
    const photo = imageCache.get(photoUrl);
    if (photo) {
      const maxW = pageW - margin * 2;
      const maxH = 90;
      const aspect = photo.w / photo.h;
      let pw = maxW, ph = maxW / aspect;
      if (ph > maxH) { ph = maxH; pw = maxH * aspect; }
      const px = (pageW - pw) / 2;
      doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(px - 1, yPos - 1, pw + 2, ph + 2, 2, 2, 'S');
      doc.addImage(photo.dataUrl, photo.format, px, yPos, pw, ph);
      photoH = ph + 6;
    }
  }

  yPos += photoH || 10;
  doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);
  yPos += 8;

  doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
  doc.text(buildVehicleDisplayName(v), margin, yPos);
  yPos += 7;

  doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text(v.plate_number || '', margin, yPos);
  yPos += 12;

  yPos = drawSpecGrid(doc, margin, yPos, pageW - margin * 2, [
    { label: 'Make', value: v.make },
    { label: 'Model', value: v.model },
    { label: 'Year', value: v.year ? String(v.year) : '' },
    { label: 'Type', value: v.type },
    { label: 'Category', value: spec.vehicleCategory || v.type || '' },
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

  doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.setFontSize(6); doc.setTextColor(PRO.textMuted[0], PRO.textMuted[1], PRO.textMuted[2]);
  doc.text(settings.company_name || '', margin, pageH - 10);
  doc.text(v.plate_number || '', pageW / 2, pageH - 10, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 10, { align: 'right' });
}

function drawShowroomPage(doc, v, settings, getPhotoUrl, includePhotos) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const spec = specFromNotes(v.notes);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.navy[0], PRO.navy[1], PRO.navy[2]);
  doc.rect(0, 0, pageW, 3, 'F');

  let yPos = 18;
  let photoH = 0;
  const photoUrl = getPhotoUrl(v);
  if (includePhotos && photoUrl) {
    const photo = imageCache.get(photoUrl);
    if (photo) {
      const maxW = pageW - margin * 2;
      const maxH = 55;
      const aspect = photo.w / photo.h;
      let pw = maxW, ph = maxW / aspect;
      if (ph > maxH) { ph = maxH; pw = maxH * aspect; }
      const px = (pageW - pw) / 2;
      doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(px - 1, yPos - 1, pw + 2, ph + 2, 2, 2, 'S');
      doc.addImage(photo.dataUrl, photo.format, px, yPos, pw, ph);
      photoH = ph + 6;
    }
  }

  yPos += photoH || 8;
  doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);
  yPos += 6;

  doc.setFontSize(16); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
  doc.text(buildVehicleDisplayName(v), margin, yPos);
  yPos += 6;

  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text(v.plate_number || '', margin, yPos);
  yPos += 8;

  yPos = drawSpecGrid(doc, margin, yPos, pageW - margin * 2, [
    { label: 'Year', value: v.year ? String(v.year) : '' },
    { label: 'Type', value: v.type },
    { label: 'Category', value: spec.vehicleCategory || v.type || '' },
    { label: 'Vehicle Type', value: spec.vehicleType },
    { label: 'Color', value: spec.color },
    { label: 'Fuel', value: v.fuel_type },
    { label: 'Status', value: (v.status || '').replace(/_/g, ' ') },
    { label: 'Driver', value: v.assigned_driver },
    { label: 'Reg Expiry', value: v.registration_expiry },
    { label: 'Ins Expiry', value: v.insurance_expiry },
  ]);

  doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 15, pageW - margin, pageH - 15);
  doc.setFontSize(6); doc.setTextColor(PRO.textMuted[0], PRO.textMuted[1], PRO.textMuted[2]);
  doc.text(settings.company_name || '', margin, pageH - 10);
  doc.text(v.plate_number || '', pageW / 2, pageH - 10, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 10, { align: 'right' });
}

function drawCompactPage(doc, v, settings, getPhotoUrl) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const spec = specFromNotes(v.notes);

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 0, pageW, 2, 'F');

  let yPos = 22;
  doc.setFontSize(7); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text((v.type || 'VEHICLE').toUpperCase(), margin, yPos);

  doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
  doc.text(buildVehicleDisplayName(v), margin + 25, yPos);

  doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text(v.plate_number || '', pageW - margin, yPos, { align: 'right' });
  yPos += 6;

  doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]); doc.setLineWidth(0.3);
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

  doc.setFontSize(6); doc.setTextColor(PRO.textMuted[0], PRO.textMuted[1], PRO.textMuted[2]);
  doc.text(settings.company_name || '', margin, pageH - 8);
  doc.text(v.plate_number || '', pageW / 2, pageH - 8, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 8, { align: 'right' });
}

function drawListPage(doc, settings, vehicles, getPhotoUrl) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 10;

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.navy[0], PRO.navy[1], PRO.navy[2]);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 28, pageW, 1, 'F');

  let logoW = 0;
  if (settings.logo_url) {
    const logo = imageCache.get(settings.logo_url);
    if (logo) {
      const maxW = 18, maxH = 14;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.addImage(logo.dataUrl, logo.format, margin, 7, lw, lh);
      logoW = lw;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10); doc.setFont(undefined, 'bold');
  doc.text((settings.company_name || '').toUpperCase(), margin + logoW + 3, 13);
  doc.setFontSize(6); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.goldLight[0], PRO.goldLight[1], PRO.goldLight[2]);
  doc.text('VEHICLE CATALOG — ONE PAGE LIST', margin + logoW + 3, 18);

  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.text(`${vehicles.length} vehicles  ·  ${new Date().toLocaleDateString('en-GB')}`, pageW - margin, 13, { align: 'right' });

  let y = 38;
  const cols = [
    { label: 'Plate', x: margin, w: 22 },
    { label: 'Vehicle', x: margin + 22, w: 45 },
    { label: 'Category', x: margin + 67, w: 30 },
    { label: 'Type', x: margin + 97, w: 28 },
    { label: 'Year', x: margin + 125, w: 14 },
    { label: 'Status', x: margin + 139, w: 18 },
    { label: 'Driver', x: margin + 157, w: 33 },
  ];

  const drawTableHeader = (hy) => {
    doc.setFillColor(PRO.navyDark[0], PRO.navyDark[1], PRO.navyDark[2]);
    doc.rect(margin, hy - 4, pageW - margin * 2, 6, 'F');
    doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
    cols.forEach((c) => doc.text(c.label.toUpperCase(), c.x, hy));
    return hy + 4;
  };

  y = drawTableHeader(y);
  doc.setFontSize(7); doc.setFont(undefined, 'normal');

  vehicles.forEach((v, idx) => {
    if (y > pageH - 20) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageW, pageH, 'F');
      y = drawTableHeader(14);
      doc.setFontSize(7); doc.setFont(undefined, 'normal');
    }

    const spec = specFromNotes(v.notes);

    if (idx % 2 === 0) {
      doc.setFillColor(248, 249, 252);
      doc.rect(margin, y - 3, pageW - margin * 2, 5.5, 'F');
    }

    doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
    doc.text(v.plate_number || '', cols[0].x, y);
    doc.text(buildVehicleDisplayName(v).substring(0, 28), cols[1].x, y);
    doc.text((spec.vehicleCategory || v.type || '').substring(0, 18), cols[2].x, y);
    doc.text((spec.vehicleType || '').substring(0, 16), cols[3].x, y);
    doc.text(v.year ? String(v.year) : '', cols[4].x, y);
    doc.text((v.status || '').replace(/_/g, ' '), cols[5].x, y);
    doc.text((v.assigned_driver || '').substring(0, 20), cols[6].x, y);
    y += 5.5;
  });

  doc.setDrawColor(PRO.border[0], PRO.border[1], PRO.border[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
  doc.setFontSize(6); doc.setTextColor(PRO.textMuted[0], PRO.textMuted[1], PRO.textMuted[2]);
  doc.text(settings.company_name || '', margin, pageH - 7);
  doc.text('Vehicle Catalog', pageW / 2, pageH - 7, { align: 'center' });
  doc.text(new Date().toLocaleDateString('en-GB'), pageW - margin, pageH - 7, { align: 'right' });
}

function drawBackCover(doc, settings) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;

  doc.setFillColor(PRO.navy[0], PRO.navy[1], PRO.navy[2]);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.rect(0, 0, pageW, 4, 'F');
  doc.rect(0, pageH - 4, pageW, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  doc.text(settings.company_name || '', pageW / 2, pageH / 2 - 15, { align: 'center' });

  doc.setDrawColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 20, pageH / 2 - 8, pageW / 2 + 20, pageH / 2 - 8);

  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.goldLight[0], PRO.goldLight[1], PRO.goldLight[2]);
  doc.text(settings.address || '', pageW / 2, pageH / 2, { align: 'center' });
  doc.text(`TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}  ·  ${settings.email || ''}`, pageW / 2, pageH / 2 + 6, { align: 'center' });

  doc.setFontSize(7); doc.setTextColor(120, 120, 130);
  doc.text(`Generated ${new Date().toLocaleString('en-GB')}`, pageW / 2, pageH - 15, { align: 'center' });
}

// ════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════

function drawPremiumSpecs(doc, x, y, totalW, specs) {
  const cols = 2;
  const colW = totalW / cols;
  const rowH = 7;
  let maxRows = 0;

  specs.forEach((s, i) => {
    if (!s.value) return;
    const col = i % cols;
    const row = Math.floor(i / cols);
    maxRows = Math.max(maxRows, row + 1);
    const cx = x + col * colW;
    const cy = y + row * rowH;

    doc.setFontSize(6); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
    doc.text(s.label.toUpperCase(), cx, cy);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
    doc.text(String(s.value), cx, cy + 3.5);
  });

  return y + maxRows * rowH + 4;
}

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

    doc.setFontSize(6); doc.setFont(undefined, 'bold'); doc.setTextColor(PRO.gold[0], PRO.gold[1], PRO.gold[2]);
    doc.text(s.label.toUpperCase(), cx, cy);
    doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(PRO.textDark[0], PRO.textDark[1], PRO.textDark[2]);
    doc.text(String(s.value), cx, cy + labelH);
  });

  return y + maxRows * rowH + 4;
}