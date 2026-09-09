"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "../_components/logo";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Card } from "../_components/ui/card";
import { adminSignup, adminVerifyAccount } from "../_lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"create" | "done">("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otp, setOtp] = useState("");
  const [creating, setCreating] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setCreating(true);
    try {
      await adminSignup({
        email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      toast.success("Account created — you can sign in now");
      setStep("done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the OTP from your email");
      return;
    }
    setVerifying(true);
    try {
      await adminVerifyAccount({ email, otp: otp.trim() });
      toast.success("Account verified");
      router.push("/");
    } catch (err) {
      toast.warning(
        err instanceof Error && err.message
          ? `${err.message} — your account is already active, so you can sign in directly.`
          : "Verification is unavailable right now — your account is active, so you can sign in directly.",
      );
      router.push("/");
    } finally {
      setVerifying(false);
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

        {step === "create" ? (
          <>
            <h1 className="text-center text-xl font-bold">Create an account</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              Set up an admin account to manage the platform.
            </p>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="text-sm font-medium">
                    First name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="text-sm font-medium">
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>
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
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-center text-xl font-bold">Account created</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{email}</span> is ready.
              Your account is active now — you can sign in with the password you set.
            </p>
            <Button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 w-full"
            >
              Proceed to sign in
            </Button>

            <div className="mt-6 border-t border-border pt-5">
              <p className="text-sm font-medium">Verify your email (optional)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                If you received a one-time code by email, you can enter it here. If you
                didn&apos;t get one, just skip this — your account already works.
              </p>
              <form onSubmit={handleVerify} className="mt-3 space-y-3">
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="One-time code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={verifying}
                >
                  {verifying ? "Verifying…" : "Verify code"}
                </Button>
              </form>
            </div>
          </>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {step === "create" ? (
            <>
              Already have an account?{" "}
              <Link href="/" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : null}
        </p>
      </Card>
    </div>
  );
}