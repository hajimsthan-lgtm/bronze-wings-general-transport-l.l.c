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
import { TabHistoryProvider } from '@/lib/TabHistoryContext';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import Dashboard from '@/pages/Dashboard';
import Operations from '@/pages/Operations';
import Expenses from '@/pages/Expenses';
import Fuel from '@/pages/Fuel';
import DailyReport from '@/pages/DailyReport';
import ProfitLoss from '@/pages/ProfitLoss';
import Soa from '@/pages/Soa';
import Vehicles from '@/pages/admin/Vehicles';
import Drivers from '@/pages/admin/Drivers';
import Clients from '@/pages/admin/Clients';
import Vendors from '@/pages/admin/Vendors';
import Documents from '@/pages/admin/Documents';
import VehicleDetail from '@/pages/admin/VehicleDetail';
import DriverDetail from '@/pages/admin/DriverDetail';
import ClientDetail from '@/pages/admin/ClientDetail';
import VendorDetail from '@/pages/admin/VendorDetail';
import Settings from '@/pages/Settings';
import PromptGenerator from '@/pages/PromptGenerator';

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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/trips" element={<Operations />} />
          <Route path="/contracts" element={<Operations />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/fuel" element={<Fuel />} />
          <Route path="/reports/daily" element={<DailyReport />} />
          <Route path="/reports/pnl" element={<ProfitLoss />} />
          <Route path="/reports/soa" element={<Soa />} />
          <Route path="/admin/vehicles" element={<Vehicles />} />
          <Route path="/admin/drivers" element={<Drivers />} />
          <Route path="/admin/clients" element={<Clients />} />
          <Route path="/admin/vendors" element={<Vendors />} />
          <Route path="/admin/documents" element={<Documents />} />
          <Route path="/admin/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/admin/drivers/:id" element={<DriverDetail />} />
          <Route path="/admin/clients/:id" element={<ClientDetail />} />
          <Route path="/admin/vendors/:id" element={<VendorDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/prompt-generator" element={<PromptGenerator />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <Router>
            <ScrollToTop />
            <TabHistoryProvider>
              <AuthenticatedApp />
            </TabHistoryProvider>
          </Router>
          <Toaster />
        </I18nProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App