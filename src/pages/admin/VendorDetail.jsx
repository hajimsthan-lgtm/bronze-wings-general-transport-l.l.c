import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Receipt, Wrench } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function VendorDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Vendor.get(id).then(async (v) => {
      if (cancelled) return;
      setVendor(v);
      setLoading(false);
      setDataLoading(true);
      try {
        const [eR, sR] = await Promise.all([
          base44.entities.Expense.filter({ vendor_name: v.name }).catch(() => []),
          base44.entities.ServiceRecord.filter({ vendor_name: v.name }).catch(() => []),
        ]);
        if (cancelled) return;
        setExpenses(eR || []);
        setServices(sR || []);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!vendor) return <EmptyState title="Vendor not found" />;

  const fExpenses = expenses.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fServices = services.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  return (
    <div className="detail-page">
      <EntityDetailHeader
        title={vendor.name}
        subtitle={vendor.contact_person}
        badge={<StatusBadge status={vendor.status} />}
        backTo="/admin/vendors"
        info={[
          { label: 'Category', value: vendor.category },
          { label: 'Email', value: vendor.email },
          { label: 'Phone', value: vendor.phone },
          { label: 'TRN', value: vendor.trn },
          { label: 'Address', value: vendor.address },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="services">{t('services')} ({fServices.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fExpenses.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)} · {rec.vehicle_plate || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.amount)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fServices.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fServices.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{rec.service_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.vehicle_plate || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.cost)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="vendor" entityId={vendor.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}