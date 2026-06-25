import { describe, it, expect } from 'vitest';
import { bandFor, computeNps, kpisFor } from '../lib/nps';
import type { NpsResponse } from '../lib/types';

const mkResp = (
  overrides: Partial<NpsResponse> & Pick<NpsResponse, 'score' | 'storeId' | 'visitDate'>,
): NpsResponse => ({
  id: 'test-id',
  visitId: 'v1',
  name: 'Test',
  phone: '9999999999',
  understood: true,
  reasons: [],
  suggestion: '',
  band: bandFor(overrides.score),
  submittedAt: new Date().toISOString(),
  ...overrides,
});

describe('bandFor', () => {
  it('scores 9 and 10 are promoters', () => {
    expect(bandFor(9)).toBe('promoter');
    expect(bandFor(10)).toBe('promoter');
  });
  it('scores 7 and 8 are passive', () => {
    expect(bandFor(7)).toBe('passive');
    expect(bandFor(8)).toBe('passive');
  });
  it('score 6 is detractor (boundary)', () => {
    expect(bandFor(6)).toBe('detractor');
  });
  it('score 0 is detractor', () => {
    expect(bandFor(0)).toBe('detractor');
  });
});

describe('computeNps', () => {
  it('returns null for empty array', () => {
    expect(computeNps([])).toBeNull();
  });

  it('all promoters → +100', () => {
    const r = [
      mkResp({ score: 10, storeId: 's1', visitDate: '2026-01-01' }),
      mkResp({ score: 9,  storeId: 's1', visitDate: '2026-01-02', id: 'x2' }),
    ];
    expect(computeNps(r)).toBe(100);
  });

  it('all detractors → -100', () => {
    const r = [
      mkResp({ score: 3, storeId: 's1', visitDate: '2026-01-01' }),
      mkResp({ score: 2, storeId: 's1', visitDate: '2026-01-02', id: 'x2' }),
    ];
    expect(computeNps(r)).toBe(-100);
  });

  it('mixed: 2 promoters + 1 passive + 1 detractor → 25', () => {
    const r = [
      mkResp({ score: 10, storeId: 's1', visitDate: '2026-01-01' }),
      mkResp({ score: 9,  storeId: 's1', visitDate: '2026-01-02', id: 'x2' }),
      mkResp({ score: 7,  storeId: 's1', visitDate: '2026-01-03', id: 'x3' }),
      mkResp({ score: 5,  storeId: 's1', visitDate: '2026-01-04', id: 'x4' }),
    ];
    // (2/4)*100 - (1/4)*100 = 50 - 25 = 25
    expect(computeNps(r)).toBe(25);
  });

  it('all passives → 0', () => {
    const r = [
      mkResp({ score: 7, storeId: 's1', visitDate: '2026-01-01' }),
      mkResp({ score: 8, storeId: 's1', visitDate: '2026-01-02', id: 'x2' }),
    ];
    expect(computeNps(r)).toBe(0);
  });
});

describe('kpisFor', () => {
  const TODAY = new Date().toISOString().slice(0, 10);
  const past91 = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 91);
    return d.toISOString().slice(0, 10);
  })();

  const responses: NpsResponse[] = [
    mkResp({ id: 'a', score: 10, storeId: 'store-a', visitDate: TODAY }),
    mkResp({ id: 'b', score: 5,  storeId: 'store-a', visitDate: TODAY }),
    mkResp({ id: 'c', score: 9,  storeId: 'store-b', visitDate: TODAY }),
    mkResp({ id: 'd', score: 3,  storeId: 'store-a', visitDate: past91 }),
  ];

  it('all-stores today counts 3 responses', () => {
    const k = kpisFor(responses);
    expect(k.todayCount).toBe(3);
  });

  it('store-a today: 1 promoter, 1 detractor → 0 NPS', () => {
    const k = kpisFor(responses, 'store-a');
    expect(k.todayCount).toBe(2);
    expect(k.todayNps).toBe(0);
  });

  it('past91-day record is outside 90-day window', () => {
    const k = kpisFor(responses, 'store-a');
    expect(k.quarterCount).toBe(2); // only TODAY's store-a records
  });

  it('all-time includes all records', () => {
    const k = kpisFor(responses, 'store-a');
    expect(k.allTimeCount).toBe(3);
  });

  it('returns null NPS when no responses in window', () => {
    const k = kpisFor([], 'store-z');
    expect(k.todayNps).toBeNull();
    expect(k.quarterNps).toBeNull();
    expect(k.allTimeNps).toBeNull();
  });
});
