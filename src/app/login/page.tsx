"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlainpageLogo from "@/components/PlainpageLogo";
import { Button } from "@/components/Button";
import { ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
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

  function changeMode(nextMode: "signin" | "signup") {
    setMode(nextMode);
    setError("");
    setInfoMessage("");
    setPassword("");
    setShowPassword(false);
  }

  const signingUp = mode === "signup";

  return (
    <main className="pp-auth">
      <header className="pp-auth-header">
        <Link href="/welcome" aria-label="Plainpage home"><PlainpageLogo size="lg" /></Link>
        <Link href="/welcome" className="pp-auth-back"><ArrowLeft size={16} aria-hidden="true" /> Back to Plainpage</Link>
      </header>

      <section className="pp-auth-panel" aria-labelledby="auth-title">
        <div className="pp-auth-modes" role="group" aria-label="Account access">
          <button className="btn btn-ghost" type="button" aria-pressed={!signingUp} disabled={loading} onClick={() => changeMode("signin")}>Sign in</button>
          <button className="btn btn-ghost" type="button" aria-pressed={signingUp} disabled={loading} onClick={() => changeMode("signup")}>Create account</button>
        </div>
        <div className="pp-auth-intro">
          <h1 id="auth-title">{signingUp ? "Your next page starts here." : "Welcome back."}</h1>
          <p>{signingUp ? "A place for your notes, plans, and shared thinking." : "Sign in to pick up where you left off."}</p>
        </div>

        {error && <div id="auth-error" className="pp-auth-message pp-auth-error" role="alert">{error}</div>}
        {infoMessage ? (
          <div className="pp-auth-confirmation" role="status">
            <CheckCircle size={24} aria-hidden="true" />
            <h2>Check your inbox</h2>
            <p>{infoMessage}</p>
            <button type="button" className="btn btn-ghost" onClick={() => changeMode("signin")}>Return to sign in <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        ) : (
          <form onSubmit={signingUp ? handleSignUp : handleSignIn} aria-describedby={error ? "auth-error" : undefined} aria-busy={loading}>
            <fieldset disabled={loading} className="pp-auth-fields">
              {signingUp && <div className="pp-auth-field">
                <label htmlFor="auth-name">Full name <span>(optional)</span></label>
                <input className="input" id="auth-name" name="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" />
              </div>}
              <div className="pp-auth-field">
                <label htmlFor="auth-email">Email address</label>
                <input className="input" id="auth-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" autoCapitalize="none" spellCheck={false} required />
              </div>
              <div className="pp-auth-field">
                <label htmlFor="auth-password">{signingUp ? "Create a password" : "Password"}</label>
                <div className="pp-auth-password">
                  <input className="input" id="auth-password" name="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signingUp ? "new-password" : "current-password"} minLength={signingUp ? 6 : undefined} aria-describedby={signingUp ? "password-hint" : undefined} required />
                  <button type="button" className="btn btn-ghost btn-square" aria-label={showPassword ? "Hide password" : "Show password"} aria-controls="auth-password" aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
                </div>
                {signingUp && <p id="password-hint" className="pp-auth-hint">Use at least 6 characters.</p>}
              </div>
              <Button type="submit" className="pp-auth-submit" loading={loading}>
                {loading ? (signingUp ? "Creating account…" : "Signing in…") : (signingUp ? "Create account" : "Sign in")}
                {!loading && <ArrowRight size={17} aria-hidden="true" />}
              </Button>
            </fieldset>
          </form>
        )}
        <p className="pp-auth-footer">Write clearly. Share simply.</p>
      </section>
    </main>
  );
}
