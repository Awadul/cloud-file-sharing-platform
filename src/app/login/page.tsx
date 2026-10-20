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
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-2xl shadow-lg p-8">
        {/* Wordmark */}
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            Ajaia Docs
          </span>
          <span className="text-xs text-slate-400 mt-1">Sign in to your team workspace</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="user-select" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Sign in as
            </label>
            <select
              id="user-select"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
            >
              {DEMO_USERS.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs text-red-600">{error}</p>
            )}
          </div>

          <button
            id="sign-in-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
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
