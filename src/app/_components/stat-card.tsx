import { cn } from "../_lib/utils";
import { Card } from "./ui/card";

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "gold" | "primary" | "success";
}) {
  return (
    <Card className="gap-0 p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "num mt-3 font-display text-2xl font-bold",
          accent === "gold" && "text-gold",
          accent === "primary" && "text-primary",
          accent === "success" && "text-success",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}