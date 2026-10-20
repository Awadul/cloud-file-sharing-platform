'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Metadata can't be exported from client components,
// so it lives in a separate server wrapper if needed.
// This page is intentionally a client component for the form state.

const DEMO_USERS = [
  { name: 'Alice', email: 'alice@demo.test' },
  { name: 'Bob',   email: 'bob@demo.test'   },
  { name: 'Carol', email: 'carol@demo.test'  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message ?? 'Login failed');
        return;
      }
      router.push('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-sm p-8">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold text-indigo-600 tracking-tight">Docs</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="user-select" className="block text-sm font-medium text-slate-700 mb-1">
              Sign in as
            </label>
            <select
              id="user-select"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
            >
              {DEMO_USERS.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus:outline-none"
              placeholder="••••••••"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            id="sign-in-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-500 text-center">
          Demo accounts — mocked auth for assessment purposes.
          The shared password is in SUBMISSION.md.
        </p>
      </div>
    </main>
  );
}
