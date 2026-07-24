import { BookOpen, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

const MANUAL = [
  { h: 'Overview', body: 'Bronze Wings General Transport is an all-in-one transport management system. It helps you track trips, monthly contracts, expenses, invoices, payments, vehicles, drivers, clients and vendors, plus daily and financial reports — all from a single dashboard.' },
  { h: 'Dashboard', body: 'The Dashboard gives you a live snapshot: total revenue, trips, fleet utilization, on-time delivery, pending customers and recent activity. Use the quick actions to create a new trip or record an expense. Pull down on mobile to refresh.' },
  { h: 'Operations — Trips', body: 'Open Operations to manage trips. Use the mode chips to switch between All, Trips and Monthly Contracts. Filter by status and search by route, driver, vehicle or client. Tap any trip to open its detail sheet where you can edit, change status, mark an invoice sent, or delete. Use the New button to create a trip.' },
  { h: 'Operations — Monthly Contracts', body: 'Monthly Contracts track recurring rental agreements. Each contract shows the monthly rate, total expenses and net margin. Tap a contract to view its expense breakdown. Use the 3-dot menu on a contract row to edit or delete it.' },
  { h: 'Expenses', body: 'Record fuel, maintenance, tolls, salary, insurance, registration and other expenses. Link an expense to a vehicle and driver for accurate per-vehicle cost tracking. Filter by category and date range.' },
  { h: 'Reports', body: 'Reports include the Daily Report, Profit & Loss and Statement of Account. Filter by date range and export to CSV or PDF for sharing or archiving.' },
  { h: 'Admin — Vehicles, Drivers, Clients, Vendors', body: 'Manage your master records under Admin. Add vehicles with plate, type, registration and insurance expiry; drivers with license and visa details; clients with contact persons and payment terms; vendors by category. Each record has its own detail page.' },
  { h: 'Admin — Documents', body: 'Upload and track vehicle and contract documents (registration, insurance, licenses, permits). Documents nearing expiry are flagged so you can renew on time.' },
  { h: 'Invoices & Payments', body: 'Create invoices from completed trips, apply VAT, and track payment status (draft, sent, paid, partially paid, overdue). Record client payments and allocate them across invoices. Customer advances can be held and applied to future transactions.' },
  { h: 'Settings', body: 'Update your company profile (name, address, TRN, logo, invoice prefix and default VAT), your personal profile, language (English / Arabic) and security. Company settings drive your invoice branding.' },
  { h: 'Permissions', body: 'Regular users can create and manage their own records. Admins can see and manage everything. If a record you expect is missing, check with an admin or confirm the active filter and date range.' },
];

export default function UserManualCard() {
  const download = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 48;
    let y = 60;

    const ensure = (need) => { if (y + need > H - M) { doc.addPage(); y = M; } };
    const para = (text, { size = 10.5, bold = false, color = [40, 40, 50], gap = 8 } = {}) => {
      doc.setFontSize(size);
      doc.setFont(undefined, bold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(text, W - M * 2);
      lines.forEach((l) => { ensure(size + 4); doc.text(l, M, y); y += size + 4; });
      y += gap;
    };

    doc.setFontSize(22); doc.setFont(undefined, 'bold'); doc.setTextColor(20, 24, 38);
    doc.text('Bronze Wings — User Manual', M, y); y += 10;
    doc.setDrawColor(59, 130, 246); doc.setLineWidth(2); doc.line(M, y, M + 120, y); y += 22;
    para('General Transport Management System  ·  v1.0', { size: 10, color: [120, 120, 130], gap: 16 });

    MANUAL.forEach((s) => {
      para(s.h, { size: 13, bold: true, color: [37, 99, 235], gap: 4 });
      para(s.body, { size: 10.5, gap: 14 });
    });

    para('Need help? Contact your system administrator.', { size: 9, color: [120, 120, 130], gap: 0 });
    doc.save('Bronze-Wings-User-Manual.pdf');
  };

  return (
    <div className="glass-card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="hud-icon-tile w-10 h-10 flex-shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg">User Manual</h3>
          <p className="text-sm text-white/50 mt-0.5">Download a PDF guide covering every module — dashboard, operations, expenses, reports, admin and settings.</p>
        </div>
      </div>
      <button onClick={download} className="clay-btn mt-4 w-full md:w-auto inline-flex items-center gap-2">
        <Download className="w-4 h-4" /> Download PDF
      </button>
    </div>
  );
}