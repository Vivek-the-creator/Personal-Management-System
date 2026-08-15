import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks";
import { APP_NAME, APP_TAGLINE } from "@/constants";

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sign-in failed. Please check your credentials.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-sm"
      >
        <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-[0_32px_80px_-20px_hsl(var(--primary)/0.12)]">
          <div className="h-1 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

          <div className="px-7 py-9">
            {/* Header / Brand */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <AppLogo size="lg" />
              <div className="text-center">
                <h1 className="text-xl font-semibold text-foreground">{APP_NAME}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{APP_TAGLINE}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-center text-xs font-medium text-destructive"
                >
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl font-medium shadow-sm transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Signing in…" : "Sign In"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            {/* Create new user link */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
                Create new user
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          Offline-first · End-to-end encrypted · Your data, your calendar
        </p>
      </motion.div>
    </div>
  );
}
