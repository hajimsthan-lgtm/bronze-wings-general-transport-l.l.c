export default function InvoiceTabs({ tab, setTab, counts }) {
  const tabs = [
    { key: 'all', label: 'All Invoices', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'unpaid', label: 'Unpaid', count: counts.unpaid },
  ];
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === t.key ? 'bg-[#A6FF00] text-black' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.label}{' '}
          <span className={tab === t.key ? 'text-black/70' : 'text-slate-400'}>
            ({t.count})
          </span>
        </button>
      ))}
    </div>
  );
}