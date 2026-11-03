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
import { getAdminDashboard, type AdminDashboard } from "../_lib/api";

const EMPTY_DASHBOARD: AdminDashboard = {
  totalUsers: 0,
  totalPools: 0,
  totalPredictions: 0,
  totalWalletBalance: 0,
  recentUsers: [],
  recentWithdrawals: [],
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={stats.totalUsers.toLocaleString()}
            hint="Across the platform"
          />
          <StatCard
            label="Active pools"
            value={stats.totalPools.toLocaleString()}
            accent="primary"
            hint="Free · Monetized"
          />
          <StatCard
            label="Total predictions"
            value={stats.totalPredictions.toLocaleString()}
            accent="gold"
            hint="Across all competitions"
          />
          <StatCard
            label="Wallet balance"
            value={formatNaira(stats.totalWalletBalance)}
            accent="success"
            hint="On-platform player wallets"
          />
        </div>
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