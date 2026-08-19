import { useState } from 'react';
import { Mailbox, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import GmailIcon from '@/components/icons/GmailIcon';
import { shareDocWithFile, downloadDocFile } from '@/lib/docShare';

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
      `Please find attached Invoice ${doc.invoice_number || '—'} issued by ${company}.\n\n` +
      `Invoice Details:\n` +
      `- Invoice No: ${doc.invoice_number || '—'}\n` +
      `- Issue Date: ${fmtDate(doc.issue_date)}\n` +
      `- Due Date: ${fmtDate(doc.due_date)}\n` +
      `- Total Amount: AED ${fmtMoney(total)}\n` +
      `- Amount Paid: AED ${fmtMoney(paid)}\n` +
      `- Balance Due: AED ${fmtMoney(balance)}\n\n` +
      `Kindly review the attached invoice PDF and arrange the payment at your earliest convenience.\n\n` +
      `Should you have any questions, feel free to contact us${phone ? ` at ${phone}` : ''}${email ? ` or ${email}` : ''}.\n\n` +
      `Best regards,\n${company}`;
  } else if (type === 'quotation') {
    const total = Number(doc.total_amount || 0);
    subject = `Quotation ${doc.quotation_number || ''} – ${company}`;
    body =
      `Dear ${client},\n\n` +
      `Thank you for your interest. Please find attached Quotation ${doc.quotation_number || '—'} prepared by ${company}.\n\n` +
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
      `Please find attached Agreement ${doc.agreement_number || '—'} from ${company}.\n\n` +
      `Agreement Details:\n` +
      `- Agreement No: ${doc.agreement_number || '—'}\n` +
      `- Title: ${doc.title || '—'}\n` +
      `- Type: ${doc.agreement_type || 'service'}\n` +
      `- Start Date: ${fmtDate(doc.start_date)}\n` +
      `- End Date: ${fmtDate(doc.end_date)}\n` +
      `- Contract Value: AED ${fmtMoney(amount)}\n\n` +
      `Kindly review the attached agreement PDF and return a signed copy at your earliest convenience.\n\n` +
      `For any clarification, please contact us${phone ? ` at ${phone}` : ''}${email ? ` or ${email}` : ''}.\n\n` +
      `Best regards,\n${company}`;
  }

  return { to, subject, body, mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}

function buildGmailLink({ to, subject, body }) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function EmailShareButton({
  doc,
  type,
  settings,
  variant = 'icon',
  className = '',
  title = 'Share via Email',
}) {
  const [busy, setBusy] = useState(false);
  if (!doc) return null;
  const parts = buildEmailLink(doc, type, settings);

  const openMailApp = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      // Try the native share sheet (attaches the PDF) first; fall back to
      // downloading the PDF + opening the mail app with a pre-filled message.
      const shared = await shareDocWithFile(doc, type, settings, {
        text: parts.body,
        title: parts.subject,
      });
      if (!shared) {
        window.location.href = parts.mailto;
      }
    } finally {
      setBusy(false);
    }
  };

  const openGmail = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      // Gmail Web cannot accept a local file via URL, so download the PDF
      // for manual attachment, then open the compose window pre-filled.
      await downloadDocFile(doc, type, settings);
      window.open(buildGmailLink(parts), '_blank', 'noopener,noreferrer');
    } finally {
      setBusy(false);
    }
  };

  const triggerClass =
    variant === 'card'
      ? 'inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/50 bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0'
      : `w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex-shrink-0 ${className}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" title={title} className={triggerClass} onClick={(e) => e.stopPropagation()} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GmailIcon size={variant === 'card' ? 14 : 16} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>Send via</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openMailApp} className="cursor-pointer">
          <Mailbox className="w-4 h-4" />
          <span>Mail App (with PDF)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={openGmail} className="cursor-pointer">
          <GmailIcon size={16} />
          <span>Gmail (Web)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}