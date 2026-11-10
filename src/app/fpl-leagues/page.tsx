"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";
import { AdminShell } from "../_components/admin-shell";
import { Button } from "../_components/ui/button";
import { Badge } from "../_components/ui/badge";
import { Card } from "../_components/ui/card";
import {
  getAdminFplLeagues,
  deleteAdminFplLeague,
  triggerAdminFplSync,
  type AdminFplLeague,
} from "../_lib/api";

function fmt(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function FplLeaguesPage() {
  const [leagues, setLeagues] = useState<AdminFplLeague[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getAdminFplLeagues({ page: p, limit: 20 });
      setLeagues(res.leagues);
      setTotal(res.total);
      setPages(res.pages);
      setPage(p);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load FPL leagues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      await triggerAdminFplSync();
      toast.success("FPL data sync triggered successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  async function handleDelete(league: AdminFplLeague) {
    if (!window.confirm(`Delete league "${league.name}"? This cannot be undone.`)) return;
    setDeleting(league._id);
    try {
      await deleteAdminFplLeague(league._id);
      toast.success(`League "${league.name}" deleted`);
      load(page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AdminShell
      title="Fantasy XI Leagues"
      description={`${total.toLocaleString()} league${total !== 1 ? "s" : ""} across the 2026/27 season`}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync FPL data"}
        </Button>
      }
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leagues…</p>
      ) : leagues.length === 0 ? (
        <Card className="p-10 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">No FPL leagues created yet.</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            <table className="w-full min-w-[46rem] text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                  <th className="px-5 py-3 text-left font-semibold">League name</th>
                  <th className="px-5 py-3 text-left font-semibold">Type</th>
                  <th className="px-5 py-3 text-left font-semibold">Code</th>
                  <th className="px-5 py-3 text-left font-semibold">Members</th>
                  <th className="px-5 py-3 text-left font-semibold">Entry fee</th>
                  <th className="px-5 py-3 text-left font-semibold">Visibility</th>
                  <th className="px-5 py-3 text-left font-semibold">Created</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leagues.map((lg) => (
                  <tr key={lg._id} className="hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold">{lg.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant="outline"
                        className={
                          lg.type === "classic"
                            ? "border-emerald-500/40 text-emerald-600"
                            : "border-primary/40 text-primary"
                        }
                      >
                        {lg.type === "classic" ? "Classic" : "H2H"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs tracking-widest text-muted-foreground">
                        {lg.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {lg.totalMembers}
                      {lg.maxMembers ? ` / ${lg.maxMembers}` : ""}
                    </td>
                    <td className="px-5 py-3.5">
                      {lg.isFree ? (
                        <span className="text-muted-foreground">Free</span>
                      ) : (
                        <span className="num font-semibold">₦{lg.entryFee.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline" className="text-muted-foreground">
                        {lg.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {fmt(lg.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={deleting === lg._id}
                        onClick={() => handleDelete(lg)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>{total} leagues · page {page} of {pages}</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= pages}
                  onClick={() => load(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
