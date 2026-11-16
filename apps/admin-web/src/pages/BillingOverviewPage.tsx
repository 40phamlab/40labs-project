import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface BillingOverview {
  mrr: number;
  outstanding: number;
  paid_this_month: number;
  overdue_list: Array<{
    invoice_id: string;
    business_id: string;
    amount_tzs: number;
    due_at: string;
  }>;
}

export function BillingOverviewPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery<BillingOverview>({
    queryKey: ['admin-billing-overview'],
    queryFn: () => apiFetch<BillingOverview>('/admin/v1/billing/overview'),
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-page text-text-primary">Platform Billing & Revenue</h1>
        <p className="text-sm text-text-muted">Global subscription metrics, outstanding invoices, and collection health.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          <div className="h-32 rounded-xl bg-surface-hover" />
          <div className="h-32 rounded-xl bg-surface-hover" />
          <div className="h-32 rounded-xl bg-surface-hover" />
        </div>
      ) : error ? (
        <section className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center" role="alert">
          <p className="text-rose-500 font-medium">Failed to load billing overview: {(error as Error).message}</p>
          <button type="button" onClick={() => refetch()} className="rounded-lg bg-action-primary px-4 py-2 text-sm font-semibold text-white cursor-pointer">Retry</button>
        </section>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-surface p-6 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between text-text-muted text-sm">
                <span>Monthly Recurring Revenue (MRR)</span>
                <DollarSign size={18} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-heading font-bold text-text-primary font-mono">TZS {data.mrr.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Active subscriptions</p>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between text-text-muted text-sm">
                <span>Outstanding Balance</span>
                <AlertTriangle size={18} className="text-amber-500" />
              </div>
              <p className="text-3xl font-heading font-bold text-text-primary font-mono">TZS {data.outstanding.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Unpaid & overdue invoices</p>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between text-text-muted text-sm">
                <span>Collected This Month</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-heading font-bold text-text-primary font-mono">TZS {data.paid_this_month.toLocaleString()}</p>
              <p className="text-xs text-text-muted">Marked paid in current calendar month</p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold text-text-primary">Overdue Invoices</h2>
                <p className="text-sm text-text-muted">Invoices past their due date requiring collection follow-up.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {data.overdue_list.length} Overdue
              </span>
            </div>

            {data.overdue_list.length === 0 ? (
              <p className="py-12 text-center text-sm text-text-muted">No overdue invoices at this time. Excellent collection health!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs text-text-muted bg-surface-hover">
                    <tr>
                      <th className="px-4 py-3">Invoice ID</th>
                      <th className="px-4 py-3">Business ID</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Due Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.overdue_list.map((inv) => (
                      <tr key={inv.invoice_id} className="text-text-primary hover:bg-surface-hover/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{inv.invoice_id}</td>
                        <td className="px-4 py-3 font-mono text-xs text-action-primary hover:underline cursor-pointer" onClick={() => navigate(`/businesses/${inv.business_id}`)}>
                          {inv.business_id}
                        </td>
                        <td className="px-4 py-3 font-mono font-medium">TZS {inv.amount_tzs.toLocaleString()}</td>
                        <td className="px-4 py-3 text-rose-500 font-medium">{new Date(inv.due_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => navigate(`/businesses/${inv.business_id}`)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-action-primary hover:underline cursor-pointer"
                          >
                            View Business <ArrowRight size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </main>
  );
}
