"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { clearSession } from "../_lib/api/session";
import { cn } from "../_lib/utils";

const ADMIN_NAV = [
  { to: "/overview", label: "Overview" },
  { to: "/users", label: "Users" },
  { to: "/pools", label: "Pools" },
  { to: "/results", label: "Fixtures & results" },
  { to: "/payments", label: "Payments" },
] as const;

function isActive(pathname: string, to: string) {
  return to === "/overview" ? pathname === "/overview" : pathname.startsWith(to);
}

export function AdminShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <Link href="/" aria-label="Fantasy Predict home">
            <Logo />
          </Link>
          <Badge variant="outline" className="mt-3 border-gold/50 text-gold">
            Admin console
          </Badge>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive(pathname, item.to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="mt-4 block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            ← Back to player app
          </Link>
        </nav>
        <div className="border-t border-sidebar-border p-4 space-y-2">
          <ThemeToggle className="w-full justify-between" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
            <Link href="/" className="lg:hidden" aria-label="Fantasy Predict home">
              <Logo variant="mark" />
            </Link>
            <nav className="hidden gap-1 overflow-x-auto sm:flex lg:hidden">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap",
                    isActive(pathname, item.to) ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-navy text-xs font-semibold text-navy-foreground lg:hidden">
                  AD
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="animate-rise px-5 pt-8 pb-24 lg:px-8 lg:pb-14">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
                {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
              </div>
              {actions}
            </div>
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-background/95 backdrop-blur sm:hidden">
        {ADMIN_NAV.map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className={cn(
              "px-1 py-3 text-center text-[10px] font-semibold",
              isActive(pathname, item.to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="px-1 py-3 text-center text-[10px] font-semibold text-muted-foreground"
        >
          <LogOut className="mx-auto mb-0.5 h-4 w-4" />
          Log out
        </button>
      </nav>
    </div>
  );
}

export function AdminTable({
  columns,
  children,
}: {
  columns: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full min-w-[42rem] text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
            {columns.map((c) => (
              <th key={c} className="px-5 py-3 text-left font-semibold last:text-right">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}