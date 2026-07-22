import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeUserBalances } from '@/lib/accounting';
import GradientCard from '@/components/dashboard/GradientCard';

export default function PendingCustomers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction
      .list('-created_date', 300)
      .then((t) => {
        const pending = (t || []).filter(
          (x) => x.payment_status === 'pending' || x.payment_status === 'partial'
        );
        setRows(computeUserBalances(pending));
      })
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + (r.balance || 0), 0);

  return (
    <GradientCard
      to="/admin/clients"
      variant="orange"
      icon={Users}
      label="Pending Customers"
      title={loading ? '…' : String(rows.length)}
      subtitle={`${formatCurrency(total)} due · tap to view`}
      index={3}
    />
  );
}