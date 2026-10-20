// lib/schemas.ts
// Zod schemas for every route input. Parse before acting.

import { z } from 'zod';

export const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const SignupSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name:     z.string().max(100).optional(),
});

export const CreateDocSchema = z.object({
  title: z.string().max(255).optional(),
});

export const PatchDocSchema = z
  .object({
    title:   z.string().max(255).optional(),
    content: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (d) => d.title !== undefined || d.content !== undefined,
    { message: 'At least one of title or content is required', path: [] }
  );

export const ShareSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['editor', 'viewer']),
});
