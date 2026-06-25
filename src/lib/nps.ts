import type { NpsResponse, Visit, Band, ReasonKey } from './types';
import { STORES } from './constants';
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

export type RangeStats = {
  nps: number | null;
  responseCount: number;
  visitCount: number;
  promoters: number;
  passives: number;
  detractors: number;
  responseRate: number | null;
};

export function rangeStats(
  visits: Visit[],
  responses: NpsResponse[],
  fromDate: string,
  toDate: string,
  storeId?: string,
): RangeStats {
  const sv = storeId ? visits.filter(v => v.storeId === storeId) : visits;
  const sr = storeId ? responses.filter(r => r.storeId === storeId) : responses;
  const rv = sv.filter(v => v.visitDate >= fromDate && v.visitDate <= toDate);
  const rr = sr.filter(r => r.visitDate >= fromDate && r.visitDate <= toDate);
  const visitCount = rv.length;
  const responseCount = rr.length;
  return {
    nps: computeNps(rr),
    responseCount,
    visitCount,
    promoters:  rr.filter(r => r.band === 'promoter').length,
    passives:   rr.filter(r => r.band === 'passive').length,
    detractors: rr.filter(r => r.band === 'detractor').length,
    responseRate: visitCount > 0 ? (responseCount / visitCount) * 100 : null,
  };
}

export type DayStat = { date: string; nps: number | null; count: number; promoters: number; passives: number; detractors: number };

export function npsByDay(
  responses: NpsResponse[],
  fromDate: string,
  toDate: string,
  storeId?: string,
): DayStat[] {
  const scoped = storeId ? responses.filter(r => r.storeId === storeId) : responses;
  const map = new Map<string, NpsResponse[]>();
  for (const r of scoped) {
    if (r.visitDate >= fromDate && r.visitDate <= toDate) {
      const arr = map.get(r.visitDate) ?? [];
      arr.push(r);
      map.set(r.visitDate, arr);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rs]) => ({
      date,
      nps: computeNps(rs),
      count: rs.length,
      promoters:  rs.filter(r => r.band === 'promoter').length,
      passives:   rs.filter(r => r.band === 'passive').length,
      detractors: rs.filter(r => r.band === 'detractor').length,
    }));
}

export type VisitDayStat = { date: string; filled: number; notFilled: number };

export function visitsByDay(
  visits: Visit[],
  responses: NpsResponse[],
  fromDate: string,
  toDate: string,
  storeId?: string,
): VisitDayStat[] {
  const sv = storeId ? visits.filter(v => v.storeId === storeId) : visits;
  const map = new Map<string, { filled: number; notFilled: number }>();
  const respSet = new Set(responses.map(r => `${r.phone}:${r.visitDate}`));
  for (const v of sv) {
    if (v.visitDate >= fromDate && v.visitDate <= toDate) {
      const entry = map.get(v.visitDate) ?? { filled: 0, notFilled: 0 };
      if (respSet.has(`${v.phone}:${v.visitDate}`)) entry.filled++;
      else entry.notFilled++;
      map.set(v.visitDate, entry);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, s]) => ({ date, ...s }));
}

export type StoreStat = { storeId: string; name: string; nps: number | null; count: number };

export function npsByStore(
  responses: NpsResponse[],
  fromDate: string,
  toDate: string,
): StoreStat[] {
  return STORES.map(s => {
    const rs = responses.filter(r => r.storeId === s.id && r.visitDate >= fromDate && r.visitDate <= toDate);
    return { storeId: s.id, name: s.name, nps: computeNps(rs), count: rs.length };
  });
}
