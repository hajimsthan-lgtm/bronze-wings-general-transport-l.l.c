import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { DEFAULT_TEMPLATE } from './defaultTemplate';

// ── Reusable controls ──
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="py-1.5">
      {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
      <div className="flex gap-1 p-1 rounded-lg bg-muted/40 border border-border">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium transition-all ${
              value === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <div className="py-1.5">
      <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-9 h-8 rounded-lg border border-border bg-transparent cursor-pointer flex-shrink-0"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 h-8 px-2 rounded-lg bg-muted/40 border border-border text-xs font-mono text-foreground"
        />
      </div>
    </div>
  );
}

function ColumnRow({ col, index, onToggle, onAlign, onReorder }) {
  return (
    <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-muted/20 border border-border/40">
      <div className="flex flex-col">
        <button onClick={() => onReorder(index, -1)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▲</button>
        <button onClick={() => onReorder(index, 1)} className="text-muted-foreground hover:text-foreground text-[10px] leading-none">▼</button>
      </div>
      <span className="text-xs font-medium flex-1 truncate">{col.label}</span>
      <div className="flex gap-0.5">
        {['left', 'center', 'right'].map(a => (
          <button
            key={a}
            onClick={() => onAlign(col.key, a)}
            className={`w-6 h-6 rounded text-[10px] flex items-center justify-center ${
              col.align === a ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {a === 'left' ? '⇤' : a === 'center' ? '↔' : '⇥'}
          </button>
        ))}
      </div>
      <Toggle label="" checked={col.visible} onChange={() => onToggle(col.key)} />
    </div>
  );
}

// ── Collapsible section ──
function Section({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div className="border-b border-border/40">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/20 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-0.5">{children}</div>}
    </div>
  );
}

export default function TemplateSidebar({ template, onChange, selectedSection }) {
  const [openSections, setOpenSections] = useState({
    header: true, table: true, content: false, footer: false, layout: false,
  });

  const toggleSection = (key) => setOpenSections(p => ({ ...p, [key]: !p[key] }));
  const update = (section, key, value) => onChange({ ...template, [section]: { ...template[section], [key]: value } });

  const toggleCol = (colKey) => {
    const cols = template.table.columns.map(c => c.key === colKey ? { ...c, visible: !c.visible } : c);
    update('table', 'columns', cols);
  };
  const alignCol = (colKey, align) => {
    const cols = template.table.columns.map(c => c.key === colKey ? { ...c, align } : c);
    update('table', 'columns', cols);
  };
  const reorderCol = (index, dir) => {
    const cols = [...template.table.columns];
    const ni = index + dir;
    if (ni < 0 || ni >= cols.length) return;
    [cols[index], cols[ni]] = [cols[ni], cols[index]];
    update('table', 'columns', cols);
  };

  return (
    <div className="h-full overflow-y-auto thin-scroll">
      <Section title="Header" icon={HeaderIcon} open={openSections.header || selectedSection === 'header'} onToggle={() => toggleSection('header')}>
        <Segmented label="Logo Position" options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} value={template.header.logoPosition} onChange={v => update('header','logoPosition',v)} />
        <Segmented label="Logo Size" options={[{value:'small',label:'S'},{value:'medium',label:'M'},{value:'large',label:'L'}]} value={template.header.logoSize} onChange={v => update('header','logoSize',v)} />
        <Segmented label="Company Info" options={[{value:'left',label:'Left'},{value:'right',label:'Right'}]} value={template.header.companyInfoPlacement} onChange={v => update('header','companyInfoPlacement',v)} />
        <Segmented label="Title Size" options={[{value:'small',label:'S'},{value:'medium',label:'M'},{value:'large',label:'L'}]} value={template.header.titleFontSize} onChange={v => update('header','titleFontSize',v)} />
        <Segmented label="Title Weight" options={[{value:'bold',label:'Bold'},{value:'normal',label:'Normal'}]} value={template.header.titleWeight} onChange={v => update('header','titleWeight',v)} />
        <ColorInput label="Accent Color" value={template.header.accentColor} onChange={v => update('header','accentColor',v)} />
        <div className="pt-1 border-t border-border/30 mt-1">
          <Toggle label="Invoice Number" checked={template.header.showInvoiceNumber} onChange={v => update('header','showInvoiceNumber',v)} />
          <Toggle label="Issue Date" checked={template.header.showIssueDate} onChange={v => update('header','showIssueDate',v)} />
          <Toggle label="Due Date" checked={template.header.showDueDate} onChange={v => update('header','showDueDate',v)} />
          <Toggle label="Status Badge" checked={template.header.showStatusBadge} onChange={v => update('header','showStatusBadge',v)} />
        </div>
      </Section>

      <Section title="Table / Line Items" icon={TableIcon} open={openSections.table || selectedSection === 'table'} onToggle={() => toggleSection('table')}>
        <p className="text-xs text-muted-foreground mb-1 mt-1">Columns (drag ▲▼ to reorder, toggle visibility)</p>
        {template.table.columns.map((col, i) => (
          <ColumnRow key={col.key} col={col} index={i} onToggle={toggleCol} onAlign={alignCol} onReorder={reorderCol} />
        ))}
        <div className="pt-1 border-t border-border/30 mt-1">
          <Toggle label="Zebra Striping" checked={template.table.zebraStriping} onChange={v => update('table','zebraStriping',v)} />
          <Toggle label="Header Row Background" checked={template.table.headerRowBg} onChange={v => update('table','headerRowBg',v)} />
          <Toggle label="Header Bold" checked={template.table.headerRowBold} onChange={v => update('table','headerRowBold',v)} />
          <Toggle label="Header Uppercase" checked={template.table.headerRowUppercase} onChange={v => update('table','headerRowUppercase',v)} />
          <Segmented label="Border Style" options={[{value:'full',label:'Full Grid'},{value:'horizontal',label:'Horizontal'},{value:'none',label:'None'}]} value={template.table.borderStyle} onChange={v => update('table','borderStyle',v)} />
          <Segmented label="Row Height" options={[{value:'compact',label:'Compact'},{value:'comfortable',label:'Comfortable'}]} value={template.table.rowHeight} onChange={v => update('table','rowHeight',v)} />
        </div>
      </Section>

      <Section title="Content / Totals" icon={ContentIcon} open={openSections.content || selectedSection === 'content'} onToggle={() => toggleSection('content')}>
        <Segmented label="Notes Position" options={[{value:'above',label:'Above Totals'},{value:'below',label:'Below Totals'}]} value={template.content.notesPosition} onChange={v => update('content','notesPosition',v)} />
        <Toggle label="Show Notes" checked={template.content.showNotes} onChange={v => update('content','showNotes',v)} />
        <div className="pt-1 border-t border-border/30 mt-1">
          <Toggle label="Show Subtotal" checked={template.content.showSubtotal} onChange={v => update('content','showSubtotal',v)} />
          <Toggle label="Show Tax" checked={template.content.showTax} onChange={v => update('content','showTax',v)} />
          <Toggle label="Show Discount" checked={template.content.showDiscount} onChange={v => update('content','showDiscount',v)} />
          <Toggle label="Show Total" checked={template.content.showTotal} onChange={v => update('content','showTotal',v)} />
          <Toggle label="Show Balance Due" checked={template.content.showBalanceDue} onChange={v => update('content','showBalanceDue',v)} />
          <Toggle label="Emphasize Total" checked={template.content.totalEmphasis} onChange={v => update('content','totalEmphasis',v)} />
        </div>
      </Section>

      <Section title="Footer" icon={FooterIcon} open={openSections.footer || selectedSection === 'footer'} onToggle={() => toggleSection('footer')}>
        <Toggle label="Payment Instructions" checked={template.footer.showPaymentInstructions} onChange={v => update('footer','showPaymentInstructions',v)} />
        <Toggle label="Bank Details" checked={template.footer.showBankDetails} onChange={v => update('footer','showBankDetails',v)} />
        <Toggle label="Signature Line" checked={template.footer.showSignatureLine} onChange={v => update('footer','showSignatureLine',v)} />
        <Toggle label="Thank You Note" checked={template.footer.showThankYouNote} onChange={v => update('footer','showThankYouNote',v)} />
        <Toggle label="Page Numbers" checked={template.footer.showPageNumbers} onChange={v => update('footer','showPageNumbers',v)} />
        <Toggle label="Divider Line" checked={template.footer.showDivider} onChange={v => update('footer','showDivider',v)} />
        <Segmented label="Alignment" options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} value={template.footer.alignment} onChange={v => update('footer','alignment',v)} />
      </Section>

      <Section title="Layout" icon={LayoutIcon} open={openSections.layout || selectedSection === 'layout'} onToggle={() => toggleSection('layout')}>
        <Segmented label="Page Size" options={[{value:'A4',label:'A4'},{value:'Letter',label:'Letter'}]} value={template.layout.pageSize} onChange={v => update('layout','pageSize',v)} />
        <Segmented label="Margins" options={[{value:'narrow',label:'Narrow'},{value:'normal',label:'Normal'},{value:'wide',label:'Wide'}]} value={template.layout.margin} onChange={v => update('layout','margin',v)} />
      </Section>
    </div>
  );
}

// Inline icon components to avoid extra imports
function HeaderIcon(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="6" rx="1" /></svg>; }
function TableIcon(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /></svg>; }
function ContentIcon(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="14" y2="18" /></svg>; }
function FooterIcon(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="15" width="18" height="6" rx="1" /></svg>; }
function LayoutIcon(props) { return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="1" /><rect x="6" y="6" width="12" height="12" rx="1" /></svg>; }