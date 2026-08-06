import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import CollapsibleSection from '@/components/common/CollapsibleSection';
import ContractDetailSheet from '@/components/contracts/ContractDetailSheet';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FileText, Calendar } from 'lucide-react';

export default function ContractsSection({ filter, title, onInvoiceCreated }) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      base44.entities.MonthlyContract.filter(filter).catch(() => []),
      base44.entities.ContractExpense.list('-created_date', 500).catch(() => []),
    ]).then(([c, e]) => {
      if (cancelled) return;
      setContracts(c || []);
      setExpenses(e || []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [JSON.stringify(filter)]);

  const expensesByContract = {};
  (expenses || []).forEach((e) => {
    if (!expensesByContract[e.contract_id]) expensesByContract[e.contract_id] = [];
    expensesByContract[e.contract_id].push(e);
  });

  const handleDelete = async (c) => {
    await base44.entities.ContractExpense.deleteMany({ contract_id: c.id }).catch(() => {});
    await base44.entities.MonthlyContract.delete(c.id);
    setDetail(null);
    setContracts((prev) => prev.filter((x) => x.id !== c.id));
  };

  return (
    <CollapsibleSection title={title || t('monthly_contract')} icon={FileText} accent="#a855f7" count={contracts.length}>
      {loading ? (
        <LoadingSpinner />
      ) : contracts.length === 0 ? (
        <EmptyState icon={FileText} title={t('no_data')} />
      ) : (
        <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
          {contracts.map((c) => {
            const exp = expensesByContract[c.id] || [];
            const totalExp = exp.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const net = (Number(c.monthly_rate) || 0) - totalExp;
            return (
              <div key={c.id} className="row-card flex items-center gap-3 cursor-pointer" onClick={() => setDetail(c)}>
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(var(--panel-accent-rgb),0.35)' }}>
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.company_name || '—'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    {formatDate(c.start_date)} → {formatDate(c.end_date)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(c.monthly_rate)}</p>
                  <p className={`text-[10px] tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Net {formatCurrency(net)}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            );
          })}
        </div>
      )}

      <ContractDetailSheet
        contract={detail}
        expenses={detail ? (expensesByContract[detail.id] || []) : []}
        onClose={() => setDetail(null)}
        onEdit={(c) => { setDetail(null); navigate('/contracts'); }}
        onDelete={handleDelete}
        onInvoiceCreated={onInvoiceCreated}
      />
    </CollapsibleSection>
  );
}