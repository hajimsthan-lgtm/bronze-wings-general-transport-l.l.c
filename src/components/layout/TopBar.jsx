import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import BreadcrumbBack from './BreadcrumbBack';
import HeaderActionButton from './HeaderActionButton';
import ClientNavDropdown from './ClientNavDropdown';
import DriverNavDropdown from './DriverNavDropdown';
import VehicleNavDropdown from './VehicleNavDropdown';
import ReportClientDropdown from './ReportClientDropdown';
import HeaderSubNav, { subNavMap, hasSubNavForPath } from './headerSubNav';
import OpsSubBar from '@/components/operations/OpsSubBar';
import MobileBulkActionsInline from '@/components/operations/MobileBulkActionsInline';
import { useMaintenanceMode, setMaintenanceMode, getMaintenanceData, useMaintenanceSelected, clearMaintenanceSelected } from '@/lib/maintenanceStore';
import { useFuelMode, setFuelMode, getFuelData, useFuelSelected, clearFuelSelected } from '@/lib/fuelStore';
import { useExpensesMode, setExpensesMode, getExpensesData, useExpensesSelected, clearExpensesSelected } from '@/lib/expensesStore';
import { useVehiclesMode, setVehiclesMode, setVehiclesView, getVehiclesFiltered, getVehiclesLoad, getVehiclesView } from '@/lib/vehiclesStore';
import { useDriversMode, setDriversMode, setDriversView, getDriversFiltered, getDriversLoad, getDriversView } from '@/lib/driversStore';
import { useClientsMode, setClientsMode, setClientsView, getClientsFiltered, getClientsLoad, getClientsView } from '@/lib/clientsStore';
import { useVendorsMode, setVendorsMode, useVendorsView, setVendorsView } from '@/lib/vendorsStore';
import { useInvoicesFilters, setInvoicesClientFilter, setInvoicesStatusFilter, clearInvoicesFilters } from '@/lib/invoicesStore';
import { useLedgerState, setLedgerMode, setLedgerView } from '@/lib/ledgerStore';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import ViewToggle from '@/components/common/ViewToggle';
import { BarChart3, LayoutGrid, Plus, Building2, LayoutTemplate, X, Fuel as FuelIcon, Wrench } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export { hasSubNavForPath };

