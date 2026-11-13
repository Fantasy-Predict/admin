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
  getFplAdminStats,
  getPlatformFeeStats,
  type AdminDashboard,
  type WalletStats,
  type MonthlyBreakdown,
  type FplAdminStats,
  type PlatformFeeStats,
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

const EMPTY_FPL: FplAdminStats = {
  totalFplTeams: 0,
  totalFplLeagues: 0,
  currentGwNumber: null,
  currentGwAvgScore: null,
};

const EMPTY_FEES: PlatformFeeStats = {
  season: "2026/27",
  totalCollected: 0,
  totalPaidOut: 0,
  net: 0,
  breakdown: {},
};

const SOURCE_LABELS: Record<string, string> = {
  "fpl-league-create": "FXI League created",
  "fpl-league-join": "FXI League joined",
  "fpl-league-weekly-payout": "FXI Weekly payout",
  "fpl-league-season-payout": "FXI Season payout",
  "fpl-challenge": "FXI Challenge",
  "prediction-pool": "Prediction pool",
};

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminDashboard>(EMPTY_DASHBOARD);
  const [walletStats, setWalletStats] = useState<WalletStats>(EMPTY_WALLET);
  const [fplStats, setFplStats] = useState<FplAdminStats>(EMPTY_FPL);
  const [feeStats, setFeeStats] = useState<PlatformFeeStats>(EMPTY_FEES);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [mode, setMode] = useState<"fp" | "fxi">("fp");

  useEffect(() => {
    let active = true;
    Promise.all([getAdminDashboard(), getAdminWalletStats(), getFplAdminStats(), getPlatformFeeStats()])
      .then(([dash, wallet, fpl, fees]) => {
        if (!active) return;
        if (dash) setStats(dash);
        if (wallet) setWalletStats(wallet);
        if (fpl) setFplStats(fpl);
        if (fees) setFeeStats(fees);
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
      {/* Mode switcher */}
      <div className="mb-6 flex items-center gap-1 w-fit rounded-xl border border-border bg-muted/30 p-1">
        {(["fp", "fxi"] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? m === "fxi" ? "bg-background shadow text-gold" : "bg-background shadow text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "fp" ? "Fan Predictor" : "Fantasy XI"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading the dashboard…</p>
      ) : mode === "fp" ? (
        <>
          {/* FP stats — users + pool split */}
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
      ) : (
        /* ── Fantasy XI mode ── */
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <StatCard
              label="FPL teams"
              value={fplStats.totalFplTeams.toLocaleString()}
              accent="gold"
              hint="Active squads · 2026/27"
            />
            <StatCard
              label="FPL leagues"
              value={fplStats.totalFplLeagues.toLocaleString()}
              accent="gold"
              hint="Classic leagues"
            />
            <StatCard
              label="GW avg score"
              value={fplStats.currentGwAvgScore !== null ? `${fplStats.currentGwAvgScore} pts` : "—"}
              accent="gold"
              hint={fplStats.currentGwNumber !== null ? `Gameweek ${fplStats.currentGwNumber}` : "No active gameweek"}
            />
          </div>

          {/* Platform fee stats */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Platform Revenue · {feeStats.season}</p>
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Collected (10%)</p>
                  <p className="num mt-1 text-xl font-bold text-success">{formatNaira(feeStats.totalCollected)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Platform fees taken</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Paid out (90%)</p>
                  <p className="num mt-1 text-xl font-bold text-destructive">{formatNaira(feeStats.totalPaidOut)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Winnings disbursed</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Net held</p>
                  <p className="num mt-1 text-xl font-bold text-gold">{formatNaira(feeStats.net)}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Platform earnings</p>
                </div>
              </div>

              {/* Breakdown by source */}
              {Object.keys(feeStats.breakdown).length > 0 && (
                <div className="border-t border-border pt-5">
                  <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Breakdown by type</p>
                  <div className="space-y-2">
                    {Object.entries(feeStats.breakdown).map(([source, data]) => (
                      <div key={source} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{SOURCE_LABELS[source] ?? source}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{data.count} tx</span>
                          <span className="font-semibold">{formatNaira(data.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* FXI league management link */}
          <div className="mt-5">
            <Card className="p-5 shadow-[var(--shadow-card)] flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm">Fantasy XI Leagues</p>
                <p className="text-xs text-muted-foreground mt-0.5">View all leagues, delete any, and trigger a full data sync</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/fpl-leagues">Manage leagues</Link>
              </Button>
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
