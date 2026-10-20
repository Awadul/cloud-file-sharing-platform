'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PlainpageLogo from '@/components/PlainpageLogo';

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
    <main className="min-h-screen bg-[#F4F6FB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-2xl shadow-sm p-8">
        {/* Official Plainpage Logo */}
        <div className="mb-7 text-center flex flex-col items-center">
          <PlainpageLogo size="lg" showTagline={true} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="email-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email address
            </label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
            />

            {/* Quick Team Sign-In Selection */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400">Quick select:</span>
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword('demo123');
                  }}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    email === u.email
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
            {error && (
              <p role="alert" className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>
            )}
          </div>

          <button
            id="sign-in-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