export default function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isHome = location.pathname === '/';

  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  const isMaintenancePage = location.pathname === '/maintenance';
  const isFuelPage = location.pathname === '/fuel';
  const maintMode = useMaintenanceMode();
  const fuelMode = useFuelMode();
  const maintSelected = useMaintenanceSelected();
  const fuelSelected = useFuelSelected();
  const expSelected = useExpensesSelected();
  const isVehiclesPage = location.pathname === '/admin/vehicles';
  const vehMode = useVehiclesMode();
  const isDriversPage = location.pathname === '/admin/drivers';
  const drvMode = useDriversMode();
  const isClientsPage = location.pathname === '/admin/clients';
  const cliMode = useClientsMode();
  const isVendorsPage = location.pathname === '/admin/vendors';
  const venMode = useVendorsMode();
  const venView = useVendorsView();
  const isExpensesPage = location.pathname === '/expenses';
  const expMode = useExpensesMode();
  const isCompanyDocsPage = location.pathname === '/admin/company-documents';
  const isInvoicesPage = location.pathname === '/accounts/invoices';
  const invFilters = useInvoicesFilters();
  const isBankRecPage = location.pathname === '/reports/bank-reconciliation';
  const isPettyCashPage = location.pathname === '/accounts/petty-cash';
  const ledgerState = useLedgerState();

  return (
    <div className="hidden md:block sticky top-20 z-40">
      <div className="w-full px-4 md:px-6 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between py-2 gap-2 min-h-[54px]">
            {/* Status filter pills moved to OperationsToolbar (near search) */}
          {/* Left: back button + mobile sub-nav tiles */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <BreadcrumbBack disabled={isHome} />
            <HeaderSubNav className="flex md:hidden overflow-x-auto no-scrollbar flex-1 min-w-0 py-1" />
            
















            
            {isVendorsPage &&
            <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 ml-2">
                <button
                onClick={() => setVendorsView('all')}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${venView === 'all' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                
                  All Vendors
                </button>
                <button
                onClick={() => setVendorsView('providers')}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${venView === 'providers' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                
                  Service Providers
                </button>
              </div>
            }
            {isInvoicesPage &&
            <div className="hidden md:flex items-center gap-2 ml-2">
                {(invFilters.clientFilter !== 'all' || invFilters.statusFilter !== 'all') &&
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
                    {(invFilters.clientFilter !== 'all' ? 1 : 0) + (invFilters.statusFilter !== 'all' ? 1 : 0)} active
                    <button onClick={clearInvoicesFilters} className="ml-0.5 hover:opacity-70">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
              }
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
                  <Select value={invFilters.clientFilter} onValueChange={setInvoicesClientFilter}>
                    <SelectTrigger className="w-40 pl-8 h-9 text-xs bg-muted/40 border-border">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {(invFilters.clients || []).map((c) =>
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                    )}
                    </SelectContent>
                  </Select>
                </div>
                <Select value={invFilters.statusFilter} onValueChange={setInvoicesStatusFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs bg-muted/40 border-border">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="unsigned">Unsigned</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partially_paid">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
            {(location.pathname === '/trips' || location.pathname === '/contracts') && <OpsSubBar />}
            {(isBankRecPage || isPettyCashPage) && ledgerState.modeOptions?.length > 0 &&
            <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 ml-2">
                {ledgerState.modeOptions.map((o) =>
              <button
                key={o.value}
                onClick={() => setLedgerMode(o.value)}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${ledgerState.mode === o.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                
                    {o.label}
                  </button>
              )}
              </div>
            }
            {(isBankRecPage || isPettyCashPage) && ledgerState.viewOptions?.length > 0 &&
            <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 ml-2">
                {ledgerState.viewOptions.map((o) =>
              <button
                key={o.value}
                onClick={() => setLedgerView(o.value)}
                className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${ledgerState.view === o.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                
                    {o.label}
                  </button>
              )}
              </div>
            }
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <div className="md:hidden flex items-center gap-2">
              {(location.pathname.startsWith('/trips') || location.pathname.startsWith('/contracts')) && <MobileBulkActionsInline />}
              {(location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/vendors')) && <ClientNavDropdown />}
              {location.pathname.startsWith('/admin/vehicles') && <VehicleNavDropdown />}
              {location.pathname.startsWith('/admin/drivers') && <DriverNavDropdown />}
            </div>
            {location.pathname.startsWith('/reports/') && <ReportClientDropdown />}
            {(location.pathname === '/trips' || location.pathname === '/contracts') &&
            <HeaderActionButton
              label={t('new_trip')}
              variant="trip"
              onClick={() => window.dispatchEvent(new CustomEvent('ops:new-trip'))} />

            }
            {isExpensesPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setExpensesMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${expMode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setExpensesMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${expMode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {expSelected.length > 0 &&
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{expSelected.length} selected</span>
                    <button onClick={clearExpensesSelected} className="text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                  </div>
              }
                <ExportButtons data={expSelected.length > 0 ? getExpensesData().filter((e) => expSelected.includes(e.id)) : getExpensesData()} filename="expenses" title="Expenses" columns={[{ label: 'Date', key: 'date' }, { label: 'Category', key: 'category' }, { label: 'Description', key: 'description' }, { label: 'Amount', key: 'amount' }, { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' }, { label: 'Vendor', key: 'vendor_name' }, { label: 'Status', key: 'status' }]} />
                <HeaderActionButton
                label={t('add_new')}
                variant="expense"
                onClick={() => window.dispatchEvent(new CustomEvent('expenses:new'))} />
              
              </>
            }
            {(location.pathname === '/admin/salary' || location.pathname === '/salary') &&
            <HeaderActionButton
              label={t('add_new')}
              variant="trip"
              onClick={() => window.dispatchEvent(new CustomEvent('salary:new'))} />

            }
            {isFuelPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setFuelMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${fuelMode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setFuelMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${fuelMode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {fuelSelected.length > 0 &&
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{fuelSelected.length} selected</span>
                    <button onClick={clearFuelSelected} className="text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                  </div>
              }
                <ExportButtons data={fuelSelected.length > 0 ? getFuelData().filter((r) => fuelSelected.includes(r.id)) : getFuelData()} filename="fuel_records" title="Fuel Records" columns={[{ label: 'Date', key: 'date' }, { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' }, { label: 'Liters', key: 'liters' }, { label: 'Price/L', key: 'price_per_liter' }, { label: 'Total', key: 'total_cost' }, { label: 'Fuel Type', key: 'fuel_type' }, { label: 'Payment', key: 'payment_method' }, { label: 'Station', key: 'station_name' }, { label: 'Odometer', key: 'odometer_reading' }]} />
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('fuel:new'))} />
              
              </>
            }
            {isMaintenancePage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setMaintenanceMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${maintMode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setMaintenanceMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${maintMode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {maintSelected.length > 0 &&
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-xs font-semibold text-primary">{maintSelected.length} selected</span>
                    <button onClick={clearMaintenanceSelected} className="text-xs text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
                  </div>
              }
                <ExportButtons data={maintSelected.length > 0 ? getMaintenanceData().filter((r) => maintSelected.includes(r.id)) : getMaintenanceData()} filename="maintenance" title="Maintenance Records" columns={[{ label: 'Date', key: 'date' }, { label: 'Type', key: 'service_type' }, { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' }, { label: 'Vendor', key: 'vendor_name' }, { label: 'Cost', key: 'cost', numeric: true }, { label: 'VAT', key: 'vat_amount', numeric: true }, { label: 'Total', key: 'total_with_vat', numeric: true }, { label: 'Status', key: 'status' }]} />
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('maintenance:new'))} />
              
              </>
            }
            {isVehiclesPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setVehiclesMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${vehMode.mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setVehiclesMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${vehMode.mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {vehMode.mode === 'browse' &&
              <ViewToggle view={getVehiclesView()} onChange={setVehiclesView} />
              }
                <CsvImportButton entityName="Vehicle" filename="vehicles" onImported={() => getVehiclesLoad()?.()} columns={[
              { key: 'plate_number', label: 'Plate Number', sample: 'AD-1-12345' },
              { key: 'make', label: 'Make', sample: 'Mitsubishi' },
              { key: 'model', label: 'Model', sample: 'Fuso' },
              { key: 'year', label: 'Year', sample: '2022' },
              { key: 'type', label: 'Type', sample: 'truck' },
              { key: 'status', label: 'Status', sample: 'active' },
              { key: 'assigned_driver', label: 'Driver', sample: 'Ahmed Ali' },
              { key: 'registration_expiry', label: 'Reg Expiry', sample: '2026-12-31' },
              { key: 'insurance_expiry', label: 'Ins Expiry', sample: '2026-12-31' },
              { key: 'fuel_type', label: 'Fuel', sample: 'diesel' }]
              } transform={(r) => ({
                plate_number: r.plate_number || r.Plate || '',
                make: r.make || r.Make || '',
                model: r.model || r.Model || '',
                year: r.year || r.Year ? Number(r.year || r.Year) : undefined,
                type: r.type || r.Type || 'truck',
                status: r.status || r.Status || 'active',
                assigned_driver: r.assigned_driver || r.Driver || '',
                registration_expiry: r.registration_expiry || r['Reg Expiry'] || '',
                insurance_expiry: r.insurance_expiry || r['Ins Expiry'] || '',
                fuel_type: r.fuel_type || r.Fuel || 'diesel'
              })} />
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('vehicles:new'))} />
              
              </>
            }
            {isDriversPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setDriversMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${drvMode.mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setDriversMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${drvMode.mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {drvMode.mode === 'browse' &&
              <ViewToggle view={getDriversView()} onChange={setDriversView} />
              }
                <ExportButtons data={getDriversFiltered().map((d) => ({ name: d.name, phone: d.phone, email: d.email, license_number: d.license_number, license_expiry: d.license_expiry, nationality: d.nationality, status: d.status, assigned_vehicle: d.assigned_vehicle, base_salary: d.base_salary }))} filename="drivers" title="Drivers" columns={[{ label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' }, { label: 'License #', key: 'license_number' }, { label: 'License Expiry', key: 'license_expiry' }, { label: 'Nationality', key: 'nationality' }, { label: 'Status', key: 'status' }, { label: 'Vehicle', key: 'assigned_vehicle' }, { label: 'Base Salary', key: 'base_salary' }]} />
                <CsvImportButton entityName="Driver" filename="drivers" onImported={() => getDriversLoad()?.()} columns={[
              { key: 'name', label: 'Name', sample: 'Ahmed Ali' },
              { key: 'phone', label: 'Phone', sample: '+971501234567' },
              { key: 'email', label: 'Email', sample: 'ahmed@example.com' },
              { key: 'license_number', label: 'License #', sample: 'DL-12345' },
              { key: 'license_expiry', label: 'License Expiry', sample: '2027-06-15' },
              { key: 'nationality', label: 'Nationality', sample: 'UAE' },
              { key: 'status', label: 'Status', sample: 'active' },
              { key: 'assigned_vehicle', label: 'Vehicle', sample: 'AD-1-12345' },
              { key: 'base_salary', label: 'Base Salary', sample: '3500' }]
              } transform={(r) => ({
                name: r.name || r.Name || '',
                phone: r.phone || r.Phone || '',
                email: r.email || r.Email || '',
                license_number: r.license_number || r['License #'] || '',
                license_expiry: r.license_expiry || r['License Expiry'] || '',
                nationality: r.nationality || r.Nationality || '',
                status: r.status || r.Status || 'active',
                assigned_vehicle: r.assigned_vehicle || r.Vehicle || '',
                base_salary: Number(r.base_salary || r['Base Salary']) || 0
              })} />
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('drivers:new'))} />
              
              </>
            }
            {isClientsPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setClientsMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${cliMode.mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setClientsMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${cliMode.mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                {cliMode.mode === 'browse' &&
              <ViewToggle view={getClientsView()} onChange={setClientsView} />
              }
                <ExportButtons data={getClientsFiltered().map((c) => ({ name: c.name, contact: c.contact_person, email: c.email, phone: c.phone, trn: c.trn, status: c.status }))} filename="clients" title="Clients" columns={[{ label: 'Name', key: 'name' }, { label: 'Contact', key: 'contact' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'TRN', key: 'trn' }, { label: 'Status', key: 'status' }]} />
                <CsvImportButton entityName="Client" filename="clients" onImported={() => getClientsLoad()?.()} columns={[
              { key: 'name', label: 'Name', sample: 'ABC Transport LLC' },
              { key: 'contact_person', label: 'Contact Person', sample: 'John Doe' },
              { key: 'email', label: 'Email', sample: 'info@abctransport.com' },
              { key: 'phone', label: 'Phone', sample: '+97141234567' },
              { key: 'address', label: 'Address', sample: 'Dubai, UAE' },
              { key: 'trn', label: 'TRN', sample: '100123456700003' },
              { key: 'status', label: 'Status', sample: 'active' },
              { key: 'payment_terms', label: 'Payment Terms', sample: 'Net 30' }]
              } transform={(r) => ({
                name: r.name || r.Name || '',
                contact_person: r.contact_person || r['Contact Person'] || '',
                email: r.email || r.Email || '',
                phone: r.phone || r.Phone || '',
                address: r.address || r.Address || '',
                trn: r.trn || r.TRN || '',
                status: r.status || r.Status || 'active',
                payment_terms: r.payment_terms || r['Payment Terms'] || 'Net 30'
              })} />
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('clients:new'))} />
              
              </>
            }
            {isVendorsPage &&
            <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setVendorsMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${venMode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setVendorsMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${venMode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent(venView === 'all' ? 'vendors:new' : 'service-providers:new'))} />
              
              </>
            }
            {isCompanyDocsPage &&
            <HeaderActionButton
              label="Add Document"
              variant="trip"
              onClick={() => window.dispatchEvent(new CustomEvent('company-docs:new'))} />

            }
            {isInvoicesPage &&
            <>
                <button
                onClick={() => window.dispatchEvent(new CustomEvent('invoices:templates'))}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                title="Custom Templates">
                
                  <LayoutTemplate className="w-4 h-4" />
                </button>
                <HeaderActionButton
                label="Create Invoice"
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('invoices:new'))} />
              
              </>
            }
          </div>
        </div>

      </div>
    </div>);

}