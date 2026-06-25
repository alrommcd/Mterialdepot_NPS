import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useNps } from '../../state/NpsStore';
import { ALL_STORES_ID } from '../../lib/constants';
import { today, daysAgoDate } from '../../lib/dates';
import { rangeStats, npsByDay } from '../../lib/nps';
import type { RangeStats, DayStat } from '../../lib/nps';

// ---------- drill-down muted palette (unchanged) ----------
const C_FILLED    = '#7A9E8A';
const C_PROMOTER  = '#5A8A67';
const C_PASSIVE   = '#A89040';
const C_DETRACTOR = '#9E5858';
const C_UNFILLED  = '#C8CACF';
const C_LINE      = '#7A98B8';

// ---------- exact tokens from Footfall summary cards ----------
const CARD_BORDER_NORMAL = '1px solid #ECECEF';
const CARD_SHADOW_NORMAL = '0 1px 4px rgba(0,0,0,0.06)';
const CARD_BORDER_ACTIVE = '1.5px solid #D1D5DB';
const CARD_SHADOW_ACTIVE = '0 2px 8px rgba(0,0,0,0.08)';

// ---------- trailing window ----------
type TrailingMonths = 1 | 3 | 6 | 9 | 12;
const TRAILING_DAYS: Record<TrailingMonths, number> = {
  1: 30, 3: 91, 6: 182, 9: 273, 12: 365,
};

// ---------- helpers ----------
type Period = { key: string; label: string; from: string; to: string };

function npsDisplay(nps: number | null): string {
  if (nps === null) return 'N/A';
  return nps > 0 ? `+${nps}` : `${nps}`;
}

function pctStr(n: number, d: number): string {
  if (d === 0) return '0%';
  return `${((n / d) * 100).toFixed(1)}%`;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

// ---------- trend summary ----------
type TrendPoint = DayStat & { label: string; npsVal: number };

function trendSummary(data: TrendPoint[]): string {
  const valid = data.filter(d => d.count > 0);
  if (valid.length < 3) return 'Not enough data to assess the trend.';
  const mid = Math.floor(valid.length / 2);
  const avg = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.npsVal, 0) / arr.length;
  const diff = avg(valid.slice(mid)) - avg(valid.slice(0, mid));
  const recent = Math.round(avg(valid.slice(mid)));
  const recentStr = recent > 0 ? `+${recent}` : `${recent}`;
  if (Math.abs(diff) < 5) return `NPS relatively flat this period (recent avg ${recentStr}).`;
  if (diff > 0)           return `NPS trending up this period (recent avg ${recentStr}).`;
  return                         `NPS trending down this period (recent avg ${recentStr}).`;
}

// ---------- thin bar (drill-down only) ----------
function ThinBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 3, borderRadius: 2, background: '#EFEFEF', margin: '0 12px', flexShrink: 0 }}>
      <div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, height: 3, borderRadius: 2, background: color }} />
    </div>
  );
}

// ---------- period card: same classes and tokens as Footfall summary cards ----------
type PeriodCardProps = {
  period: Period;
  stats: RangeStats;
  active: boolean;
  onClick: () => void;
  trailing?: boolean;
  trailingMonths?: TrailingMonths;
  onTrailingChange?: (m: TrailingMonths) => void;
};

