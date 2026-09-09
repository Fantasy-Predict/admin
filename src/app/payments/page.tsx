"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell, AdminTable } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { StatCard } from "../_components/stat-card";
import { formatNaira, type Transaction } from "../_lib/mock-data";
import { getAdminDashboard, getTransactions, type AdminDashboard } from "../_lib/api";

export default function AdminPayments() {
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [dash, txs] = await Promise.all([getAdminDashboard(), getTransactions()]);
        if (!active) return;
        setStats(dash);
        setTransactions(txs);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load payment data");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell title="Payments" description="Deposits settle automatically; withdrawals need manual approval.">
      <div className="grid gap-5 sm:grid-cols-4">
        {loading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-4 h-7 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </>
        ) : stats && (
          <>
            <StatCard label="Deposits this month" value={formatNaira(stats.depositsThisMonth)} hint="Settled" />
            <StatCard label="Withdrawals this month" value={formatNaira(stats.withdrawalsThisMonth)} accent="primary" hint="Paid to bank accounts" />
            <StatCard label="Pending payouts" value={String(stats.pendingPayouts)} accent="gold" hint="Awaiting review" />
            <StatCard label="Platform revenue" value={formatNaira(stats.platformRevenue)} accent="gold" hint="10% from monetized pools" />
          </>
        )}
      </div>

      {/* Recent transactions */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Recent transactions</h2>
        <div className="mt-4">
          {loading ? (
            <AdminTable columns={["Type", "Date", "Amount", "Status"]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5"><div className="h-4 w-20 animate-pulse rounded bg-muted" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 w-16 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))}
            </AdminTable>
          ) : transactions.length ? (
            <AdminTable columns={["Type", "Date", "Amount", "Status"]}>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 font-medium">{t.type}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{t.date}</td>
                  <td className="num px-5 py-3.5 font-semibold">{formatNaira(t.amount)}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant="outline"
                      className={
                        t.status === "successful"
                          ? "border-success/40 text-success"
                          : t.status === "pending"
                            ? "border-gold/50 text-gold"
                            : "border-destructive/40 text-destructive"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </AdminTable>
          ) : (
            <p className="text-sm text-muted-foreground">No transactions found.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
