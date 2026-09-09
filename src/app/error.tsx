"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "./_components/ui/card";
import { Button } from "./_components/ui/button";
import { ApiError } from "./_lib/api/client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.push("/");
    }
  }, [error, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <Card className="max-w-md gap-0 p-8 text-center shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or log back in.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/")}>
            Log in again
          </Button>
          <Button onClick={reset}>Try again</Button>
        </div>
      </Card>
    </div>
  );
}
