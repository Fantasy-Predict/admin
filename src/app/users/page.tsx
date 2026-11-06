"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { AdminShell, AdminTable } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Card } from "../_components/ui/card";
import { formatNaira } from "../_lib/mock-data";
import {
  getUsers,
  suspendUser,
  unsuspendUser,
  getUserWalletStats,
  type PlatformUser,
  type UserWalletStats,
  type MonthlyBreakdown,
} from "../_lib/api";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function WalletModal({
  user,
  onClose,
}: {
  user: PlatformUser;
  onClose: () => void;
}) {
  const [data, setData] = useState<UserWalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getUserWalletStats(user.id)
      .then((d) => { if (active) setData(d); })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Unable to load wallet data"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user.id]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-lg shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 className="text-base font-semibold">Wallet — {user.username}</h2>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} className="mt-0.5 text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-6">
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading wallet data…</p>
          ) : data ? (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Balance</p>
                  <p className="num mt-1 text-base font-bold">{formatNaira(data.balance)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Total Inflow</p>
                  <p className="num mt-1 text-base font-bold text-success">{formatNaira(data.totalInflow)}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[11px] text-muted-foreground">Total Outflow</p>
                  <p className="num mt-1 text-base font-bold text-destructive">{formatNaira(data.totalOutflow)}</p>
                </div>
              </div>

              {/* Monthly table */}
              {data.monthly.length > 0 && (
                <div className="mt-5">
                  <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly breakdown</p>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background">
                        <tr className="border-b border-border text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Month</th>
                          <th className="px-3 py-2 text-right font-medium">Inflow</th>
                          <th className="px-3 py-2 text-right font-medium">Outflow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...data.monthly].reverse().map((r: MonthlyBreakdown) => (
                          <tr key={`${r.year}-${r.month}`} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 font-medium">{MONTH_NAMES[r.month - 1]} {r.year}</td>
                            <td className="num px-3 py-2 text-right text-success">{formatNaira(r.inflow)}</td>
                            <td className="num px-3 py-2 text-right text-destructive">{formatNaira(r.outflow)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">No wallet data available.</p>
          )}
        </div>
      </Card>
    </div>,
    document.body
  );
}

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unsuspendConfirmId, setUnsuspendConfirmId] = useState<string | null>(null);
  const [walletUser, setWalletUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    let active = true;
    getUsers()
      .then((data) => {
        if (active && Array.isArray(data)) setUsers(data);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load users");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const rows = users.filter((u) =>
    `${u.username} ${u.email} ${u.country}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function handleSuspend(user: PlatformUser) {
    if (busyId) return;
    setBusyId(user.id);
    try {
      await suspendUser(user.id);
      toast.success(`${user.username} suspended`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "suspended" } : u)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to suspend user");
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  }

  async function handleUnsuspend(user: PlatformUser) {
    if (busyId) return;
    setBusyId(user.id);
    try {
      await unsuspendUser(user.id);
      toast.success(`${user.username} unsuspended`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "active" } : u)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to unsuspend user");
    } finally {
      setBusyId(null);
      setUnsuspendConfirmId(null);
    }
  }

  return (
    <AdminShell title="Users" description="Search player accounts, review wallet balances and suspend accounts.">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username, email or country"
        className="max-w-sm"
      />

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        ) : (
          <AdminTable columns={["User", "Country", "Joined", "Balance", "Status", "Action"]}>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <p className="font-semibold">{u.username}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">{u.country}</td>
                <td className="px-5 py-3.5 text-muted-foreground">{u.joined}</td>
                <td className="num px-5 py-3.5 font-semibold">
                  <button
                    className="underline-offset-2 hover:underline"
                    onClick={() => setWalletUser(u)}
                  >
                    {formatNaira(u.balance)}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    variant="outline"
                    className={
                      u.status === "active"
                        ? "border-success/40 text-success"
                        : u.status === "pending KYC"
                          ? "border-gold/50 text-gold"
                          : "border-destructive/40 text-destructive"
                    }
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWalletUser(u)}
                    >
                      Wallet
                    </Button>

                    {u.status === "suspended" ? (
                      unsuspendConfirmId === u.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUnsuspendConfirmId(null)}
                            disabled={busyId === u.id}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUnsuspend(u)}
                            disabled={busyId === u.id}
                            className="bg-success text-white hover:bg-success/90"
                          >
                            {busyId === u.id ? "…" : "Confirm"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setUnsuspendConfirmId(u.id)}
                          className="border-success/40 text-success hover:text-success"
                        >
                          Unsuspend
                        </Button>
                      )
                    ) : confirmId === u.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === u.id}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSuspend(u)}
                          disabled={busyId === u.id}
                        >
                          {busyId === u.id ? "…" : "Confirm"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmId(u.id)}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No users match that search.
                </td>
              </tr>
            )}
          </AdminTable>
        )}
      </div>

      {walletUser && (
        <WalletModal
          user={walletUser}
          onClose={() => setWalletUser(null)}
        />
      )}
    </AdminShell>
  );
}
