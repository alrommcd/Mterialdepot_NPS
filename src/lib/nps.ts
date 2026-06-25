import type { NpsResponse, Band, ReasonKey } from './types';
import { today, withinLast90Days } from './dates';

export function bandFor(score: number): Band {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export function computeNps(responses: NpsResponse[]): number | null {
  if (responses.length === 0) return null;
  const promoters  = responses.filter(r => r.band === 'promoter').length;
  const detractors = responses.filter(r => r.band === 'detractor').length;
  const total = responses.length;
  return Math.round((promoters / total) * 100 - (detractors / total) * 100);
}

export type KpiSet = {
  todayNps:   number | null;
  todayCount: number;
  quarterNps:   number | null;
  quarterCount: number;
  allTimeNps:   number | null;
  allTimeCount: number;
};

export function kpisFor(
  responses: NpsResponse[],
  storeId?: string,
): KpiSet {
  const scoped = storeId
    ? responses.filter(r => r.storeId === storeId)
    : responses;

  const t = today();
  const todayR   = scoped.filter(r => r.visitDate === t);
  const quarterR = scoped.filter(r => withinLast90Days(r.visitDate));
  const allR     = scoped;

  return {
    todayNps:    computeNps(todayR),
    todayCount:  todayR.length,
    quarterNps:  computeNps(quarterR),
    quarterCount: quarterR.length,
    allTimeNps:  computeNps(allR),
    allTimeCount: allR.length,
  };
}

export type BandBreakdown = {
  promoters:  number;
  passives:   number;
  detractors: number;
  total:      number;
};

export function bandBreakdown(responses: NpsResponse[]): BandBreakdown {
  return {
    promoters:  responses.filter(r => r.band === 'promoter').length,
    passives:   responses.filter(r => r.band === 'passive').length,
    detractors: responses.filter(r => r.band === 'detractor').length,
    total: responses.length,
  };
}

export function reasonTallies(responses: NpsResponse[]): Record<ReasonKey, number> {
  const tally: Record<ReasonKey, number> = {
    pricing: 0, collection: 0, service_delivery: 0, sales_experience: 0,
  };
  for (const r of responses) {
    for (const key of r.reasons) {
      tally[key]++;
    }
  }
  return tally;
}
