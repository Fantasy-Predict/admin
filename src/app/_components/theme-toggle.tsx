"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { useTheme, type ThemeChoice } from "./theme-provider";
import { cn } from "../_lib/utils";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Monitor }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn("inline-flex rounded-xl border border-border bg-muted/60 p-0.5", className)}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={theme === option.value}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[10px] transition-colors",
              theme === option.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}