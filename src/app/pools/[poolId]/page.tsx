"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminShell } from "../../_components/admin-shell";
import { Badge } from "../../_components/ui/badge";
import { Button } from "../../_components/ui/button";
import { Skeleton } from "../../_components/ui/skeleton";
import { Card } from "../../_components/ui/card";
import { formatNaira } from "../../_lib/mock-data";
import {
  getAdminPool,
  getAdminPoolMembers,
  closePool,
  reopenPool,
  type Pool,
  type PoolMember,
} from "../../_lib/api";
import { cn } from "../../_lib/utils";

export default function PoolDetail() {
  const { poolId } = useParams<{ poolId: string }>();
  const router = useRouter();

  const [pool, setPool] = useState<Pool | null>(null);
  const [members, setMembers] = useState<PoolMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [actioning, setActioning] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      getAdminPool(poolId),
      getAdminPoolMembers(poolId),
    ])
      .then(([p, m]) => {
        if (!active) return;
        setPool(p);
        setMembers(m);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load pool");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [poolId]);

  async function handleClose() {
    setActioning(true);
    try {
      await closePool(poolId);
      setPool((p) => p ? { ...p, isActive: false } : p);
      toast.success("Pool closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to close pool");
    } finally {
      setActioning(false);
      setConfirming(false);
    }
  }

  async function handleReopen() {
    setActioning(true);
    try {
      await reopenPool(poolId);
      setPool((p) => p ? { ...p, isActive: true } : p);
      toast.success("Pool reopened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen pool");
    } finally {
      setActioning(false);
    }
  }

  const isClosed = pool?.isActive === false;
  const isFree = pool?.type === "free";

  return (
    <AdminShell
      title={loading ? "Pool" : (pool?.name ?? "Pool not found")}
      description={loading ? "" : pool?.competition ?? ""}
    >
      {/* Back */}
      <button
        onClick={() => router.push("/pools")}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to pools
      </button>

      {loading ? (
        <div className="space-y-4">
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-2" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 shadow-[var(--shadow-card)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b border-border last:border-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </Card>
        </div>
      ) : !pool ? (
        <Card className="p-8 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">Pool not found.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pool info card */}
          <Card className="p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1",
                    isFree
                      ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                      : "border-gold/30 bg-gold/10 text-gold"
                  )}
                >
                  {isFree ? "Free" : "Monetized"}
                </Badge>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {pool.privacy}
                </Badge>
                {isClosed && (
                  <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                    closed
                  </Badge>
                )}
              </div>

              {/* Close / Reopen action */}
              <div className="flex items-center gap-2">
                {isClosed ? (
                  <Button size="sm" variant="outline" disabled={actioning} onClick={handleReopen}>
                    {actioning ? "Reopening…" : "Reopen pool"}
                  </Button>
                ) : confirming ? (
                  <>
                    <span className="text-xs text-muted-foreground">Close this pool?</span>
                    <Button size="sm" variant="destructive" disabled={actioning} onClick={handleClose}>
                      {actioning ? "Closing…" : "Confirm"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={actioning} onClick={() => setConfirming(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
                    Close pool
                  </Button>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Entry fee</p>
                <p className="mt-1 font-semibold">{formatNaira(pool.entryFee)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prize pool</p>
                <p className="mt-1 font-semibold">{formatNaira(pool.prizePool)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="mt-1 font-semibold">{pool.players}{pool.maxPlayers ? ` / ${pool.maxPlayers}` : ""}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Competition</p>
                <p className="mt-1 font-semibold">{pool.competition || "—"}</p>
              </div>
            </div>

            {pool.introduction && (
              <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">{pool.introduction}</p>
            )}
          </Card>

          {/* Members */}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Members ({members.length})</h2>
            <Card className="overflow-hidden shadow-[var(--shadow-card)]">
              {members.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No members yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Member</th>
                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Email</th>
                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Role</th>
                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="num px-5 py-3 text-left font-medium text-muted-foreground">Amount spent</th>
                        <th className="px-5 py-3 text-left font-medium text-muted-foreground">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-b border-border last:border-0">
                          <td className="px-5 py-3.5">
                            <p className="font-medium">{m.name || m.username || "—"}</p>
                            {m.username && m.name && (
                              <p className="text-xs text-muted-foreground">@{m.username}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{m.email || "—"}</td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize",
                                m.role === "captain" && "border-gold/40 text-gold"
                              )}
                            >
                              {m.role}
                            </Badge>
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] capitalize",
                                m.status === "approved" && "border-green-500/40 text-green-600 dark:text-green-400",
                                m.status === "pending" && "border-gold/40 text-gold",
                                m.status === "declined" && "border-destructive/40 text-destructive"
                              )}
                            >
                              {m.status}
                            </Badge>
                          </td>
                          <td className="num px-5 py-3.5">{formatNaira(m.amountSpent)}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{m.joined || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
