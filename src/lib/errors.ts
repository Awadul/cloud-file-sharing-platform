// lib/errors.ts
// Single error shape used by every route handler.

import { NextResponse } from 'next/server';

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'UNSUPPORTED_TYPE'
  | 'TOO_LARGE'
  | 'USER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL';

const STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHENTICATED:  401,
  FORBIDDEN:        403,
  NOT_FOUND:        404,
  VALIDATION:       400,
  UNSUPPORTED_TYPE: 415,
  TOO_LARGE:        413,
  USER_NOT_FOUND:   404,
  RATE_LIMITED:     429,
  INTERNAL:         500,
};

export function apiError(code: ErrorCode, message: string): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status: STATUS_MAP[code] }
  );
}

/** Typed error thrown by the client-side api() wrapper */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
