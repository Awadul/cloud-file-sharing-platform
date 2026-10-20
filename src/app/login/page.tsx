"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlainpageLogo from "@/components/PlainpageLogo";
import { Button } from "@/components/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.error?.message || "Could not sign in. Please try again.");
        return;
      }
      router.push("/");
    } catch {
      setError("Unable to connect. Check your connection and try again.");
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
        <section className="pp-login-copy">
          <h1>Your team’s next great document <span className="pp-gradient-text">starts here.</span></h1>
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
        <section className="pp-signin">
          <h2>Welcome to Plainpage</h2>
          <p>Sign in to your workspace and pick up where you left off.</p>
          <form onSubmit={submit}>
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
            {error && (
              <p className="pp-signin-error" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" id="sign-in-btn" loading={loading}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>
          <p className="pp-login-note">
            New here? Sign in with your email to create your workspace.
          </p>
        </section>
      </div>
    </main>
  );
}