function PeriodCard({
  period, stats, active, onClick,
  trailing, trailingMonths, onTrailingChange,
}: PeriodCardProps) {
  const label = trailing && trailingMonths
    ? `${trailingMonths} Month${trailingMonths > 1 ? 's' : ''}`
    : period.label;

  return (
    <div
      role="button"
      aria-pressed={active}
      onClick={onClick}
      className="flex-1 rounded-xl p-5 flex flex-col gap-1"
      style={{
        background: '#fff',
        border: active ? CARD_BORDER_ACTIVE : CARD_BORDER_NORMAL,
        boxShadow: active ? CARD_SHADOW_ACTIVE : CARD_SHADOW_NORMAL,
        cursor: 'pointer',
        transition: 'border 0.12s, box-shadow 0.12s',
        userSelect: 'none',
      }}
    >
      {/* Label row with optional trailing dropdown */}
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
          {label}
        </p>
        {trailing && onTrailingChange && trailingMonths !== undefined && (
          <select
            value={trailingMonths}
            onChange={e => {
              e.stopPropagation();
              onTrailingChange(Number(e.target.value) as TrailingMonths);
            }}
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: 11, border: '1px solid #ECECEF', borderRadius: 4,
              color: '#374151', outline: 'none', background: '#F9FAFB',
              cursor: 'pointer', padding: '1px 4px',
            }}
          >
            <option value={1}>1 mo</option>
            <option value={3}>3 mo</option>
            <option value={6}>6 mo</option>
            <option value={9}>9 mo</option>
            <option value={12}>12 mo</option>
          </select>
        )}
      </div>

      {/* NPS value: same style as Footfall Clients card (#111827, text-3xl font-bold) */}
      <p className="text-3xl font-bold" style={{ color: '#111827' }}>
        {npsDisplay(stats.nps)}
      </p>

      {/* Subtitle: same style as Footfall subtitle (text-xs, #9CA3AF) */}
      <p className="text-xs" style={{ color: '#9CA3AF' }}>
        {stats.responseCount} response{stats.responseCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ---------- expanded panel (unchanged) ----------
type ExpandedPanelProps = {
  stats: RangeStats;
  showFilled: boolean;
  onFilledClick: () => void;
};

function StatRow({
  label, value, total, color, indent = false,
}: {
  label: string; value: number; total: number; color: string; indent?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', paddingLeft: indent ? 24 : 0 }}>
      <span style={{ fontSize: 13, color: '#374151', minWidth: 148, flexShrink: 0 }}>{label}</span>
      <ThinBar pct={total > 0 ? (value / total) * 100 : 0} color={color} />
      <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 104, textAlign: 'right', flexShrink: 0 }}>
        {value} ({pctStr(value, total)})
      </span>
    </div>
  );
}

function ExpandedPanel({ stats, showFilled, onFilledClick }: ExpandedPanelProps) {
  const { visitCount, responseCount, promoters, passives, detractors } = stats;
  const notFilled = visitCount - responseCount;

  if (visitCount === 0) {
    return (
      <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 12, padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No visits recorded for this period.</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 12, padding: '14px 20px' }}>
      {/* Total footfall */}
      <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #F3F4F6' }}>
        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>Total footfall</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{visitCount}</span>
      </div>

      {/* Filled: clickable */}
      <div
        onClick={onFilledClick}
        style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}
      >
        <span style={{ fontSize: 13, color: '#374151', minWidth: 148, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
          Filled NPS form
          <span style={{ fontSize: 9, color: '#9CA3AF', transform: showFilled ? 'rotate(90deg)' : 'none', transition: 'transform 0.12s', display: 'inline-block', lineHeight: 1 }}>
            &#9654;
          </span>
        </span>
        <ThinBar pct={visitCount > 0 ? (responseCount / visitCount) * 100 : 0} color={C_FILLED} />
        <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 104, textAlign: 'right', flexShrink: 0 }}>
          {responseCount} ({pctStr(responseCount, visitCount)})
        </span>
      </div>

      {/* Promoters, passives, detractors */}
      {showFilled && responseCount > 0 && (
        <div style={{ background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', padding: '2px 0' }}>
          <StatRow label="Promoters"  value={promoters}  total={responseCount} color={C_PROMOTER}  indent />
          <StatRow label="Passives"   value={passives}   total={responseCount} color={C_PASSIVE}   indent />
          <StatRow label="Detractors" value={detractors} total={responseCount} color={C_DETRACTOR} indent />
        </div>
      )}

      {/* Did not fill */}
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8 }}>
        <span style={{ fontSize: 13, color: '#374151', minWidth: 148, flexShrink: 0 }}>Did not fill</span>
        <ThinBar pct={visitCount > 0 ? (notFilled / visitCount) * 100 : 0} color={C_UNFILLED} />
        <span style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', minWidth: 104, textAlign: 'right', flexShrink: 0 }}>
          {notFilled} ({pctStr(notFilled, visitCount)})
        </span>
      </div>
    </div>
  );
}

