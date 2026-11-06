"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "./_components/logo";
import { Button } from "./_components/ui/button";
import { Input } from "./_components/ui/input";
import { Card } from "./_components/ui/card";
import { adminLogin } from "./_lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    try {
      await adminLogin({ email, password });
      toast.success("Logged in successfully");
      router.push("/overview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm gap-0 p-8 shadow-[var(--shadow-card)]">
        <div className="mb-8 flex flex-col items-center">
          <Logo />
          <p className="mt-3 rounded-md border border-gold/50 px-2.5 py-0.5 text-xs font-semibold text-gold">
            Admin console
          </p>
        </div>
        <h1 className="text-center text-xl font-bold">Sign in</h1>
        <p className="mt-1.5 text-center text-sm text-muted-foreground">
          Enter your credentials to access the admin dashboard.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@fantasy-predict.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
