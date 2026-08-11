import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Trash2, Printer, FileText, ClipboardList, History } from 'lucide-react';
import moment from 'moment';
import InvoiceHistory from '@/components/invoices/InvoiceHistory';

const COMPANY = {
  name: 'DrivingLicense Typing Services LLC',
  short: 'DLTS',
  address: 'Abu Dhabi, United Arab Emirates',
  phone: '+971 502535289',
  email: 'Drivemetyping@gmail.com',
};

const BANK = {
  bank: 'ADCB Abu Dhabi Commercial Bank',
  name: 'Driving License Typing Services LLC',
  account: '13545851920001',
  iban: 'AE680030013545851920001',
};

const emptyItem = () => ({ description: '', qty: 1, price: 0 });

async function getNextDocNumber(type) {
  const period = moment().format('YYYYMM');
  const prefix = type === 'invoice' ? 'INV' : 'QUO';
  const counters = await base44.entities.InvoiceCounter.filter({ type, period });
  let counter = counters[0];
  const nextSeq = (counter?.last_seq || 0) + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  if (counter) {
    await base44.entities.InvoiceCounter.update(counter.id, { last_seq: nextSeq });
  } else {
    await base44.entities.InvoiceCounter.create({ type, period, last_seq: nextSeq });
  }
  return `${prefix}-${period}-${seqStr}`;
}

