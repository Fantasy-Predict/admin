"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminShell } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { Card } from "../_components/ui/card";
import { Button } from "../_components/ui/button";
import { Skeleton } from "../_components/ui/skeleton";
import { StatCard } from "../_components/stat-card";
import { formatNaira } from "../_lib/mock-data";
import {
  getAdminDashboard,
  getAdminWalletStats,
  getFplAdminStats,
  getPlatformFeeStats,
  getAdminWallet,
  adminPlatformWithdraw,
  getAdminEarningsWithdrawals,
  triggerLeaderboardSnapshot,
  getUnscoredMatches,
  type UnscoredMatches,
  type AdminDashboard,
  type WalletStats,
  type MonthlyBreakdown,
  type FplAdminStats,
  type PlatformFeeStats,
  type AdminWallet,
  type AdminEarningsWithdrawal,
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

const EMPTY_ADMIN_WALLET: AdminWallet = {
  season: "2026/27",
  totalEarned: 0,
  totalWithdrawn: 0,
  availableBalance: 0,
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
  const [adminWallet, setAdminWallet] = useState<AdminWallet>(EMPTY_ADMIN_WALLET);
  const [earningsHistory, setEarningsHistory] = useState<AdminEarningsWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEarningsHistory, setShowEarningsHistory] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    accountNumber: "",
    bankCode: "",
    password: "",
    accountName: "",
    bankName: "",
  });
  const [mode, setMode] = useState<"fp" | "fxi">("fp");

  const refreshAdminWallet = (active = true) => {
    Promise.all([getAdminWallet(), getAdminEarningsWithdrawals()])
      .then(([w, history]) => {
        if (!active) return;
        setAdminWallet(w);
        setEarningsHistory(history);
      })
      .catch(() => {});
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      getAdminDashboard(),
      getAdminWalletStats(),
      getFplAdminStats(),
      getPlatformFeeStats(),
      getAdminWallet(),
      getAdminEarningsWithdrawals(),
    ])
      .then(([dash, wallet, fpl, fees, adminW, history]) => {
        if (!active) return;
        if (dash) setStats(dash);
        if (wallet) setWalletStats(wallet);
        if (fpl) setFplStats(fpl);
        if (fees) setFeeStats(fees);
        setAdminWallet(adminW);
        setEarningsHistory(history);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load the dashboard");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawForm.amount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > adminWallet.availableBalance) {
      toast.error("Amount exceeds available balance");
      return;
    }
    if (!withdrawForm.accountNumber || !withdrawForm.bankCode || !withdrawForm.accountName) {
      toast.error("Fill in all bank details");
      return;
    }
    if (!withdrawForm.password) {
      toast.error("Enter your password to confirm this withdrawal");
      return;
    }
    setWithdrawing(true);
    try {
      await adminPlatformWithdraw({
        amount,
        accountNumber: withdrawForm.accountNumber,
        bankCode: withdrawForm.bankCode,
        accountName: withdrawForm.accountName,
        bankName: withdrawForm.bankName || withdrawForm.accountName,
        password: withdrawForm.password,
      });
      toast.success("Withdrawal initiated — check your Paystack dashboard for confirmation");
      setShowWithdrawForm(false);
      setWithdrawForm({ amount: "", accountNumber: "", bankCode: "", accountName: "", bankName: "", password: "" });
      refreshAdminWallet();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed — try again");
    } finally {
      setWithdrawing(false);
    }
  };

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
        <>
          {/* Stat cards skeleton */}
          <div className="grid gap-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="gap-0 p-5 shadow-[var(--shadow-card)]">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-28" />
                <Skeleton className="mt-2 h-3 w-36" />
              </Card>
            ))}
          </div>
          {/* Wallet card skeleton */}
          <div className="mt-5">
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-36 rounded-md" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-6 w-28" />
                    <Skeleton className="mt-1.5 h-3 w-32" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
          {/* Earnings wallet skeleton */}
          <div className="mt-8">
            <Skeleton className="mb-3 h-3 w-44" />
            <Card className="p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-2 h-9 w-36" />
                  <Skeleton className="mt-1.5 h-3 w-44" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-32 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-6 w-28" />
                    <Skeleton className="mt-1.5 h-3 w-36" />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      ) : mode === "fp" ? (
        <>
          <StuckScoringAlert />

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

          <LeaderboardSnapshotCard />
        </>
      )}

      {/* ── Platform earnings wallet (always visible) ── */}
      {!loading && <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Platform Earnings Wallet
          </p>
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Available to withdraw</p>
                <p className="num mt-1 text-3xl font-bold text-gold">
                  {formatNaira(adminWallet.availableBalance)}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  10% fees from pools &amp; FXI leagues
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEarningsHistory((v) => !v)}
                >
                  {showEarningsHistory ? "Hide history" : "Withdrawal history"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowWithdrawForm((v) => !v)}
                  disabled={adminWallet.availableBalance <= 0}
                >
                  Withdraw
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Total Earned</p>
                <p className="num mt-1 text-lg font-bold text-success">{formatNaira(adminWallet.totalEarned)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">All-time 10% platform fees</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                <p className="num mt-1 text-lg font-bold text-destructive">{formatNaira(adminWallet.totalWithdrawn)}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Already paid out to your account</p>
              </div>
            </div>

            {/* Withdraw form */}
            {showWithdrawForm && (
              <form onSubmit={handleWithdraw} className="mt-6 border-t border-border pt-5">
                <p className="mb-4 text-sm font-semibold">Withdraw to bank account</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Amount (₦)</label>
                    <input
                      type="number"
                      min="1"
                      max={adminWallet.availableBalance}
                      placeholder="e.g. 50000"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm((f) => ({ ...f, amount: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Bank code</label>
                    <input
                      type="text"
                      placeholder="e.g. 058 (GTBank)"
                      value={withdrawForm.bankCode}
                      onChange={(e) => setWithdrawForm((f) => ({ ...f, bankCode: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Account number</label>
                    <input
                      type="text"
                      placeholder="10-digit NUBAN"
                      maxLength={10}
                      value={withdrawForm.accountNumber}
                      onChange={(e) => setWithdrawForm((f) => ({ ...f, accountNumber: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Account name</label>
                    <input
                      type="text"
                      placeholder="As on bank records"
                      value={withdrawForm.accountName}
                      onChange={(e) => setWithdrawForm((f) => ({ ...f, accountName: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-muted-foreground">Bank name (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Guaranty Trust Bank"
                      value={withdrawForm.bankName}
                      onChange={(e) => setWithdrawForm((f) => ({ ...f, bankName: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-muted-foreground">Your password (required to confirm)</label>
                  <input
                    type="password"
                    placeholder="Enter your admin password"
                    value={withdrawForm.password}
                    onChange={(e) => setWithdrawForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowWithdrawForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={withdrawing}>
                    {withdrawing ? "Processing…" : "Confirm withdrawal"}
                  </Button>
                </div>
              </form>
            )}

            {/* Earnings withdrawal history */}
            {showEarningsHistory && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="mb-4 text-sm font-medium text-muted-foreground">Withdrawal history</p>
                {earningsHistory.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No withdrawals yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-4 font-medium">Date</th>
                          <th className="pb-2 pr-4 font-medium">Account</th>
                          <th className="pb-2 pr-4 text-right font-medium">Amount</th>
                          <th className="pb-2 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {earningsHistory.map((w) => (
                          <tr key={w.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-4 text-muted-foreground">{w.date}</td>
                            <td className="py-2.5 pr-4">
                              <span className="font-medium">{w.accountName}</span>
                              <span className="text-xs text-muted-foreground"> · {w.accountNumber}</span>
                            </td>
                            <td className="num py-2.5 pr-4 text-right font-semibold">{formatNaira(w.amount)}</td>
                            <td className="py-2.5 text-right">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                w.status === "success"
                                  ? "bg-success/10 text-success"
                                  : w.status === "failed"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {w.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>}

      {!loading && <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
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
      </div>}
    </AdminShell>
  );
}

function StuckScoringAlert() {
  const [data, setData] = useState<UnscoredMatches | null>(null);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let active = true;
    getUnscoredMatches(3)
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);

  if (failed) {
    return (
      <Card className="mb-5 p-4 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
        Couldn&apos;t check for stuck match scoring right now.
      </Card>
    );
  }
  if (!data) return null;

  if (data.count === 0) {
    return (
      <Card className="mb-5 flex items-center gap-3 border-success/30 p-4 shadow-[var(--shadow-card)]">
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <p className="text-sm">
          <span className="font-semibold">Scoring is on track.</span>{" "}
          <span className="text-muted-foreground">
            No matches are more than {data.thresholdHours} hours past kickoff without a score.
          </span>
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-5 border-destructive/40 p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-destructive">
            {data.count} {data.count === 1 ? "match is" : "matches are"} waiting for a score
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Kicked off more than {data.thresholdHours} hours ago with no result. Players&apos; points for these are on hold.
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Show"}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/results">Open results</Link>
          </Button>
        </div>
      </div>
      {open && (
        <div className="mt-4 divide-y divide-border rounded-lg border border-border">
          {data.matches.map((m) => (
            <div key={m._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{m.homeTeam} v {m.awayTeam}</p>
                <p className="text-xs text-muted-foreground">
                  {m.competitionName} · kicked off {new Date(m.date).toLocaleString()}
                </p>
              </div>
              <span className="num shrink-0 text-xs font-semibold text-destructive">
                {m.hoursOverdue}h overdue
              </span>
            </div>
          ))}
        </div>
      )}
      {data.olderCount > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Plus {data.olderCount} older unscored matches (over 14 days, mostly last season) not shown.
        </p>
      )}
    </Card>
  );
}

function LeaderboardSnapshotCard() {
  const [running, setRunning] = useState(false);

  async function handleSnapshot() {
    setRunning(true);
    try {
      const result = await triggerLeaderboardSnapshot();
      if (result.ran) {
        toast.success(
          `Snapshot taken for ${result.matchdayLabel} — global:${result.global} nigeria:${result.nigeria} pools:${result.pool}`
        );
      } else {
        toast.info("Snapshot ran but no new data to record.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Snapshot failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mt-5">
      <Card className="p-5 shadow-[var(--shadow-card)] flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Leaderboard Snapshot</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Force a fresh Global / Nigeria / Pools snapshot now. Normally runs automatically after each matchday closes.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleSnapshot} disabled={running}>
          {running ? "Snapshotting…" : "Snapshot now"}
        </Button>
      </Card>
    </div>
  );
}
