import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), signUp: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), exchange: vi.fn(),
  upsert: vi.fn(), from: vi.fn(), adminCreate: vi.fn(), cookieGet: vi.fn(), cookieDelete: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: {
  signInWithPassword: mocks.signIn, signUp: mocks.signUp, getUser: mocks.getUser,
  signOut: mocks.signOut, exchangeCodeForSession: mocks.exchange,
} }) }));
vi.mock('@/lib/db', () => ({ db: { from: mocks.from, auth: { admin: { createUser: mocks.adminCreate } } } }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookieGet, delete: mocks.cookieDelete }) }));
import { POST as login } from '@/app/api/login/route';
import { POST as signup } from '@/app/api/signup/route';
import { POST as logout } from '@/app/api/logout/route';
import { GET as callback } from '@/app/auth/callback/route';
import { getSession } from '@/lib/session';

function request(path: string, body: object) {
  return new NextRequest(`https://plainpage.test${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}
const credentials = { email: 'alex@example.com', password: 'secure123' };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue({ upsert: mocks.upsert });
  mocks.upsert.mockResolvedValue({ error: null });
});
describe('Supabase authentication boundaries', () => {
  it.each(['secure123', 'demo123'])('failed login never provisions an account (%s)', async password => {
    mocks.signIn.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid credentials' } });
    const response = await login(request('/api/login', { ...credentials, password }));
    expect(response.status).toBe(401);
    expect(mocks.adminCreate).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.signIn).toHaveBeenCalledTimes(1);
  });
  it('valid login syncs only the verified user profile', async () => {
    mocks.signIn.mockResolvedValue({ data: { user: { id: 'verified-id', email: credentials.email, user_metadata: { name: 'Alex' } } }, error: null });
    const response = await login(request('/api/login', credentials));
    expect(response.status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledWith({ id: 'verified-id', email: credentials.email, name: 'Alex' });
    expect(mocks.adminCreate).not.toHaveBeenCalled();
  });
  it('rate-limited signup returns 429 without admin provisioning or sign-in', async () => {
    mocks.signUp.mockResolvedValue({ data: null, error: { status: 429, message: 'rate limit' } });
    const response = await signup(request('/api/signup', credentials));
    expect(response.status).toBe(429);
    expect(mocks.adminCreate).not.toHaveBeenCalled();
    expect(mocks.signIn).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it.each([null, { access_token: 'test-session' }])('preserves the configured signup confirmation requirement (%j)', async session => {
    mocks.signUp.mockResolvedValue({ data: { user: { id: 'new-id', email: credentials.email }, session }, error: null });
    const response = await signup(request('/api/signup', credentials));
    expect(response.status).toBe(200);
    expect((await response.json()).confirmationRequired).toBe(!session);
    expect(mocks.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: expect.objectContaining({ emailRedirectTo: 'https://plainpage.test/auth/callback' }) }));
  });
  it('does not accept legacy cookies when Supabase rejects the session', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } });
    mocks.cookieGet.mockReturnValue({ value: 'legacy-token' });
    expect(await getSession()).toBeNull();
    expect(mocks.cookieGet).not.toHaveBeenCalled();
  });
  it('fails closed when Supabase is unavailable', async () => {
    mocks.getUser.mockRejectedValue(new Error('offline'));
    expect(await getSession()).toBeNull();
    expect(mocks.cookieGet).not.toHaveBeenCalled();
  });
  it('returns the verified Supabase identity', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'verified-id', email: credentials.email } }, error: null });
    mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ single: async () => ({ data: { name: 'Alex' } }) }) }) });
    expect(await getSession()).toEqual({ userId: 'verified-id', email: credentials.email, name: 'Alex' });
  });
  it.each([false, true])('reports logout success accurately (failure=%s)', async failure => {
    mocks.signOut.mockResolvedValue({ error: failure ? new Error('offline') : null });
    expect((await logout()).status).toBe(failure ? 500 : 200);
    expect(mocks.cookieDelete).toHaveBeenCalledWith('plainpage_session');
  });
});
describe('confirmation callback', () => {
  it.each(['/documents', 'https://evil.test', '//evil.test', 'http://[invalid'])('restricts redirect destination %s to this site', async next => {
    mocks.exchange.mockResolvedValue({ error: null });
    const response = await callback(new Request(`https://plainpage.test/auth/callback?code=test&next=${encodeURIComponent(next)}`));
    expect(response.headers.get('location')).toBe(`https://plainpage.test${next === '/documents' ? next : '/'}`);
  });
  it.each(['missing', 'rejected', 'unavailable'])('routes %s confirmation to a recoverable login error', async condition => {
    mocks.exchange.mockImplementation(async () => {
      if (condition === 'unavailable') throw new Error('offline');
      return { error: { message: 'expired' } };
    });
    const response = await callback(new Request(`https://plainpage.test/auth/callback${condition === 'missing' ? '' : '?code=expired'}`));
    expect(response.headers.get('location')).toBe('https://plainpage.test/login?error=auth_callback');
  });
});
