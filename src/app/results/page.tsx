"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "../_components/admin-shell";
import { Card } from "../_components/ui/card";
import { Badge } from "../_components/ui/badge";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Skeleton } from "../_components/ui/skeleton";
import { getAdminMatches, getUserCompetitions, settleMatch } from "../_lib/api";
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
        const data = await getAdminMatches(defaultComp._id);
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
    return () => { active = false; };
  }, []);

  function onSettled(matchId: string, homeScore: number, awayScore: number) {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: "finished" as Match["status"], score: { home: homeScore, away: awayScore } }
          : m
      )
    );
  }

  return (
    <AdminShell
      title="Fixtures & results"
      description="View match fixtures and manually settle results if needed."
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
          : matches.map((match) => (
              <ResultRow key={match.id} match={match} onSettled={onSettled} />
            ))}
      </div>
    </AdminShell>
  );
}

function ResultRow({
  match,
  onSettled,
}: {
  match: Match;
  onSettled: (matchId: string, homeScore: number, awayScore: number) => void;
}) {
  const settled = match.status === "finished";
  const status: RowStatus = settled ? "settled" : match.status === "live" ? "awaiting result" : "scheduled";
  const scoreText = match.score ? `${match.score.home} - ${match.score.away}` : undefined;

  const [showModal, setShowModal] = useState(false);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [settling, setSettling] = useState(false);

  async function handleSettle() {
    const hs = parseInt(homeScore, 10);
    const as_ = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as_) || hs < 0 || as_ < 0) {
      toast.error("Enter valid scores (0 or above)");
      return;
    }
    setSettling(true);
    try {
      await settleMatch(match.id, hs, as_);
      toast.success(`${match.home} ${hs} – ${as_} ${match.away} settled`);
      onSettled(match.id, hs, as_);
      setShowModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to settle match");
    } finally {
      setSettling(false);
    }
  }

  return (
    <Card className="gap-0 p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">{`${match.home} vs ${match.away}`}</p>
          <p className="mt-1 text-xs text-muted-foreground">{`${match.competitionName ?? match.competition} · ${match.kickoff}`}</p>
        </div>
        <div className="flex items-center gap-3">
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
          {!settled && (
            <Button size="sm" variant="outline" onClick={() => setShowModal((v) => !v)}>
              {showModal ? "Cancel" : "Settle"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        {settled && scoreText ? (
          <p className="num text-sm font-bold">{scoreText}</p>
        ) : showModal ? (
          <div className="flex flex-wrap items-end gap-3 mt-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{match.home} score</label>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">{match.away} score</label>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                placeholder="0"
              />
            </div>
            <Button size="sm" onClick={handleSettle} disabled={settling}>
              {settling ? "Settling…" : "Confirm"}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No result yet</p>
        )}
      </div>
    </Card>
  );
}
