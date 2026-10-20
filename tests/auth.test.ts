import { describe, it, expect } from 'vitest';
import { LoginSchema, SignupSchema } from '@/lib/schemas';

describe('Auth Schemas Validation', () => {
  it('validates correct email and password for login', () => {
    const res = LoginSchema.safeParse({ email: 'alice@demo.test', password: 'password123' });
    expect(res.success).toBe(true);
  });

  it('rejects invalid email formats', () => {
    const res = LoginSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(res.success).toBe(false);
  });

  it('validates signup with minimum 6 character password', () => {
    const valid = SignupSchema.safeParse({
      email: 'newuser@test.com',
      password: 'secure123',
      name: 'Alex Rivers',
    });
    expect(valid.success).toBe(true);

    const tooShort = SignupSchema.safeParse({
      email: 'newuser@test.com',
      password: '123',
    });
    expect(tooShort.success).toBe(false);
  });
});
