"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlainpageLogo from "@/components/PlainpageLogo";
import { Button } from "@/components/Button";
import { ArrowRight, ArrowLeft, Mail, CheckCircle, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DEMO_USERS = [
  { name: "Alice", email: "alice@demo.test" },
  { name: "Bob", email: "bob@demo.test" },
  { name: "Carol", email: "carol@demo.test" },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "magiclink">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error?.message || "Invalid email or password. Please try again.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error?.message || "Could not register account. Please try again.");
        return;
      }

      if (data.confirmationRequired) {
        setInfoMessage(
          data.message || "Account created! Please check your email for a confirmation link to activate your workspace."
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfoMessage("");

    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (otpError) {
        setError(otpError.message);
        return;
      }

      setInfoMessage(`Magic link sent! Check ${email} for your secure sign-in link.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send magic link.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pp-login">
      <Link
        href="/"
        className="pp-login-brand"
        aria-label="Plainpage overview"
      >
        <PlainpageLogo size="lg" />
      </Link>

      <div className="pp-login-layout">
        {/* Left column hero copy */}
        <section className="pp-login-copy">
          <h1>
            Your team’s next great document{" "}
            <span className="pp-gradient-text">starts here.</span>
          </h1>
          <p>
            Plainpage is a lightweight document editor for teams. Write rich
            text, keep it organized, import your files, and share with the right
            people.
          </p>
          <div>
            <Link href="/">
              <ArrowLeft size={14} className="inline mr-2" />
              Explore Plainpage
            </Link>
          </div>
        </section>

        {/* Right column auth card */}
        <section className="pp-signin">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg mb-6 border border-slate-200/60">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
                setInfoMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
                setInfoMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("magiclink");
                setError("");
                setInfoMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "magiclink"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Magic link
            </button>
          </div>

          <h2>
            {mode === "signin" && "Welcome to Plainpage"}
            {mode === "signup" && "Create your workspace"}
            {mode === "magiclink" && "Passwordless sign-in"}
          </h2>
          <p>
            {mode === "signin" && "Sign in to your workspace and pick up where you left off."}
            {mode === "signup" && "Start writing and collaborating with your team in seconds."}
            {mode === "magiclink" && "We'll send a secure sign-in link directly to your inbox."}
          </p>

          {/* Feedback Banners */}
          {error && (
            <div className="pp-signin-error" role="alert">
              {error}
            </div>
          )}

          {infoMessage && (
            <div
              className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs leading-relaxed flex items-start gap-2 shadow-xs"
              role="status"
            >
              <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form 1: Sign In */}
          {mode === "signin" && (
            <form onSubmit={handleSignIn}>
              <label htmlFor="email-input">Email address</label>
              <input
                className="input"
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                className="input"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />

              <Button type="submit" id="sign-in-btn" loading={loading}>
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </form>
          )}

          {/* Form 2: Create Account (Sign Up) */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp}>
              <label htmlFor="name-input">Full name</label>
              <input
                className="input"
                id="name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivers"
                autoComplete="name"
              />

              <label htmlFor="signup-email">Work email address</label>
              <input
                className="input"
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@company.com"
                autoComplete="email"
                required
              />

              <label htmlFor="signup-password">Choose a password</label>
              <input
                className="input"
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
              />

              <Button type="submit" id="create-account-btn" loading={loading}>
                {loading ? "Creating workspace…" : "Create workspace"}
                {!loading && <Sparkles size={16} />}
              </Button>
            </form>
          )}

          {/* Form 3: Magic Link */}
          {mode === "magiclink" && (
            <form onSubmit={handleMagicLink}>
              <label htmlFor="magiclink-email">Email address</label>
              <input
                className="input"
                id="magiclink-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                required
              />

              <Button type="submit" id="send-magiclink-btn" loading={loading}>
                {loading ? "Sending link…" : "Send magic link"}
                {!loading && <Mail size={16} />}
              </Button>
            </form>
          )}

          {/* Fast Team Quick-Select (Preserved for review & instant verification) */}
          <div className="mt-6 pt-5 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Demo team accounts
              </span>
              <span className="text-[11px] text-slate-400">PW: demo123</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setEmail(u.email);
                    setPassword("demo123");
                    setError("");
                    setInfoMessage("");
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium border transition-colors ${
                    email === u.email && mode === "signin"
                      ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
