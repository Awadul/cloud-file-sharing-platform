import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
// This Next.js build retains the legacy name for its proxy matcher test helper.
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from 'next/experimental/testing/server';

const mocks = vi.hoisted(() => ({ createServerClient: vi.fn(), getUser: vi.fn() }));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.createServerClient }));
import { config, proxy } from '@/proxy';

interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: { path?: string; httpOnly?: boolean; secure?: boolean; sameSite?: 'lax'; maxAge?: number } }[]): void;
}
let adapter: CookieAdapter;
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  vi.stubEnv('SUPABASE_URL', '');
  mocks.createServerClient.mockImplementation((_url, _key, options) => {
    adapter = options.cookies;
    return { auth: { getUser: mocks.getUser } };
  });
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe('Next.js proxy matcher', () => {
  it.each(['/', '/welcome', '/login', '/documents', '/shared', '/docs/example', '/api/me', '/auth/callback?code=example'])('runs on %s', url => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(true);
  });
  it.each(['/_next/static/chunk.js', '/_next/image?url=test', '/favicon.ico', '/icon.svg', '/landing/image.png', '/photo.jpg', '/photo.jpeg', '/photo.gif', '/photo.webp'])('skips %s', url => {
    expect(unstable_doesProxyMatch({ config, nextConfig: {}, url })).toBe(false);
  });
});

describe('Supabase proxy sessions', () => {
  it('verifies the user and continues without redirecting signed-out requests', async () => {
    const response = await proxy(new NextRequest('https://plainpage.test/login'));
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.createServerClient).toHaveBeenCalledWith('https://project.supabase.co', 'test-anon-key', expect.any(Object));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });
  it('makes incoming session cookies available to Supabase', async () => {
    const request = new NextRequest('https://plainpage.test/documents', { headers: { cookie: 'sb-token=old; other=keep' } });
    await proxy(request);
    expect(adapter.getAll()).toEqual(expect.arrayContaining([{ name: 'sb-token', value: 'old' }, { name: 'other', value: 'keep' }]));
  });
  it('forwards refreshed chunked cookies to both downstream request and browser', async () => {
    const request = new NextRequest('https://plainpage.test/documents', { headers: { cookie: 'sb-token.0=old; other=keep', 'x-test-header': 'preserved' } });
    mocks.getUser.mockImplementation(async () => {
      adapter.setAll([
        { name: 'sb-token.0', value: 'refreshed', options: { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600 } },
        { name: 'sb-token.1', value: 'second-chunk', options: { path: '/', httpOnly: true } },
      ]);
      return { data: { user: { id: 'verified' } }, error: null };
    });
    const response = await proxy(request);
    expect(request.cookies.get('sb-token.0')?.value).toBe('refreshed');
    expect(request.cookies.get('sb-token.1')?.value).toBe('second-chunk');
    expect(response.headers.get('x-middleware-request-cookie')).toContain('sb-token.0=refreshed');
    expect(response.headers.get('x-middleware-request-cookie')).toContain('other=keep');
    expect(response.headers.get('x-middleware-request-x-test-header')).toBe('preserved');
    expect(response.cookies.get('sb-token.0')).toMatchObject({ value: 'refreshed', path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 3600 });
    expect(response.cookies.get('sb-token.1')?.value).toBe('second-chunk');
  });
  it('propagates expired-cookie removal', async () => {
    const request = new NextRequest('https://plainpage.test/', { headers: { cookie: 'sb-token=expired' } });
    mocks.getUser.mockImplementation(async () => {
      adapter.setAll([{ name: 'sb-token', value: '', options: { path: '/', maxAge: 0 } }]);
      return { data: { user: null }, error: { message: 'expired' } };
    });
    const response = await proxy(request);
    expect(response.cookies.get('sb-token')).toMatchObject({ value: '', maxAge: 0 });
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });
  it('supports the server URL fallback', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_URL', 'https://fallback.supabase.co');
    await proxy(new NextRequest('https://plainpage.test/'));
    expect(mocks.createServerClient).toHaveBeenCalledWith('https://fallback.supabase.co', 'test-anon-key', expect.any(Object));
  });
  it.each(['url', 'key'])('continues without crashing if configuration is missing: %s', async missing => {
    vi.stubEnv(missing === 'url' ? 'NEXT_PUBLIC_SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
    const response = await proxy(new NextRequest('https://plainpage.test/welcome'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
});
