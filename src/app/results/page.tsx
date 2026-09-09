"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "../_components/admin-shell";
import { Card } from "../_components/ui/card";
import { Badge } from "../_components/ui/badge";
import { Skeleton } from "../_components/ui/skeleton";
import { getMatches, getUserCompetitions } from "../_lib/api";
import type { Match } from "../_lib/mock-data";

type RowStatus = "scheduled" | "awaiting result" | "settled";

export default function AdminResults() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const comps = await getUserCompetitions().catch(() => []);
        const nameMap = new Map(comps.map((c) => [c._id, c.name]));
        const defaultComp = comps.find((c) => c.name === "Premier League" || c.code === "PL") ?? comps.find((c) => c.default) ?? comps[0];
        if (!defaultComp) return;
        const data = await getMatches(defaultComp._id);
        if (!active) return;
        setMatches(data.map((m) => ({
          ...m,
          competitionName: nameMap.get(m.competition) ?? m.competition,
        })));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load fixtures");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminShell
      title="Fixtures & results"
      description="View match fixtures and their settled results."
    >
      <div className="grid gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="gap-0 p-5 shadow-[var(--shadow-card)]">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="mt-2 h-3 w-24" />
                <div className="mt-4 flex gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4 self-center" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))
          : matches.map((match) => <ResultRow key={match.id} match={match} />)}
      </div>
    </AdminShell>
  );
}

function ResultRow({ match }: { match: Match }) {
  const settled = match.status === "finished";
  const status: RowStatus = settled ? "settled" : match.status === "live" ? "awaiting result" : "scheduled";
  const scoreText = match.score ? `${match.score.home} - ${match.score.away}` : undefined;

  return (
    <Card className="gap-0 p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{`${match.home} vs ${match.away}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{`${match.competitionName ?? match.competition} · ${match.kickoff}`}</p>
        </div>
        <Badge
          variant="outline"
          className={
            settled
              ? "border-success/40 text-success"
              : status === "awaiting result"
                ? "border-gold/50 text-gold"
                : "border-border text-muted-foreground"
          }
        >
          {status}
        </Badge>
      </div>
      <div className="mt-4">
        {settled && scoreText ? (
          <p className="num text-sm font-bold">{scoreText}</p>
        ) : (
          <p className="text-xs text-muted-foreground">No result yet</p>
        )}
      </div>
    </Card>
  );
}