// ---------- trend chart tooltip (unchanged) ----------
type TipPayload = { value: number; payload: TrendPoint };

function TrendTip({ active, payload, label }: { active?: boolean; payload?: TipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { nps, count } = payload[0].payload;
  return (
    <div style={{ background: '#2C3542', color: '#F5F6F7', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 3 }}>{label}</p>
      <p>NPS: {npsDisplay(nps)}</p>
      <p style={{ color: '#9CA3AF' }}>{count} response{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ---------- trend chart (unchanged) ----------
function TrendChart({ data, summary }: { data: TrendPoint[]; summary: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #ECECEF', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Daily NPS</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 340, textAlign: 'right' }}>{summary}</p>
      </div>
      {data.length < 2 ? (
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
          No responses in the selected date range.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={[-100, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="3 3" />
            <Tooltip content={<TrendTip />} />
            <Line type="monotone" dataKey="npsVal" stroke={C_LINE} strokeWidth={1.5} dot={{ r: 2, fill: C_LINE, stroke: 'none' }} activeDot={{ r: 3, fill: C_LINE }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ---------- main ----------
export default function OverviewTab() {
  const { state } = useNps();
  const storeId = state.selectedStoreId !== ALL_STORES_ID ? state.selectedStoreId : undefined;

  const [openPeriod, setOpenPeriod]     = useState<string | null>(null);
  const [showFilled, setShowFilled]     = useState(false);
  const [trailingMonths, setTrailingMonths] = useState<TrailingMonths>(1);

  const t = today();

  // Exactly 4 periods: today, yesterday, day before, + 1 trailing card with dropdown
  const periods = useMemo<Period[]>(() => [
    { key: 'today',    label: 'Today',      from: t,                                           to: t              },
    { key: 'yday',     label: 'Yesterday',  from: daysAgoDate(1),                              to: daysAgoDate(1) },
    { key: 'dby',      label: 'Day before', from: daysAgoDate(2),                              to: daysAgoDate(2) },
    { key: 'trailing', label: 'Trailing',   from: daysAgoDate(TRAILING_DAYS[trailingMonths] - 1), to: t           },
  ], [t, trailingMonths]);

  const periodStats = useMemo(() => {
    const out: Record<string, RangeStats> = {};
    for (const p of periods) {
      out[p.key] = rangeStats(state.visits, state.responses, p.from, p.to, storeId);
    }
    return out;
  }, [state.visits, state.responses, storeId, periods]);

  const trendData = useMemo<TrendPoint[]>(() =>
    npsByDay(state.responses, state.fromDate, state.toDate, storeId)
      .map(d => ({ ...d, label: shortDate(d.date), npsVal: d.nps ?? 0 })),
    [state.responses, state.fromDate, state.toDate, storeId],
  );

  const summary = useMemo(() => trendSummary(trendData), [trendData]);

  function handleCardClick(key: string) {
    if (openPeriod === key) {
      setOpenPeriod(null);
      setShowFilled(false);
    } else {
      setOpenPeriod(key);
      setShowFilled(false);
    }
  }

  return (
    <div className="space-y-4">

      {/* 4 cards in a single row, same flex layout as Footfall summary cards */}
      <div className="flex gap-4">
        {periods.map(p => (
          <PeriodCard
            key={p.key}
            period={p}
            stats={periodStats[p.key]}
            active={openPeriod === p.key}
            onClick={() => handleCardClick(p.key)}
            trailing={p.key === 'trailing'}
            trailingMonths={p.key === 'trailing' ? trailingMonths : undefined}
            onTrailingChange={p.key === 'trailing'
              ? m => setTrailingMonths(m)
              : undefined}
          />
        ))}
      </div>

      {/* Inline expanded detail panel */}
      {openPeriod && periodStats[openPeriod] && (
        <ExpandedPanel
          stats={periodStats[openPeriod]}
          showFilled={showFilled}
          onFilledClick={() => setShowFilled(f => !f)}
        />
      )}

      {/* Single Daily NPS trend chart */}
      <TrendChart data={trendData} summary={summary} />

    </div>
  );
}
