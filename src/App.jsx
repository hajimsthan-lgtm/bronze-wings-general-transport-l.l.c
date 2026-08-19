import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { TabHistoryProvider } from '@/lib/TabHistoryContext';
import { GlobalDateProvider } from '@/lib/GlobalDateContext';
import { TourProvider } from '@/lib/tour';
import GuidedTour from '@/components/tour/GuidedTour';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages — code-split for smaller initial bundle on mobile WebView
import { lazy, Suspense, useEffect } from 'react';
import RouteProgress from '@/components/common/RouteProgress';
import { prefetchRoutes } from '@/lib/prefetchRoutes';
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Operations = lazy(() => import('@/pages/Operations'));
const Expenses = lazy(() => import('@/pages/Expenses'));
const DailyReport = lazy(() => import('@/pages/DailyReport'));
const ProfitLoss = lazy(() => import('@/pages/ProfitLoss'));
const Soa = lazy(() => import('@/pages/Soa'));
const BankReconciliation = lazy(() => import('@/pages/BankReconciliation'));
const PettyCash = lazy(() => import('@/pages/Cash'));
const Fuel = lazy(() => import('@/pages/Fuel'));
const Vehicles = lazy(() => import('@/pages/admin/Vehicles'));
const Drivers = lazy(() => import('@/pages/admin/Drivers'));
const Clients = lazy(() => import('@/pages/admin/Clients'));

const Documents = lazy(() => import('@/pages/admin/Documents'));
const Salary = lazy(() => import('@/pages/admin/Salary'));
const Maintenance = lazy(() => import('@/pages/admin/Services'));
const VehicleDetail = lazy(() => import('@/pages/admin/VehicleDetail'));
const DriverDetail = lazy(() => import('@/pages/admin/DriverDetail'));
const ClientDetail = lazy(() => import('@/pages/admin/ClientDetail'));
const VendorDetail = lazy(() => import('@/pages/admin/VendorDetail'));
const Vendors = lazy(() => import('@/pages/admin/Vendors'));
const CompanyDocuments = lazy(() => import('@/pages/admin/CompanyDocuments'));
const ServiceProviderDetail = lazy(() => import('@/pages/admin/ServiceProviderDetail'));
const Settings = lazy(() => import('@/pages/Settings'));
const PromptGenerator = lazy(() => import('@/pages/PromptGenerator'));
const Agents = lazy(() => import('@/pages/Agents'));
const Quotations = lazy(() => import('@/pages/Quotations'));
const Agreements = lazy(() => import('@/pages/Agreements'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/command-center" element={<Navigate to="/" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<Operations />} />
          <Route path="/contracts" element={<Operations />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports/daily" element={<DailyReport />} />
          <Route path="/reports/pnl" element={<ProfitLoss />} />
          <Route path="/reports/soa" element={<Soa />} />
          <Route path="/reports/bank-reconciliation" element={<BankReconciliation />} />
          <Route path="/accounts/petty-cash" element={<PettyCash />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/accounts/quotations" element={<Quotations />} />
          <Route path="/accounts/agreements" element={<Agreements />} />
          <Route path="/accounts/invoices" element={<InvoicesPage />} />
          <Route path="/admin/vehicles" element={<Vehicles />} />
          <Route path="/admin/drivers" element={<Drivers />} />
          <Route path="/admin/clients" element={<Clients />} />
          <Route path="/admin/vendors" element={<Vendors />} />
          <Route path="/admin/company-documents" element={<CompanyDocuments />} />
          <Route path="/admin/documents" element={<Documents />} />
          <Route path="/admin/salary" element={<Salary />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/admin/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/admin/drivers/:id" element={<DriverDetail />} />
          <Route path="/admin/clients/:id" element={<ClientDetail />} />
          <Route path="/admin/vendors/:id" element={<VendorDetail />} />
          <Route path="/admin/service-providers/:id" element={<ServiceProviderDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/prompt-generator" element={<PromptGenerator />} />
          <Route path="/agents" element={<Agents />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  useEffect(() => { prefetchRoutes(); }, []);
  return (
    <AuthProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <I18nProvider>
            <Router>
              <ScrollToTop />
              <RouteProgress />
              <TabHistoryProvider>
                <GlobalDateProvider>
                <TourProvider>
                  <AuthenticatedApp />
                  <GuidedTour />
                </TourProvider>
                </GlobalDateProvider>
              </TabHistoryProvider>
            </Router>
            <Toaster />
          </I18nProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App