import { whatsappUrl } from '@/lib/whatsapp';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';

const DEFAULT_COMPANY = 'Bronze Wings General Transport L.L.C';

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString();
}

function fmtMoney(n) {
  return Number(n || 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildMessage(doc, type, settings) {
  const company = settings?.company_name || DEFAULT_COMPANY;
  const client = doc.client_name || 'Client';
  const phone = settings?.phone1 || '';
  const email = settings?.email || '';

  if (type === 'invoice') {
    const total = Number(doc.total_amount || 0);
    const paid = Number(doc.paid_amount || 0);
    const balance = Math.max(0, total - paid);
    return (
      `Dear ${client},\n\n` +
      `*Invoice ${doc.invoice_number || '—'}* – ${company}\n\n` +
      `• Issue Date: ${fmtDate(doc.issue_date)}\n` +
      `• Due Date: ${fmtDate(doc.due_date)}\n` +
      `• Total: AED ${fmtMoney(total)}\n` +
      `• Paid: AED ${fmtMoney(paid)}\n` +
      `• Balance Due: AED ${fmtMoney(balance)}\n\n` +
      `Kindly review and arrange payment at your earliest convenience. The signed copy is attached.\n\n` +
      `For queries${phone ? ` call ${phone}` : ''}${email ? `${phone ? ' / ' : ''}${email}` : ''}.\n\n` +
      `Best regards,\n${company}`
    );
  }
  if (type === 'quotation') {
    const total = Number(doc.total_amount || 0);
    return (
      `Dear ${client},\n\n` +
      `*Quotation ${doc.quotation_number || '—'}* – ${company}\n\n` +
      `• Date: ${fmtDate(doc.issue_date)}\n` +
      `• Valid Until: ${fmtDate(doc.valid_until)}\n` +
      `• Subject: ${doc.subject || '—'}\n` +
      `• Total: AED ${fmtMoney(total)}\n\n` +
      `We look forward to your favorable response.\n\n` +
      `For queries${phone ? ` call ${phone}` : ''}${email ? `${phone ? ' / ' : ''}${email}` : ''}.\n\n` +
      `Best regards,\n${company}`
    );
  }
  // agreement
  const amount = Number(doc.amount || 0);
  return (
    `Dear ${client},\n\n` +
    `*Agreement ${doc.agreement_number || '—'}* – ${company}\n\n` +
    `• Title: ${doc.title || '—'}\n` +
    `• Type: ${doc.agreement_type || 'service'}\n` +
    `• Start: ${fmtDate(doc.start_date)}\n` +
    `• End: ${fmtDate(doc.end_date)}\n` +
    `• Value: AED ${fmtMoney(amount)}\n\n` +
    `Kindly review and return a signed copy.\n\n` +
    `For queries${phone ? ` call ${phone}` : ''}${email ? `${phone ? ' / ' : ''}${email}` : ''}.\n\n` +
    `Best regards,\n${company}`
  );
}

export default function WhatsAppShareButton({
  doc,
  type,
  settings,
  variant = 'icon',
  className = '',
  title = 'Share via WhatsApp',
}) {
  if (!doc) return null;
  const phone = doc.client_phone || settings?.phone1 || '';
  const message = buildMessage(doc, type, settings);
  const url = whatsappUrl(phone, message);

  const triggerClass =
    variant === 'card'
      ? 'inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0'
      : `w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0 ${className}`;

  return (
    <button
      type="button"
      title={title}
      className={triggerClass}
      onClick={(e) => {
        e.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      <WhatsAppIcon size={variant === 'card' ? 14 : 16} />
    </button>
  );
}