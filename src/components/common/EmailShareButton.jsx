import { Mail } from 'lucide-react';

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

/**
 * Builds a mailto link with a short subject and a specific description
 * for invoices, quotations, and agreements.
 */
export function buildEmailLink(doc, type, settings) {
  const company = settings?.company_name || DEFAULT_COMPANY;
  const client = doc.client_name || 'Client';
  const to = doc.client_email || '';
  const phone = settings?.phone1 || '';
  const email = settings?.email || '';

  let subject = '';
  let body = '';

  if (type === 'invoice') {
    const total = Number(doc.total_amount || 0);
    const paid = Number(doc.paid_amount || 0);
    const balance = Math.max(0, total - paid);
    subject = `Invoice ${doc.invoice_number || ''} – ${company}`;
    body =
      `Dear ${client},\n\n` +
      `Please find below the details of Invoice ${doc.invoice_number || '—'} issued by ${company}.\n\n` +
      `Invoice Details:\n` +
      `- Invoice No: ${doc.invoice_number || '—'}\n` +
      `- Issue Date: ${fmtDate(doc.issue_date)}\n` +
      `- Due Date: ${fmtDate(doc.due_date)}\n` +
      `- Total Amount: AED ${fmtMoney(total)}\n` +
      `- Amount Paid: AED ${fmtMoney(paid)}\n` +
      `- Balance Due: AED ${fmtMoney(balance)}\n\n` +
      `Kindly review the invoice and arrange the payment at your earliest convenience. ` +
      `The signed copy is attached for your records.\n\n` +
      `Should you have any questions, feel free to contact us${phone ? ` at ${phone}` : ''}${email ? ` or ${email}` : ''}.\n\n` +
      `Best regards,\n${company}`;
  } else if (type === 'quotation') {
    const total = Number(doc.total_amount || 0);
    subject = `Quotation ${doc.quotation_number || ''} – ${company}`;
    body =
      `Dear ${client},\n\n` +
      `Thank you for your interest. Please find below the details of Quotation ${doc.quotation_number || '—'} prepared by ${company}.\n\n` +
      `Quotation Details:\n` +
      `- Quotation No: ${doc.quotation_number || '—'}\n` +
      `- Date: ${fmtDate(doc.issue_date)}\n` +
      `- Valid Until: ${fmtDate(doc.valid_until)}\n` +
      `- Subject: ${doc.subject || '—'}\n` +
      `- Total Amount: AED ${fmtMoney(total)}\n\n` +
      `We look forward to your favorable response. The quotation is valid until the date mentioned above.\n\n` +
      `For any queries, please contact us${phone ? ` at ${phone}` : ''}${email ? ` or ${email}` : ''}.\n\n` +
      `Best regards,\n${company}`;
  } else {
    // agreement
    const amount = Number(doc.amount || 0);
    subject = `Agreement ${doc.agreement_number || ''} – ${company}`;
    body =
      `Dear ${client},\n\n` +
      `Please find below the details of Agreement ${doc.agreement_number || '—'} from ${company}.\n\n` +
      `Agreement Details:\n` +
      `- Agreement No: ${doc.agreement_number || '—'}\n` +
      `- Title: ${doc.title || '—'}\n` +
      `- Type: ${doc.agreement_type || 'service'}\n` +
      `- Start Date: ${fmtDate(doc.start_date)}\n` +
      `- End Date: ${fmtDate(doc.end_date)}\n` +
      `- Contract Value: AED ${fmtMoney(amount)}\n\n` +
      `Kindly review the agreement and return a signed copy at your earliest convenience.\n\n` +
      `For any clarification, please contact us${phone ? ` at ${phone}` : ''}${email ? ` or ${email}` : ''}.\n\n` +
      `Best regards,\n${company}`;
  }

  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function EmailShareButton({
  doc,
  type,
  settings,
  variant = 'icon',
  className = '',
  title = 'Share via Email',
}) {
  if (!doc) return null;
  const href = buildEmailLink(doc, type, settings);

  const openMail = (e) => {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = href;
  };

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={openMail}
        title={title}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0"
      >
        <Mail className="w-3.5 h-3.5" />
      </button>
    );
  }

  // icon (default) — matches the download button in detail panes
  return (
    <button
      type="button"
      onClick={openMail}
      title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0 ${className}`}
    >
      <Mail className="w-4 h-4" />
    </button>
  );
}