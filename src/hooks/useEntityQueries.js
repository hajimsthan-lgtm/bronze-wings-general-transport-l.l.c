import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { withRetry } from '@/lib/safeRequest';

const KEYS = {
  trips: ['trips'],
  expenses: ['expenses'],
  transactions: ['transactions'],
  clientPayments: ['clientPayments'],
  invoices: ['invoices'],
};

function createOpts(qc, key) {
  return {
    onMutate: async (newItem) => {
      await qc.cancelQueries(key);
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => [
        { ...newItem, id: 'opt-' + Date.now(), created_date: new Date().toISOString(), updated_date: new Date().toISOString() },
        ...(old || []),
      ]);
      return { prev };
    },
    onError: (_e, _item, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => qc.invalidateQueries(key),
  };
}

function updateOpts(qc, key) {
  return {
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries(key);
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => (old || []).map(item => item.id === id ? { ...item, ...data } : item));
      return { prev };
    },
    onError: (_e, _vars, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => qc.invalidateQueries(key),
  };
}

function deleteOpts(qc, key) {
  return {
    onMutate: async (id) => {
      await qc.cancelQueries(key);
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => (old || []).filter(item => item.id !== id));
      return { prev };
    },
    onError: (_e, _id, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => qc.invalidateQueries(key),
  };
}

/* Trips */
export const useTrips = () => useQuery({ queryKey: KEYS.trips, queryFn: () => withRetry(() => base44.entities.Trip.list('-created_date', 500)) });
export const useTripCreate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data) => withRetry(() => base44.entities.Trip.create(data), 5), retry: 0, ...createOpts(qc, KEYS.trips) }); };
export const useTripUpdate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => withRetry(() => base44.entities.Trip.update(id, data), 5), retry: 0, ...updateOpts(qc, KEYS.trips) }); };
export const useTripDelete = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id) => withRetry(() => base44.entities.Trip.delete(id), 5), retry: 0, ...deleteOpts(qc, KEYS.trips) }); };

/* Expenses */
export const useExpenses = () => useQuery({ queryKey: KEYS.expenses, queryFn: () => withRetry(() => base44.entities.Expense.list('-created_date', 200)) });
export const useExpenseCreate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data) => base44.entities.Expense.create(data), ...createOpts(qc, KEYS.expenses) }); };
export const useExpenseUpdate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data), ...updateOpts(qc, KEYS.expenses) }); };
export const useExpenseDelete = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id) => base44.entities.Expense.delete(id), ...deleteOpts(qc, KEYS.expenses) }); };

/* Transactions */
export const useTransactions = () => useQuery({ queryKey: KEYS.transactions, queryFn: () => withRetry(() => base44.entities.Transaction.list('-created_date', 200)) });
export const useTransactionCreate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data) => base44.entities.Transaction.create(data), ...createOpts(qc, KEYS.transactions) }); };
export const useTransactionUpdate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data), ...updateOpts(qc, KEYS.transactions) }); };

/* Invoices */
export const useInvoices = () => useQuery({ queryKey: KEYS.invoices, queryFn: () => withRetry(() => base44.entities.Invoice.list('-created_date', 500)) });
export const useInvoiceCreate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data) => base44.entities.Invoice.create(data), ...createOpts(qc, KEYS.invoices) }); };
export const useInvoiceUpdate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => base44.entities.Invoice.update(id, data), ...updateOpts(qc, KEYS.invoices) }); };
export const useInvoiceDelete = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id) => base44.entities.Invoice.delete(id), ...deleteOpts(qc, KEYS.invoices) }); };

/* Client Payments */
export const useClientPayments = () => useQuery({ queryKey: KEYS.clientPayments, queryFn: () => withRetry(() => base44.entities.ClientPayment.list('-created_date', 200)) });
export const useClientPaymentCreate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (data) => base44.entities.ClientPayment.create(data), ...createOpts(qc, KEYS.clientPayments) }); };
export const useClientPaymentUpdate = () => { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, data }) => base44.entities.ClientPayment.update(id, data), ...updateOpts(qc, KEYS.clientPayments) }); };
export const useClientPaymentDelete = () => { const qc = useQueryClient(); return useMutation({ mutationFn: (id) => base44.entities.ClientPayment.delete(id), ...deleteOpts(qc, KEYS.clientPayments) }); };