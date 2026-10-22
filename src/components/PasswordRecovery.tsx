"use client";
import { useState } from "react";
import Link from "next/link";
import PlainpageLogo from "./PlainpageLogo";
import { Button } from "./Button";
export function PasswordRecovery({ reset = false }: { reset?: boolean }) {
  const [value, setValue] = useState(""),
    [confirm, setConfirm] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  return (
    <main className="pp-auth">
      <header className="pp-auth-header">
        <Link href="/welcome">
          <PlainpageLogo size="lg" />
        </Link>
        <Link href="/login">Back to sign in</Link>
      </header>
      <section className="pp-auth-panel">
        <div className="pp-auth-intro">
          <h1>{reset ? "Choose a new password" : "Reset your password"}</h1>
          <p>
            {reset
              ? "Use at least 8 characters. You will sign in again afterward."
              : "We will email you a link to choose a new password."}
          </p>
        </div>
        {!done && (
          <form
            className="pp-auth-fields"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (reset && value !== confirm) {
                setError("The passwords do not match.");
                return;
              }
              setBusy(true);
              try {
                const r = await fetch(
                  reset ? "/api/account/password" : "/api/forgot-password",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                      reset ? { password: value } : { email: value },
                    ),
                  },
                );
                const d = await r.json();
                if (!r.ok) throw new Error(d.error?.message);
                setMessage(
                  reset
                    ? "Your password is updated. Sign in with your new password."
                    : d.message,
                );
                setDone(true);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Please try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="pp-auth-field">
              <label htmlFor="recovery-value">
                {reset ? "New password" : "Email address"}
              </label>
              <input
                id="recovery-value"
                className="input"
                type={reset ? "password" : "email"}
                required
                minLength={reset ? 8 : undefined}
                maxLength={reset ? 128 : undefined}
                autoComplete={reset ? "new-password" : "email"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            {reset && (
              <div className="pp-auth-field">
                <label htmlFor="recovery-confirm">Confirm password</label>
                <input
                  id="recovery-confirm"
                  className="input"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}
            <Button type="submit" loading={busy}>
              {reset ? "Update password" : "Send reset link"}
            </Button>
          </form>
        )}
        <p role="status">{message}</p>
        {error && (
          <p className="pp-auth-message pp-auth-error" role="alert">
            {error}
          </p>
        )}
        {done && (
          <Link className="btn" href="/login">
            Return to sign in
          </Link>
        )}
      </section>
    </main>
  );
}
