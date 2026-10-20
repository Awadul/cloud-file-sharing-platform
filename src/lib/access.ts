// lib/access.ts
// Pure access control logic. No framework imports. Fully unit tested.

export type Role = 'owner' | 'editor' | 'viewer' | 'none';

export interface ShareRow {
  user_id: string;
  role: 'editor' | 'viewer';
}

export interface DocMeta {
  owner_id: string;
}

/**
 * Determine the access role for userId on a document.
 * This is the SINGLE gate called by every route that touches a document.
 */
export function getAccess(
  userId: string,
  doc: DocMeta,
  shares: ShareRow[]
): Role {
  if (doc.owner_id === userId) return 'owner';
  const share = shares.find((s) => s.user_id === userId);
  if (share) return share.role;
  return 'none';
}

/** Helpers for role capability checks */
export const can = {
  read:   (role: Role) => role !== 'none',
  write:  (role: Role) => role === 'owner' || role === 'editor',
  rename: (role: Role) => role === 'owner' || role === 'editor',
  share:  (role: Role) => role === 'owner',
  delete: (role: Role) => role === 'owner',
};
