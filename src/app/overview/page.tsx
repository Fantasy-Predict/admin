"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminShell } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { StatCard } from "../_components/stat-card";
import { formatNaira } from "../_lib/mock-data";
import {
  getAdminDashboard,
  getAdminWalletStats,
  type AdminDashboard,
  type WalletStats,
  type MonthlyBreakdown,
} from "../_lib/api";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EMPTY_DASHBOARD: AdminDashboard = {
  totalUsers: 0,
  totalPools: 0,
  freePools: 0,
  monetizedPools: 0,
  totalWalletBalance: 0,
  totalInflow: 0,
  totalOutflow: 0,
  recentUsers: [],
  recentWithdrawals: [],
};

const EMPTY_WALLET: WalletStats = {
  totalInflow: 0,
  totalOutflow: 0,
  currentBalance: 0,
  monthly: [],
};

function MonthlyBreakdownTable({ rows }: { rows: MonthlyBreakdown[] }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No transaction data yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-4 font-medium">Month</th>
            <th className="pb-2 pr-4 text-right font-medium">Inflow</th>
            <th className="pb-2 pr-4 text-right font-medium">Outflow</th>
            <th className="pb-2 text-right font-medium">Net</th>
          </tr>
        </thead>
        <tbody>
          {[...rows].reverse().map((r) => {
            const net = r.inflow - r.outflow;
            return (
              <tr key={`${r.year}-${r.month}`} className="border-b border-border/50 last:border-0">
                <td className="py-2.5 pr-4 font-medium">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                <td className="num py-2.5 pr-4 text-right text-success">{formatNaira(r.inflow)}</td>
                <td className="num py-2.5 pr-4 text-right text-destructive">{formatNaira(r.outflow)}</td>
                <td className={`num py-2.5 text-right font-semibold ${net >= 0 ? "text-success" : "text-destructive"}`}>
                  {net >= 0 ? "+" : ""}{formatNaira(Math.abs(net))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminDashboard>(EMPTY_DASHBOARD);
  const [walletStats, setWalletStats] = useState<WalletStats>(EMPTY_WALLET);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getAdminDashboard(), getAdminWalletStats()])
      .then(([dash, wallet]) => {
        if (!active) return;
        if (dash) setStats(dash);
        if (wallet) setWalletStats(wallet);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load the dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <AdminShell
      title="Platform overview"
      description="Everything happening across Fantasy Predict right now."
      actions={
        <Button asChild>
          <Link href="/results">View results</Link>
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading the dashboard…</p>
      ) : (
        <>
          {/* Top stats — users + pool split */}
          <div className="grid gap-5 sm:grid-cols-3">
            <StatCard
              label="Total users"
              value={stats.totalUsers.toLocaleString()}
              hint="Registered across the platform"
            />
            <StatCard
              label="Free pools"
              value={stats.freePools.toLocaleString()}
              accent="primary"
              hint="No entry fee"
            />
            <StatCard
              label="Monetized pools"
              value={stats.monetizedPools.toLocaleString()}
              accent="gold"
              hint="Paid entry fee"
            />
          </div>

          {/* Wallet section */}
          <div className="mt-5">
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">Wallet balance</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBreakdown((v) => !v)}
                >
                  {showBreakdown ? "Hide breakdown" : "Monthly breakdown"}
                </Button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Total Inflow</p>
                  <p className="num mt-1 text-xl font-bold text-success">{formatNaira(walletStats.totalInflow)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">All-time deposits</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Total Outflow</p>
                  <p className="num mt-1 text-xl font-bold text-destructive">{formatNaira(walletStats.totalOutflow)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">All-time withdrawals &amp; debits</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className="num mt-1 text-xl font-bold">{formatNaira(walletStats.currentBalance)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Across all player wallets</p>
                </div>
              </div>

              {showBreakdown && (
                <div className="mt-6 border-t border-border pt-5">
                  <p className="mb-4 text-sm font-medium text-muted-foreground">Month-on-month breakdown</p>
                  <MonthlyBreakdownTable rows={walletStats.monthly} />
                </div>
              )}
            </Card>
          </div>
        </>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="text-lg font-semibold">Recent signups</h2>
          <Card className="mt-4 gap-0 divide-y divide-border p-0 shadow-[var(--shadow-card)]">
            {stats.recentUsers.length ? (
              stats.recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{u.username}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email} · {u.countryCode}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-muted-foreground">{u.joined}</span>
                    <Badge
                      variant="outline"
                      className={u.isActive ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}
                    >
                      {u.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No recent signups.
              </p>
            )}
          </Card>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Recent withdrawals</h2>
          <Card className="mt-4 gap-0 divide-y divide-border p-0 shadow-[var(--shadow-card)]">
            {stats.recentWithdrawals.length ? (
              stats.recentWithdrawals.map((w) => (
                <div key={w._id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{w.status || "Withdrawal"}</p>
                    <p className="text-xs text-muted-foreground">{w.initiated}</p>
                  </div>
                  <span className="num text-sm font-bold">{formatNaira(w.amount)}</span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No withdrawals yet — payouts go out instantly.
              </p>
            )}
          </Card>
        </section>
      </div>
    </AdminShell>
  );
}
