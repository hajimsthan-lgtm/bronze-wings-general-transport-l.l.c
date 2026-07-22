import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';

const adminSubNav = [
{ key: 'vehicles', path: '/admin/vehicles' },
{ key: 'drivers', path: '/admin/drivers' },
{ key: 'clients', path: '/admin/clients' },
{ key: 'vendors', path: '/admin/vendors' },
{ key: 'documents', path: '/admin/documents' }];


const reportsSubNav = [
{ key: 'daily_report', path: '/reports/daily' },
{ key: 'profit_loss', path: '/reports/pnl' },
{ key: 'soa', path: '/reports/soa' },
{ key: 'expenses', path: '/expenses' },
{ key: 'fuel', path: '/fuel' }];


const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/expenses': reportsSubNav,
  '/fuel': reportsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav
};

import { Bell, Settings, Search } from 'lucide-react'; // adjust imports as needed

export default function TopBar() {
  return null;
















































}