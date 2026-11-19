"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AdminShell, AdminTable } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Skeleton } from "../_components/ui/skeleton";
import { formatNaira } from "../_lib/mock-data";
import { getPools, closePool, settlePool, type Pool } from "../_lib/api";
import { cn } from "../_lib/utils";

export default function AdminPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [settleConfirmId, setSettleConfirmId] = useState<string | null>(null);
  const [settling, setSettling] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPools()
      .then((data) => { if (active) setPools(data ?? []); })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to load pools");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSettle(poolId: string) {
    setSettling(poolId);
    try {
      await settlePool(poolId);
      setPools((prev) => prev.map((p) => p.id === poolId ? { ...p, settled: true } : p));
      toast.success("Pool settled — prizes paid out to winners");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to settle pool");
    } finally {
      setSettling(null);
      setSettleConfirmId(null);
    }
  }

  async function handleClose(poolId: string) {
    setClosing(poolId);
    try {
      await closePool(poolId);
      setPools((prev) => prev.map((p) => p.id === poolId ? { ...p, isActive: false } : p));
      toast.success("Pool closed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to close pool");
    } finally {
      setClosing(null);
      setConfirmId(null);
    }
  }

  return (
    <AdminShell title="Pools" description="Every pool on the platform, with entry fees and prize pools.">
      <AdminTable
        columns={[
          "Pool",
          "Type",
          "Competition",
          "Entry fee",
          "Members",
          "Status",
          "Action",
        ]}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                ))}
              </tr>
            ))
          : pools.map((l) => {
              const isFree = l.type === "free";
              const isClosed = l.isActive === false;
              const isSettled = l.settled === true;
              const isConfirming = confirmId === l.id;
              const isClosing = closing === l.id;
              const isSettleConfirming = settleConfirmId === l.id;
              const isSettling = settling === l.id;

              return (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3.5">
                    <Link href={`/pools/${l.id}`} className="font-semibold hover:underline">{l.name}</Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {l.privacy}
                      </Badge>
                      {isClosed && (
                        <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                          closed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
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
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{l.competition}</td>
                  <td className="num px-5 py-3.5">{formatNaira(l.entryFee)}</td>
                  <td className="num px-5 py-3.5">{l.players}/{l.maxPlayers}</td>
                  <td className="px-5 py-3.5">
                    {isSettled ? (
                      <Badge variant="outline" className="text-[10px] border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400">
                        Settled
                      </Badge>
                    ) : isClosed ? (
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Awaiting settlement
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">Active</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {isClosed && !isSettled ? (
                      isSettleConfirming ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Pay out winners?</span>
                          <Button
                            size="sm"
                            variant="default"
                            disabled={isSettling}
                            onClick={() => handleSettle(l.id)}
                          >
                            {isSettling ? "Settling…" : "Confirm"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isSettling}
                            onClick={() => setSettleConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500/40 text-green-600 hover:bg-green-500/10 dark:text-green-400"
                          onClick={() => setSettleConfirmId(l.id)}
                        >
                          Settle
                        </Button>
                      )
                    ) : isSettled ? null : isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Close this pool?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isClosing}
                          onClick={() => handleClose(l.id)}
                        >
                          {isClosing ? "Closing…" : "Confirm"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isClosing}
                          onClick={() => setConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmId(l.id)}
                      >
                        Close
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
      </AdminTable>
    </AdminShell>
  );
}
