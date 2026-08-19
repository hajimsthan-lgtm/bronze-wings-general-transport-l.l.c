import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { whatsappUrl } from '@/lib/whatsapp';
import { shareDocWithFile } from '@/lib/docShare';
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
      `Kindly review the attached invoice PDF and arrange payment at your earliest convenience.\n\n` +
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
      `Please find the attached quotation PDF. We look forward to your favorable response.\n\n` +
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
    `Please find the attached agreement PDF. Kindly review and return a signed copy.\n\n` +
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
  const [busy, setBusy] = useState(false);
  if (!doc) return null;
  const phone = doc.client_phone || settings?.phone1 || '';
  const message = buildMessage(doc, type, settings);

  const triggerClass =
    variant === 'card'
      ? 'inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0'
      : `w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0 ${className}`;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const shared = await shareDocWithFile(doc, type, settings, {
        text: message,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} ${doc.invoice_number || doc.quotation_number || doc.agreement_number || ''}`,
      });
      // If the native share sheet was not available, open WhatsApp with the
      // message text (the PDF was already downloaded for manual attachment).
      if (!shared) {
        window.open(whatsappUrl(phone, message), '_blank', 'noopener,noreferrer');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      title={title}
      className={triggerClass}
      onClick={handleClick}
      disabled={busy}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <WhatsAppIcon size={variant === 'card' ? 14 : 16} />}
    </button>
  );
}