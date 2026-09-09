"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminShell } from "../_components/admin-shell";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { StatCard } from "../_components/stat-card";
import { adminActivity, adminPayouts } from "../_lib/admin-data";
import { formatNaira } from "../_lib/mock-data";
import { getAdminDashboard, type AdminDashboard } from "../_lib/api";

const EMPTY_DASHBOARD: AdminDashboard = {
  totalUsers: 0,
  activeUsers: 0,
  totalPools: 0,
  predictionsThisWeek: 0,
  depositsThisMonth: 0,
  withdrawalsThisMonth: 0,
  pendingPayouts: 0,
  platformRevenue: 0,
};

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminDashboard>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getAdminDashboard()
      .then((data) => {
        if (active && data) setStats(data);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load the dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pendingPayouts = adminPayouts.filter((p) => p.status === "awaiting review");

  return (
    <AdminShell
      title="Platform overview"
      description="Everything happening across Fantasy Predict this matchweek."
      actions={
        <Button asChild>
          <Link href="/results">Settle results</Link>
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading the dashboard…</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={stats.totalUsers.toLocaleString()}
              hint={`${stats.activeUsers.toLocaleString()} active this week`}
            />
            <StatCard
              label="Active pools"
              value={stats.totalPools.toLocaleString()}
              accent="primary"
              hint="Free · Monetized"
            />
            <StatCard
              label="Predictions this week"
              value={stats.predictionsThisWeek.toLocaleString()}
              accent="gold"
              hint="Across all competitions"
            />
            <StatCard
              label="Platform revenue"
              value={formatNaira(stats.platformRevenue)}
              accent="success"
              hint="Commission this month"
            />
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <StatCard label="Deposits this month" value={formatNaira(stats.depositsThisMonth)} hint="Paystack settled" />
            <StatCard label="Withdrawals this month" value={formatNaira(stats.withdrawalsThisMonth)} hint="Paid to bank accounts" />
            <StatCard label="Pending payouts" value={String(stats.pendingPayouts)} accent="gold" hint="Awaiting review" />
          </div>
        </>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Payouts awaiting review</h2>
            <Link href="/payments" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
              All payments
            </Link>
          </div>
          <Card className="mt-4 gap-0 divide-y divide-border p-0 shadow-[var(--shadow-card)]">
            {pendingPayouts.length ? (
              pendingPayouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.user}</p>
                    <p className="text-xs text-muted-foreground">{p.method} · {p.requested}</p>
                  </div>
                  <span className="num text-sm font-bold">{formatNaira(p.amount)}</span>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No payouts awaiting review.
              </p>
            )}
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Payout lists come from mock data until the payouts endpoint is added.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Recent activity</h2>
          <Card className="mt-4 gap-0 divide-y divide-border p-0 shadow-[var(--shadow-card)]">
            {adminActivity.map(([title, body, time]) => (
              <div key={body} className="px-5 py-4">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">{time}</p>
              </div>
            ))}
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Recent activity comes from mock data until the activity endpoint is added.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
