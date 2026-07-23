import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import ContractCard from '@/components/contracts/ContractCard';
import TripFormSheet from '@/components/trips/TripFormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, FileText } from 'lucide-react';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useToast } from '@/components/ui/use-toast';

const STATUSES = ['all', 'active', 'expired', 'terminated'];

export default function Contracts() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editContract, setEditContract] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, exp] = await Promise.all([
        base44.entities.MonthlyContract.list('-created_date', 200).catch(() => []),
        base44.entities.ContractExpense.list('-created_date', 500).catch(() => []),
      ]);
      setContracts(list || []);
      setAllExpenses(exp || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const expensesByContract = useMemo(() => {
    const map = {};
    (allExpenses || []).forEach((e) => {
      if (!map[e.contract_id]) map[e.contract_id] = [];
      map[e.contract_id].push(e);
    });
    return map;
  }, [allExpenses]);

  const filtered = contracts.filter((c) => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.company_name?.toLowerCase().includes(q) ||
        c.vehicle_plate?.toLowerCase().includes(q) ||
        c.driver_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const openNew = () => { setEditContract(null); setFormOpen(true); };
  const openEdit = (c) => { setEditContract(c); setFormOpen(true); };

  const handleDelete = async (c) => {
    if (!confirm(`${t('delete')} "${c.company_name}"?`)) return;
    try {
      await base44.entities.ContractExpense.deleteMany({ contract_id: c.id }).catch(() => {});
      await base44.entities.MonthlyContract.delete(c.id);
      toast({ title: 'Contract deleted' });
      load();
    } catch {
      toast({ title: 'Could not delete contract', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PullToRefresh onRefresh={load}>
        <PageHeader
          title={t('contracts')}
          description={`${contracts.length} ${t('monthly_contract').toLowerCase()}`}
          action={
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90 h-10">
              <Plus className="w-4 h-4 mr-1.5" /> {t('new_contract')}
            </Button>
          }
        />

        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('search')}...`}
              className="w-full search-2026 rounded-xl px-3 pl-9 h-11 text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                  filter === s
                    ? 'bg-[rgba(59,130,246,0.20)] border-[rgba(59,130,246,0.30)] text-white shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                }`}>
                {s === 'all' ? 'All' : t(s)}
                {s !== 'all' && (
                  <span className="ml-1 opacity-60">{contracts.filter((c) => c.status === s).length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('no_data')}
            description="Create your first monthly contract to track rental profitability"
            action={
              <Button onClick={openNew} variant="outline" className="border-border">
                <Plus className="w-4 h-4 mr-1.5" /> {t('new_contract')}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                expenses={expensesByContract[c.id] || []}
                onEdit={() => openEdit(c)}
                onDelete={() => handleDelete(c)}
              />
            ))}
          </div>
        )}
      </PullToRefresh>

      <TripFormSheet
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditContract(null); } }}
        editContract={editContract}
        initialMode="contract"
        onSaved={load}
      />
    </div>
  );
}