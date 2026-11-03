"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell, AdminTable } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { formatNaira, type Transaction } from "../_lib/mock-data";
import { getAdminTransactions, getAdminWithdrawals, type AdminWithdrawal } from "../_lib/api";

type Tab = "transactions" | "withdrawals";

export default function AdminPayments() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [wdLoading, setWdLoading] = useState(false);
  const [wdLoaded, setWdLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminTransactions()
      .then((data) => {
        if (active) setTransactions(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load transactions");
      })
      .finally(() => {
        if (active) setTxLoading(false);
      });
    return () => { active = false; };
  }, []);

  function handleTabChange(next: Tab) {
    setTab(next);
    if (next === "withdrawals" && !wdLoaded) {
      setWdLoading(true);
      let active = true;
      getAdminWithdrawals()
        .then((data) => {
          if (active) setWithdrawals(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Unable to load withdrawals");
        })
        .finally(() => {
          if (active) {
            setWdLoading(false);
            setWdLoaded(true);
          }
        });
    }
  }

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground"
    }`;

  return (
    <AdminShell title="Payments" description="All platform transactions and withdrawal requests.">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button className={tabCls("transactions")} onClick={() => handleTabChange("transactions")}>
          Transactions
        </button>
        <button className={tabCls("withdrawals")} onClick={() => handleTabChange("withdrawals")}>
          Withdrawals
        </button>
      </div>

      {/* Transactions tab */}
      {tab === "transactions" && (
        <section>
          {txLoading ? (
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
        </section>
      )}

      {/* Withdrawals tab */}
      {tab === "withdrawals" && (
        <section>
          {wdLoading ? (
            <AdminTable columns={["Date", "Amount", "Status"]}>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
                  <td className="px-5 py-3.5"><div className="h-4 w-16 animate-pulse rounded bg-muted" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 w-16 animate-pulse rounded bg-muted" /></td>
                </tr>
              ))}
            </AdminTable>
          ) : withdrawals.length ? (
            <AdminTable columns={["Date", "Amount", "Status"]}>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5 text-muted-foreground">{w.date}</td>
                  <td className="num px-5 py-3.5 font-semibold">{formatNaira(w.amount)}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      variant="outline"
                      className={
                        w.status === "success" || w.status === "completed"
                          ? "border-success/40 text-success"
                          : w.status === "pending"
                            ? "border-gold/50 text-gold"
                            : "border-destructive/40 text-destructive"
                      }
                    >
                      {w.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </AdminTable>
          ) : (
            <p className="text-sm text-muted-foreground">No withdrawals found.</p>
          )}
        </section>
      )}
    </AdminShell>
  );
}
