// Prefetch all lazy-loaded route chunks on idle so navigation feels instant.
const chunkLoaders = [
  () => import('@/pages/Dashboard'),
  () => import('@/pages/Operations'),
  () => import('@/pages/Expenses'),
  () => import('@/pages/DailyReport'),
  () => import('@/pages/ProfitLoss'),
  () => import('@/pages/Soa'),
  () => import('@/pages/BankReconciliation'),
  () => import('@/pages/admin/Vehicles'),
  () => import('@/pages/admin/Drivers'),
  () => import('@/pages/admin/Clients'),
  () => import('@/pages/admin/Documents'),
  () => import('@/pages/admin/VehicleDetail'),
  () => import('@/pages/admin/DriverDetail'),
  () => import('@/pages/admin/ClientDetail'),
  () => import('@/pages/admin/VendorDetail'),
  () => import('@/pages/Settings'),
  () => import('@/pages/PromptGenerator'),
  () => import('@/pages/Agents'),
];

export function prefetchRoutes() {
  const run = () => Promise.allSettled(chunkLoaders.map((fn) => fn()));
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 3000 });
  } else {
    setTimeout(run, 2000);
  }
}