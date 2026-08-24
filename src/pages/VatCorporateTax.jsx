import { useState, useEffect, useMemo } from 'react';
import { Landmark, FileText, Download, Info } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import {
  loadTaxData,
  loadFiledRecords,
  computeVatForPeriod,
  computeVatTrend,
  computeCorporateTax,
  getCurrentVatPeriod,
  getCurrentFiscalYear,
  generateFilingPeriods,
  getFilingStatus,
} from '@/lib/taxCalculations';
import { exportVat201PDF, exportTaxReportPDF } from '@/lib/taxPdf';
import VatOverviewTab from '@/components/tax/VatOverviewTab';
import VatTab from '@/components/tax/VatTab';
import CorporateTaxTab from '@/components/tax/CorporateTaxTab';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'vat', label: 'VAT' },
  { value: 'corporate', label: 'Corporate Tax' },
];

export default function VatCorporateTax() {
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [filedRecords, setFiledRecords] = useState([]);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([loadTaxData(), loadFiledRecords()])
      .then(([data, filed]) => {
        if (!mounted) return;
        setInvoices(data.invoices);
        setExpenses(data.expenses);
        setFiledRecords(filed);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const vatPeriod = useMemo(() => getCurrentVatPeriod(), []);
  const fy = useMemo(() => getCurrentFiscalYear(), []);

  const vatData = useMemo(
    () => computeVatForPeriod(invoices, expenses, vatPeriod.start, vatPeriod.end),
    [invoices, expenses, vatPeriod]
  );

  const ctData = useMemo(
    () => computeCorporateTax(invoices, expenses, fy.start, fy.end),
    [invoices, expenses, fy]
  );

  const trend = useMemo(
    () => computeVatTrend(invoices, expenses),
    [invoices, expenses]
  );

  const filings = useMemo(() => {
    const periods = generateFilingPeriods();
    return periods.map((p) => ({
      ...p,
      _status: getFilingStatus(p, filedRecords),
    }));
  }, [filedRecords]);

  const daysUntilVatDue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return Math.ceil((new Date(vatPeriod.due) - new Date(today)) / (1000 * 60 * 60 * 24));
  }, [vatPeriod]);

  const daysUntilCtDue = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return Math.ceil((new Date(fy.due) - new Date(today)) / (1000 * 60 * 60 * 24));
  }, [fy]);

  const handleExportVat = async () => {
    setExporting('vat');
    try {
      await exportVat201PDF(vatData, vatPeriod);
    } finally {
      setExporting(null);
    }
  };

  const handleExportCt = async () => {
    setExporting('ct');
    try {
      await exportTaxReportPDF(ctData, fy);
    } finally {
      setExporting(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        icon={Landmark}
        title="VAT & Corporate Tax"
        description="Filing status, liability tracking & FTA compliance"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportVat}
              disabled={exporting !== null}
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
            >
              <FileText className="w-4 h-4" />
              {exporting === 'vat' ? 'Exporting...' : 'Export VAT201'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCt}
              disabled={exporting !== null}
              className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50"
            >
              <Download className="w-4 h-4" />
              {exporting === 'ct' ? 'Exporting...' : 'Export tax report'}
            </Button>
          </div>
        }
      />

      {/* Left-aligned pill segmented control */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`sub-tab ${active ? 'sub-tab-active' : ''}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <VatOverviewTab
          vatData={vatData}
          ctData={ctData}
          vatPeriod={vatPeriod}
          fy={fy}
          filings={filings}
          filedRecords={filedRecords}
          daysUntilVatDue={daysUntilVatDue}
          daysUntilCtDue={daysUntilCtDue}
        />
      )}
      {tab === 'vat' && <VatTab vatData={vatData} trend={trend} />}
      {tab === 'corporate' && <CorporateTaxTab ctData={ctData} />}
    </div>
  );
}