import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks";
import { APP_NAME } from "@/constants";

export function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
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
                <h1 className="text-xl font-semibold text-foreground">Create New User</h1>
                <p className="mt-1 text-xs text-muted-foreground">Join {APP_NAME} to manage your calendar</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="register-name">Full Name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="register-email">Email Address</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-email"
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
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                    autoComplete="new-password"
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
                {isLoading ? "Creating User…" : "Create User"}
                {!isLoading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
                Sign in
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
