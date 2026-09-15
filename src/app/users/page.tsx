"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell, AdminTable } from "../_components/admin-shell";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { formatNaira } from "../_lib/mock-data";
import { getUsers, suspendUser, type PlatformUser } from "../_lib/api";

export default function AdminUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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
      await suspendUser(user.email);
      toast.success(`${user.username} suspended`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: "suspended" } : u)));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to suspend user");
    } finally {
      setBusyId(null);
      setConfirmId(null);
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
              <td className="num px-5 py-3.5 font-semibold">{formatNaira(u.balance)}</td>
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
                {u.status === "suspended" ? (
                  <span className="text-xs text-muted-foreground">Deleted</span>
                ) : confirmId === u.id ? (
                  <div className="flex justify-end gap-2">
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
                      {busyId === u.id ? "Suspending…" : "Confirm"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmId(u.id)}
                  >
                    Suspend
                  </Button>
                )}
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
    </AdminShell>
  );
}
