import { describe, it, expect, beforeEach, vi } from 'vitest';
import { upsertResponse } from '../lib/repository';
import { bandFor } from '../lib/nps';
import type { NpsResponse } from '../lib/types';

// Mock localStorage for tests
const store: Record<string, string> = {};
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem:    (k: string) => store[k] ?? null,
    setItem:    (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear:      () => { for (const k in store) delete store[k]; },
  });
});

const baseResp = (): Omit<NpsResponse, 'id' | 'band' | 'submittedAt'> => ({
  visitId:    'v1',
  name:       'Rachna',
  phone:      '9876543210',
  storeId:    'jp-nagar',
  visitDate:  '2026-06-19',
  score:      9,
  understood: true,
  reasons:    [],
  suggestion: '',
});

describe('upsertResponse', () => {
  it('inserts a new response when none exists', () => {
    const result = upsertResponse([], baseResp());
    expect(result).toHaveLength(1);
    expect(result[0].band).toBe('promoter');
    expect(result[0].phone).toBe('9876543210');
  });

  it('overwrites an existing same phone+date response (upsert)', () => {
    const first = upsertResponse([], baseResp());
    const updated = upsertResponse(first, { ...baseResp(), score: 3, suggestion: 'Improved' });
    expect(updated).toHaveLength(1);
    expect(updated[0].score).toBe(3);
    expect(updated[0].band).toBe('detractor');
    expect(updated[0].suggestion).toBe('Improved');
  });

  it('creates a second record for same phone but different date', () => {
    const first = upsertResponse([], baseResp());
    const second = upsertResponse(first, { ...baseResp(), visitDate: '2026-06-18', score: 7 });
    expect(second).toHaveLength(2);
    expect(second[1].visitDate).toBe('2026-06-18');
    expect(second[1].band).toBe('passive');
  });

  it('derives band correctly for each boundary score', () => {
    expect(bandFor(6)).toBe('detractor');
    expect(bandFor(7)).toBe('passive');
    expect(bandFor(8)).toBe('passive');
    expect(bandFor(9)).toBe('promoter');
  });

  it('handles empty reasons array cleanly', () => {
    const result = upsertResponse([], { ...baseResp(), reasons: [] });
    expect(result[0].reasons).toEqual([]);
  });
});
