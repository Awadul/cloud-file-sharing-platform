// lib/api.ts
// Client-side API wrapper. Throws ApiError on non-2xx responses.

import { ApiError, type ErrorCode } from './errors';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export async function api<T = unknown>(
  path: string,
  options?: { method?: Method; body?: unknown }
): Promise<T> {
  const res = await fetch(path, {
    method: options?.method ?? 'GET',
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    let code: ErrorCode = 'INTERNAL';
    let message = 'An unexpected error occurred.';
    try {
      const json = await res.json() as { error?: { code?: string; message?: string } };
      if (json.error?.code) code    = json.error.code as ErrorCode;
      if (json.error?.message) message = json.error.message;
    } catch { /* ignore parse errors */ }
    throw new ApiError(code, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
