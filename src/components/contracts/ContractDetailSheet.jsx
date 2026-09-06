import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Pencil, Trash2, Building2, User, Truck, Calendar, Repeat, DollarSign, FileText } from 'lucide-react';
import { generateNextInvoiceNumber } from '@/lib/invoiceSequence';
import { calculateContractBilling, buildContractInvoiceLineItems, getContractRate, hasUsageData } from '@/lib/contractCalculator';

export default function ContractDetailSheet({ contract, expenses = [], onClose, onEdit, onDelete, onInvoiceCreated }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  if (!contract) return null;

  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthlyRate = getContractRate(contract);
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(contract);
    setDeleting(false);
  };

  const handleCreateInvoice = async () => {
    if (!hasUsageData(contract)) {
      toast({ title: t('no_usage_logged') || 'No usage logged', description: t('no_usage_logged_help') || 'Use Fill Remaining Days or log actual usage first', variant: 'destructive' });
      return;
    }
    setInvoicing(true);
    try {
      const calc = calculateContractBilling(contract);
      const subtotal = calc.total;
      const vatAmount = Math.round(subtotal * 0.05 * 100) / 100;
      const total = Math.round((subtotal + vatAmount) * 100) / 100;
      const now = new Date();
      const due = new Date(now); due.setDate(due.getDate() + 30);
      const invNo = await generateNextInvoiceNumber();
      let clientData = {};
      try {
        const clients = await base44.entities.Client.filter({ name: contract.company_name });
        clientData = clients?.[0] || {};
      } catch (e) {}
      const driver = (contract.driver_name || '').trim();
      const lineItems = buildContractInvoiceLineItems(contract, calc, contract.vehicle_plate || 'Vehicle', driver);
      await base44.entities.Invoice.create({
        invoice_number: invNo,
        client_name: contract.company_name,
        contact_person: clientData.contact_person || '',
        client_address: clientData.address || '',
        client_trn: clientData.trn || '',
        sub: contract.notes || '',
        reg_no: contract.vehicle_plate || '',
        issue_date: now.toISOString().split('T')[0],
        due_date: due.toISOString().split('T')[0],
        line_items: lineItems,
        subtotal,
        vat_rate: 5,
        vat_amount: vatAmount,
        total_amount: total,
        paid_amount: 0,
        status: 'draft',
      });
      toast({ title: t('invoice_created') || 'Invoice created' });
      onInvoiceCreated?.();
    } catch {
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setInvoicing(false);
    }
  };

  return (
    <Sheet open={!!contract} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-display text-foreground">{t('monthly_contract')}</SheetTitle>
            <StatusBadge status={contract.status} />
          </div>
        </SheetHeader>

        <div className="glass-card p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.14)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{contract.company_name || '—'}</p>
              <p className="text-xs text-muted-foreground font-mono">#{contract.id?.slice(-6).toUpperCase()}</p>
            </div>
            {contract.auto_renewal && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] whitespace-nowrap">
                <Repeat className="w-3 h-3" /> Auto
              </span>
            )}
          </div>
        </div>

        <div className="glass-card p-4 mb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-violet-400" /> Period
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground tabular-nums">{formatDate(contract.start_date)}</span>
            <span className="text-muted-foreground">→</span>
            <span className="text-sm text-foreground tabular-nums">{formatDate(contract.end_date)}</span>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <DetailRow icon={User} label={t('driver')} value={contract.driver_name || '—'} />
          <DetailRow icon={Truck} label={t('vehicle')} value={contract.vehicle_plate || '—'} />
          <DetailRow icon={DollarSign} label={t('monthly_rental')} value={formatCurrency(monthlyRate)} />
        </div>

        <div className="glass-card p-4 mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Profitability</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('total_expenses')}</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('net_profit')}</p>
              <p className={`text-sm font-semibold tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('profit_margin')}</p>
              <p className={`text-sm font-semibold tabular-nums ${margin >= 30 ? 'text-emerald-400' : margin >= 15 ? 'text-amber-400' : 'text-red-400'}`}>{margin}%</p>
            </div>
          </div>
        </div>

        {expenses.length > 0 && (
          <div className="glass-card p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('expenses')}</h3>
            <div className="space-y-2">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="text-foreground truncate">{e.description || e.category?.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDate(e.date)}</p>
                  </div>
                  <span className="text-foreground tabular-nums flex-shrink-0 ml-2">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {contract.notes && (
          <div className="glass-card p-4 mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t('notes')}</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{contract.notes}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleCreateInvoice} disabled={invoicing || monthlyRate <= 0} className="flex-1 border-border">
            <FileText className="w-4 h-4 mr-1.5" /> {invoicing ? t('loading') : (t('create_invoice') || 'Invoice')}
          </Button>
          <Button variant="outline" onClick={() => onEdit(contract)} className="flex-1 border-border">
            <Pencil className="w-4 h-4 mr-1.5" /> {t('edit')}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                  {deleting ? t('loading') : t('delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}