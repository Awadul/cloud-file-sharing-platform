import { describe, it, expect } from 'vitest';
import { getAccess, can } from '../src/lib/access';

const OWNER_ID  = 'user-owner';
const EDITOR_ID = 'user-editor';
const VIEWER_ID = 'user-viewer';
const STRANGER  = 'user-stranger';

const doc = { owner_id: OWNER_ID };
const shares = [
  { user_id: EDITOR_ID, role: 'editor' as const },
  { user_id: VIEWER_ID, role: 'viewer' as const },
];

describe('getAccess', () => {
  it('returns owner for document owner', () => {
    expect(getAccess(OWNER_ID, doc, shares)).toBe('owner');
  });

  it('returns editor for editor share', () => {
    expect(getAccess(EDITOR_ID, doc, shares)).toBe('editor');
  });

  it('returns viewer for viewer share', () => {
    expect(getAccess(VIEWER_ID, doc, shares)).toBe('viewer');
  });

  it('returns none for stranger', () => {
    expect(getAccess(STRANGER, doc, shares)).toBe('none');
  });

  it('returns owner even when owner has a share row', () => {
    // Owner might have a stale share row — ownership takes precedence
    const sharesWithOwner = [
      ...shares,
      { user_id: OWNER_ID, role: 'viewer' as const },
    ];
    expect(getAccess(OWNER_ID, doc, sharesWithOwner)).toBe('owner');
  });
});

describe('can — role capabilities matrix', () => {
  describe('read', () => {
    it('owner can read',   () => expect(can.read('owner')).toBe(true));
    it('editor can read',  () => expect(can.read('editor')).toBe(true));
    it('viewer can read',  () => expect(can.read('viewer')).toBe(true));
    it('none cannot read', () => expect(can.read('none')).toBe(false));
  });

  describe('write', () => {
    it('owner can write',    () => expect(can.write('owner')).toBe(true));
    it('editor can write',   () => expect(can.write('editor')).toBe(true));
    it('viewer cannot write',() => expect(can.write('viewer')).toBe(false));
    it('none cannot write',  () => expect(can.write('none')).toBe(false));
  });

  describe('rename', () => {
    it('owner can rename',    () => expect(can.rename('owner')).toBe(true));
    it('editor can rename',   () => expect(can.rename('editor')).toBe(true));
    it('viewer cannot rename',() => expect(can.rename('viewer')).toBe(false));
    it('none cannot rename',  () => expect(can.rename('none')).toBe(false));
  });

  describe('share', () => {
    it('owner can share',    () => expect(can.share('owner')).toBe(true));
    it('editor cannot share',() => expect(can.share('editor')).toBe(false));
    it('viewer cannot share',() => expect(can.share('viewer')).toBe(false));
    it('none cannot share',  () => expect(can.share('none')).toBe(false));
  });

  describe('delete', () => {
    it('owner can delete',    () => expect(can.delete('owner')).toBe(true));
    it('editor cannot delete',() => expect(can.delete('editor')).toBe(false));
    it('viewer cannot delete',() => expect(can.delete('viewer')).toBe(false));
    it('none cannot delete',  () => expect(can.delete('none')).toBe(false));
  });
});
