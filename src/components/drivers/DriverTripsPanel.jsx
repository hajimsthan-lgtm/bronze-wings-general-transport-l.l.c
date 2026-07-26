import { Link } from 'react-router-dom';
import { Search, History, ChevronRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';

const initials = (name = '') =>
name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function DriverTripsPanel({ trips = [], loading = false, newTripHref }) {
  return null;























































}