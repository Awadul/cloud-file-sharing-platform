import { describe, expect, it } from 'vitest';
import { activeLandingSection } from '@/lib/landing-section';

describe('landing section navigation', () => {
  it('keeps Share selected after jumping back from Customers with Import still visible', () => {
    expect(activeLandingSection([{ id: 'create', top: -900 }, { id: 'import', top: -120 }, { id: 'share', top: 100 }, { id: 'customers', top: 440 }], 120)).toBe('share');
  });
  it('selects Import when that section reaches the reading line', () => {
    expect(activeLandingSection([{ id: 'import', top: 100 }, { id: 'share', top: 400 }], 120)).toBe('import');
  });
  it('uses document position rather than observer notification order', () => {
    expect(activeLandingSection([{ id: 'create', top: -800 }, { id: 'import', top: -400 }, { id: 'share', top: -50 }, { id: 'customers', top: 300 }], 120)).toBe('share');
  });
  it('uses the first section before any section crosses the line', () => {
    expect(activeLandingSection([{ id: 'create', top: 500 }], 120)).toBe('create');
  });
  it('handles no mounted sections', () => { expect(activeLandingSection([], 120)).toBeUndefined(); });
});