function DocForm({ type }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isInvoice = type === 'invoice';
  const label = isInvoice ? 'Invoice' : 'Quotation';
  const printRef = useRef();
  const [loading, setLoading] = useState(false);
  const [trNumber, setTrNumber] = useState('');
  const [trMessage, setTrMessage] = useState('');
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-for-invoice'],
    queryFn: () => base44.entities.Transaction.list('-date', 1000),
  });

  const [showSignModal, setShowSignModal] = useState(false);
  const [signature, setSignature] = useState(null);
  const canvasRef = useRef();
  const isDrawing = useRef(false);

  const [doc, setDoc] = useState({
    number: null,
    date: moment().format('YYYY-MM-DD'),
    due_date: moment().add(1, 'days').format('YYYY-MM-DD'),
    customer_name: '',
    customer_mobile: '',
    customer_address: '',
    notes: '',
    items: [emptyItem()],
  });

  const setField = (key, val) => setDoc(d => ({ ...d, [key]: val }));
  const setItem = (i, key, val) => {
    const items = [...doc.items];
    items[i] = { ...items[i], [key]: val };
    setDoc(d => ({ ...d, items }));
  };
  const addItem = () => setDoc(d => ({ ...d, items: [...d.items, emptyItem()] }));
  const removeItem = (i) => setDoc(d => ({ ...d, items: d.items.filter((_, idx) => idx !== i) }));

  const total = doc.items.reduce((s, it) => s + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 0), 0);
  const preparedBy = user?.full_name || user?.email || 'Staff';

  const fillFromTransaction = () => {
    const key = trNumber.trim().toLowerCase();
    const tx = transactions.find(t =>
      [t.reference_number, t.id].some(v => String(v || '').toLowerCase() === key)
    );
    if (!tx) { setTrMessage('Transaction not found'); return; }

    const newItem = {
      description: tx.service_type || tx.sub_category || 'Service',
      qty: 1,
      price: Number(tx.amount || tx.amount_received || 0),
    };

    setDoc(d => {
      const isFirstFill = !d.customer_name && !d.customer_mobile;
      const existingNotes = d.notes ? d.notes + '\n' : '';
      return {
        ...d,
        ...(isFirstFill && {
          customer_name: tx.customer_name || '',
          customer_address: tx.emirates_id ? `Emirates ID: ${tx.emirates_id}` : '',
        }),
        items: [...d.items.filter(it => it.description !== ''), newItem],
        notes: existingNotes + `TR: ${tx.reference_number || tx.id}`,
      };
    });

    setTrMessage(`✓ Added: ${newItem.description} — AED ${newItem.price}`);
    setTrNumber('');
  };

  const startDraw = (e) => {
    isDrawing.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / r.width;
    const scaleY = canvasRef.current.height / r.height;
    ctx.beginPath();
    ctx.moveTo(
      ((e.clientX || e.touches[0].clientX) - r.left) * scaleX,
      ((e.clientY || e.touches[0].clientY) - r.top) * scaleY
    );
  };
  const draw = (e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const r = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / r.width;
    const scaleY = canvasRef.current.height / r.height;
    ctx.lineTo(
      ((e.clientX || e.touches[0].clientX) - r.left) * scaleX,
      ((e.clientY || e.touches[0].clientY) - r.top) * scaleY
    );
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };
  const stopDraw = () => { isDrawing.current = false; };
  const clearSig = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const saveSig = () => {
    setSignature(canvasRef.current.toDataURL());
    setShowSignModal(false);
  };

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    setLoading(true);
    let number = doc.number;
    if (!number) {
      number = await getNextDocNumber(type);
      setDoc(d => ({ ...d, number }));
    }

    if (!doc.number) {
      await base44.entities.InvoiceRecord.create({
        type,
        number,
        date: doc.date,
        due_date: doc.due_date,
        customer_name: doc.customer_name,
        customer_mobile: doc.customer_mobile,
        customer_address: doc.customer_address,
        items: doc.items.map(it => `${it.description || 'Item'} — Qty: ${it.qty || 1} — AED ${parseFloat(it.price || 0).toFixed(2)}`),
        subtotal: total,
        vat: 0,
        total,
        notes: doc.notes,
        prepared_by: preparedBy,
        prepared_by_email: user?.email,
      });
      queryClient.invalidateQueries({ queryKey: ['invoiceRecords'] });
    }

    setLoading(false);
    const content = printRef.current?.innerHTML.replace(
      `${type === 'invoice' ? 'INV' : 'QUO'}-${moment().format('YYYYMM')}-XXXX`,
      number
    );
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>${label} - ${number}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', Arial, sans-serif; }
        body { background:#fff; color:#111; padding:40px; font-size:13px; }
        table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        thead tr { background:#1e40af; color:#fff; }
        th { padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
        td { padding:10px 12px; border-bottom:1px solid #e5e7eb; font-size:13px; }
        tr:nth-child(even) td { background:#f9fafb; }
        @media print { body { padding:24px; } }
      </style></head>
      <body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  const SignModal = showSignModal && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="bg-card rounded-xl border border-border/50 p-5 space-y-3 w-[360px]">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Draw Signature</h3>
        <canvas
          ref={canvasRef}
          width={320}
          height={140}
          className="rounded-lg border border-border/50 bg-white cursor-crosshair w-full"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={clearSig} className="text-xs text-white/50">Clear</Button>
          <Button size="sm" onClick={saveSig} className="flex-1 text-xs bg-primary text-white">Save Signature</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowSignModal(false)} className="text-xs text-white/50">Cancel</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {SignModal}

      {/* Form */}
      <div className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{label} Details</h3>
          {isInvoice && (
            <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-3 space-y-2">
              <Label className="text-xs text-cyan-100">TR Number Autofill</Label>
              <div className="flex gap-2">
                <Input value={trNumber} onChange={e => setTrNumber(e.target.value)} placeholder="Enter TR / TXN reference" className="text-xs" />
                <Button size="sm" onClick={fillFromTransaction}>Fill</Button>
              </div>
              {trMessage && <p className="text-xs text-cyan-100/80">{trMessage}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/50">{label} No.</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={doc.number || `${type === 'invoice' ? 'INV' : 'QUO'}-${moment().format('YYYYMM')}-XXXX`}
                  readOnly
                  className={`text-xs bg-muted/50 cursor-not-allowed font-mono ${!doc.number ? 'text-muted-foreground italic' : ''}`}
                />
                {loading && <span className="text-xs text-muted-foreground">Generating…</span>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/50">Date</Label>
              <Input type="date" value={doc.date} onChange={e => setField('date', e.target.value)} className="text-xs" />
            </div>
            {isInvoice && (
              <div className="space-y-1">
                <Label className="text-xs text-white/50">Due Date</Label>
                <Input type="date" value={doc.due_date} onChange={e => setField('due_date', e.target.value)} className="text-xs" />
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Client Info</h3>
          <div className="space-y-1">
            <Label className="text-xs text-white/50">Customer Name</Label>
            <Input value={doc.customer_name} onChange={e => setField('customer_name', e.target.value)} placeholder="Full name" className="text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-white/50">Mobile</Label>
              <Input value={doc.customer_mobile} onChange={e => setField('customer_mobile', e.target.value)} placeholder="+971..." className="text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-white/50">Address</Label>
              <Input value={doc.customer_address} onChange={e => setField('customer_address', e.target.value)} placeholder="City, UAE" className="text-xs" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Services / Items</h3>
            <Button size="sm" variant="ghost" onClick={addItem} className="gap-1 text-xs text-primary hover:bg-primary/10 border border-primary/20">
              <Plus className="w-3 h-3" /> Add Row
            </Button>
          </div>
          <div className="space-y-2">
            {doc.items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <Input value={it.description} onChange={e => setItem(i, 'description', e.target.value)} placeholder="Description" className="text-xs" />
                </div>
                <div className="col-span-2">
                  <Input type="number" value={it.qty} onChange={e => setItem(i, 'qty', e.target.value)} placeholder="Qty" className="text-xs" min={1} />
                </div>
                <div className="col-span-3">
                  <Input type="number" value={it.price} onChange={e => setItem(i, 'price', e.target.value)} placeholder="Price" className="text-xs" min={0} />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => removeItem(i)} disabled={doc.items.length === 1}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between text-xs text-white/40 px-0.5 mt-1">
              <span>Description</span><span className="mr-24">Qty / Price (AED)</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-1">
          <Label className="text-xs text-white/50">Notes / Terms</Label>
          <Input value={doc.notes} onChange={e => setField('notes', e.target.value)} placeholder="Payment terms, validity, etc." className="text-xs" />
        </div>

        <div className="rounded-xl border border-border/50 bg-card px-4 py-3 flex items-center gap-2 text-xs text-white/40">
          <span>Prepared by:</span>
          <span className="text-white/60 font-medium">{preparedBy}</span>
          {signature && (
            <span className="ml-auto text-emerald-400 flex items-center gap-1">
              ✓ Signed
              <button onClick={() => setSignature(null)} className="text-white/30 hover:text-destructive ml-1 text-xs">✕</button>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setShowSignModal(true)} variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
            ✍️ {signature ? 'Re-sign' : 'Sign'}
          </Button>
          <Button onClick={handlePrint} disabled={loading} className="flex-1 gap-2 btn-lightning bg-gradient-to-r from-primary to-cyan-500 border-0 text-white font-semibold shadow-[0_0_20px_rgba(59,130,246,0.35)]">
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="rounded-xl border border-border/50 bg-white overflow-auto max-h-[85vh] shadow-2xl">
        <div ref={printRef} className="p-8 text-[#111] min-h-[600px]" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
          {/* Header */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28, paddingBottom:16, borderBottom:'3px solid #1e40af' }}>
            <div>
              <h1 style={{ fontSize:20, fontWeight:800, color:'#1e40af', letterSpacing:-0.5 }}>{COMPANY.name}</h1>
              <p style={{ color:'#6b7280', fontSize:11, marginTop:2 }}>{COMPANY.address}</p>
              <p style={{ color:'#6b7280', fontSize:11 }}>{COMPANY.phone} · {COMPANY.email}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ background:'#1e40af', color:'#fff', fontSize:15, fontWeight:700, padding:'5px 16px', borderRadius:6, display:'inline-block', marginBottom:8 }}>{label.toUpperCase()}</div>
              <p style={{ fontSize:11, color:'#6b7280' }}>No: <strong style={{ color: doc.number ? '#111' : '#9ca3af' }}>{doc.number || `${type === 'invoice' ? 'INV' : 'QUO'}-${moment().format('YYYYMM')}-XXXX`}</strong></p>
              <p style={{ fontSize:11, color:'#6b7280' }}>Date: <strong style={{ color:'#111' }}>{moment(doc.date).format('DD MMM YYYY')}</strong></p>
              {isInvoice && <p style={{ fontSize:11, color:'#6b7280' }}>Due: <strong style={{ color:'#e11d48' }}>{moment(doc.due_date).format('DD MMM YYYY')}</strong></p>}
            </div>
          </div>

          {/* Bill To */}
          <div style={{ marginBottom:20 }}>
            <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'#9ca3af', marginBottom:4 }}>Bill To</p>
            <p style={{ fontSize:14, fontWeight:700, color:'#111' }}>{doc.customer_name || 'Customer Name'}</p>
            {doc.customer_mobile && <p style={{ fontSize:11, color:'#6b7280' }}>{doc.customer_mobile}</p>}
            {doc.customer_address && <p style={{ fontSize:11, color:'#6b7280' }}>{doc.customer_address}</p>}
          </div>

          {/* Items Table */}
          <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:20 }}>
            <thead>
              <tr style={{ background:'#1e40af', color:'#fff' }}>
                <th style={{ padding:'8px 10px', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:0.5 }}>#</th>
                <th style={{ padding:'8px 10px', textAlign:'left', fontSize:10, textTransform:'uppercase', letterSpacing:0.5 }}>Description</th>
                <th style={{ padding:'8px 10px', textAlign:'center', fontSize:10, textTransform:'uppercase', letterSpacing:0.5 }}>Qty</th>
                <th style={{ padding:'8px 10px', textAlign:'right', fontSize:10, textTransform:'uppercase', letterSpacing:0.5 }}>Unit Price</th>
                <th style={{ padding:'8px 10px', textAlign:'right', fontSize:10, textTransform:'uppercase', letterSpacing:0.5 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #e5e7eb', background: i % 2 === 1 ? '#f9fafb' : '#fff' }}>
                  <td style={{ padding:'8px 10px', fontSize:12, color:'#6b7280' }}>{i + 1}</td>
                  <td style={{ padding:'8px 10px', fontSize:12 }}>{it.description || '—'}</td>
                  <td style={{ padding:'8px 10px', fontSize:12, textAlign:'center' }}>{it.qty}</td>
                  <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right' }}>AED {parseFloat(it.price || 0).toFixed(2)}</td>
                  <td style={{ padding:'8px 10px', fontSize:12, textAlign:'right', fontWeight:600 }}>AED {((parseFloat(it.price) || 0) * (parseInt(it.qty) || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:24 }}>
            <table style={{ width:240 }}>
              <tbody>
                <tr style={{ borderTop:'2px solid #1e40af' }}>
                  <td style={{ padding:'8px 8px', fontSize:14, fontWeight:700, color:'#1e40af' }}>TOTAL</td>
                  <td style={{ padding:'8px 8px', fontSize:14, fontWeight:700, color:'#1e40af', textAlign:'right' }}>AED {total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {doc.notes && (
            <div style={{ clear:'both', marginTop:16, paddingTop:12, borderTop:'1px solid #e5e7eb' }}>
              <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'#9ca3af', marginBottom:4 }}>Notes / Terms</p>
              <p style={{ fontSize:11, color:'#374151' }}>{doc.notes}</p>
            </div>
          )}

          {/* Bank Details */}
          <div style={{ marginTop:20, padding:'10px 14px', background:'#f0f7ff', borderRadius:8, border:'1px solid #bfdbfe' }}>
            <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:1, color:'#9ca3af', marginBottom:6 }}>Payment / Bank Details</p>
            <table style={{ fontSize:11, color:'#374151', borderCollapse:'collapse', width:'100%' }}>
              <tbody>
                <tr>
                  <td style={{ paddingRight:16, color:'#6b7280', paddingBottom:3, width:120 }}>Bank</td>
                  <td style={{ fontWeight:600 }}>{BANK.bank}</td>
                </tr>
                <tr>
                  <td style={{ paddingRight:16, color:'#6b7280', paddingBottom:3 }}>Account Name</td>
                  <td style={{ fontWeight:600 }}>{BANK.name}</td>
                </tr>
                <tr>
                  <td style={{ paddingRight:16, color:'#6b7280', paddingBottom:3 }}>Account No.</td>
                  <td style={{ fontWeight:600, fontFamily:'monospace' }}>{BANK.account}</td>
                </tr>
                <tr>
                  <td style={{ paddingRight:16, color:'#6b7280' }}>IBAN</td>
                  <td style={{ fontWeight:600, fontFamily:'monospace' }}>{BANK.iban}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature */}
          {signature && (
            <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end' }}>
              <div style={{ textAlign:'center' }}>
                <img src={signature} alt="Signature" style={{ height:60, display:'block', marginBottom:4 }} />
                <div style={{ borderTop:'1px solid #d1d5db', paddingTop:4, fontSize:10, color:'#9ca3af' }}>Authorised Signature</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop:40, borderTop:'1px solid #e5e7eb', paddingTop:10 }}>
            <p style={{ textAlign:'center', fontSize:10, color:'#9ca3af' }}>{COMPANY.name} · {COMPANY.address} · {COMPANY.email}</p>
            <p style={{ textAlign:'right', fontSize:9, color:'#d1d5db', marginTop:4 }}>Prepared by: {preparedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceCreator() {
  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-cyan-500/20 flex items-center justify-center border border-primary/20">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Invoice & Quotation</h1>
          <p className="text-sm text-white/40">Create professional documents for DrivingLicense Typing Services LLC</p>
        </div>
      </div>

      <Tabs defaultValue="invoice" className="space-y-5">
        <TabsList className="bg-secondary border border-border/50">
          <TabsTrigger value="invoice" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FileText className="w-3.5 h-3.5" /> Invoice
          </TabsTrigger>
          <TabsTrigger value="quotation" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <ClipboardList className="w-3.5 h-3.5" /> Quotation
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="w-3.5 h-3.5" /> History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="invoice"><DocForm type="invoice" /></TabsContent>
        <TabsContent value="quotation"><DocForm type="quotation" /></TabsContent>
        <TabsContent value="history"><InvoiceHistory /></TabsContent>
      </Tabs>
    </div>
  );
}