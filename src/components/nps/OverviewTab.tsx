import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { useNps } from '../../state/NpsStore';
import { ALL_STORES_ID } from '../../lib/constants';
import { today, daysAgoDate, formatDateDisplay } from '../../lib/dates';
import { rangeStats, npsByDay } from '../../lib/nps';
import type { RangeStats, DayStat } from '../../lib/nps';

// ---------- muted palette ----------
const C_FILLED    = '#7A9E8A';  // muted teal-green
const C_PROMOTER  = '#5A8A67';  // muted green
const C_PASSIVE   = '#A89040';  // muted amber
const C_DETRACTOR = '#9E5858';  // muted red
const C_UNFILLED  = '#C8CACF';  // light gray
const C_LINE      = '#7A98B8';  // muted steel-blue for trend line

function mutedNpsColor(nps: number | null): string {
  if (nps === null) return '#9CA3AF';
  if (nps >= 30) return '#4B7A5E';
  if (nps >= 0)  return '#8A7A3E';
  return '#7A4B4B';
}

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

// ---------- period definitions ----------

type Period = { key: string; label: string; from: string; to: string };

function makePeriods(t: string): Period[] {
  return [
    { key: 'today', label: 'Today',         from: t,                 to: t              },
    { key: 'yday',  label: 'Yesterday',      from: daysAgoDate(1),   to: daysAgoDate(1) },
    { key: 'dby',   label: 'Day before',     from: daysAgoDate(2),   to: daysAgoDate(2) },
    { key: '1m',    label: '1 month',        from: daysAgoDate(29),  to: t              },
    { key: '3m',    label: '3 months',       from: daysAgoDate(89),  to: t              },
    { key: '6m',    label: '6 months',       from: daysAgoDate(181), to: t              },
    { key: '9m',    label: '9 months',       from: daysAgoDate(272), to: t              },
    { key: '12m',   label: '12 months',      from: daysAgoDate(364), to: t              },
  ];
}

// ---------- trend summary text ----------

type TrendPoint = DayStat & { label: string; npsVal: number };

function trendSummary(data: TrendPoint[]): string {
  const valid = data.filter(d => d.count > 0);
  if (valid.length < 3) return 'Not enough data to assess the trend.';

  const mid       = Math.floor(valid.length / 2);
  const firstHalf = valid.slice(0, mid);
  const secondHalf = valid.slice(mid);
  const avg = (arr: TrendPoint[]) => arr.reduce((s, d) => s + d.npsVal, 0) / arr.length;
  const diff = avg(secondHalf) - avg(firstHalf);
  const recent = Math.round(avg(secondHalf));
  const recentStr = recent > 0 ? `+${recent}` : `${recent}`;

  if (Math.abs(diff) < 5) return `NPS relatively flat this period (recent avg ${recentStr}).`;
  if (diff > 0)           return `NPS trending up this period (recent avg ${recentStr}).`;
  return                         `NPS trending down this period (recent avg ${recentStr}).`;
}

// ---------- thin bar ----------

function ThinBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div
      style={{
        flex: 1, height: 3, borderRadius: 2,
        background: '#EFEFEF', margin: '0 12px', flexShrink: 0,
      }}
    >
      <div
        style={{
          width: `${Math.min(Math.max(pct, 0), 100)}%`,
          height: 3, borderRadius: 2, background: color,
        }}
      />
    </div>
  );
}

// ---------- period card ----------

type PeriodCardProps = {
  period: Period;
  stats: RangeStats;
  active: boolean;
  onClick: () => void;
};

function PeriodCard({ period, stats, active, onClick }: PeriodCardProps) {
  return (
    <div
      role="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        background: '#fff',
        border: active ? '1.5px solid #B4BAC4' : '1px solid #ECECEF',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        boxShadow: active
          ? '0 2px 8px rgba(0,0,0,0.07)'
          : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'border 0.12s, box-shadow 0.12s',
        userSelect: 'none',
      }}
    >
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: 6,
      }}>
        {period.label}
      </p>
      <p style={{
        fontSize: 26, fontWeight: 700,
        color: mutedNpsColor(stats.nps),
        lineHeight: 1.1, marginBottom: 4,
      }}>
        {npsDisplay(stats.nps)}
      </p>
      <p style={{ fontSize: 11, color: '#B4BCC4' }}>
        {stats.responseCount} response{stats.responseCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

// ---------- expanded panel ----------

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
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 0', paddingLeft: indent ? 24 : 0,
    }}>
      <span style={{ fontSize: 13, color: '#374151', minWidth: 148, flexShrink: 0 }}>
        {label}
      </span>
      <ThinBar pct={total > 0 ? (value / total) * 100 : 0} color={color} />
      <span style={{
        fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap',
        minWidth: 104, textAlign: 'right', flexShrink: 0,
      }}>
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
      <div style={{
        background: '#fff', border: '1px solid #ECECEF',
        borderRadius: 12, padding: '20px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 13, color: '#9CA3AF' }}>No visits recorded for this period.</p>
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #ECECEF',
      borderRadius: 12, padding: '14px 20px',
    }}>
      {/* Total footfall */}
      <div style={{
        display: 'flex', alignItems: 'center',
        paddingBottom: 10, borderBottom: '1px solid #F3F4F6',
      }}>
        <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>Total footfall</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{visitCount}</span>
      </div>

      {/* Filled row: clickable */}
      <div
        onClick={onFilledClick}
        style={{
          display: 'flex', alignItems: 'center', cursor: 'pointer',
          padding: '8px 0', borderBottom: '1px solid #F3F4F6',
        }}
      >
        <span style={{
          fontSize: 13, color: '#374151', minWidth: 148,
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
        }}>
          Filled NPS form
          <span style={{
            fontSize: 9, color: '#9CA3AF',
            transform: showFilled ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.12s',
            display: 'inline-block', lineHeight: 1,
          }}>
            &#9654;
          </span>
        </span>
        <ThinBar
          pct={visitCount > 0 ? (responseCount / visitCount) * 100 : 0}
          color={C_FILLED}
        />
        <span style={{
          fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap',
          minWidth: 104, textAlign: 'right', flexShrink: 0,
        }}>
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
        <span style={{ fontSize: 13, color: '#374151', minWidth: 148, flexShrink: 0 }}>
          Did not fill
        </span>
        <ThinBar
          pct={visitCount > 0 ? (notFilled / visitCount) * 100 : 0}
          color={C_UNFILLED}
        />
        <span style={{
          fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap',
          minWidth: 104, textAlign: 'right', flexShrink: 0,
        }}>
          {notFilled} ({pctStr(notFilled, visitCount)})
        </span>
      </div>
    </div>
  );
}

// ---------- trend chart tooltip ----------

type TipPayload = { value: number; payload: TrendPoint };

function TrendTip({
  active, payload, label,
}: {
  active?: boolean;
  payload?: TipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const { nps, count } = payload[0].payload;
  return (
    <div style={{
      background: '#2C3542', color: '#F5F6F7',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 3 }}>{label}</p>
      <p>NPS: {npsDisplay(nps)}</p>
      <p style={{ color: '#9CA3AF' }}>{count} response{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ---------- trend chart ----------

function TrendChart({ data, summary }: { data: TrendPoint[]; summary: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #ECECEF',
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 14,
      }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Daily NPS</p>
        <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 340, textAlign: 'right' }}>
          {summary}
        </p>
      </div>

      {data.length < 2 ? (
        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', padding: '24px 0' }}>
          No responses in the selected date range.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false} tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[-100, 100]}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              axisLine={false} tickLine={false}
            />
            <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="3 3" />
            <Tooltip content={<TrendTip />} />
            <Line
              type="monotone"
              dataKey="npsVal"
              stroke={C_LINE}
              strokeWidth={1.5}
              dot={{ r: 2, fill: C_LINE, stroke: 'none' }}
              activeDot={{ r: 3, fill: C_LINE }}
              connectNulls={false}
            />
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

  const [openPeriod, setOpenPeriod] = useState<string | null>(null);
  const [showFilled, setShowFilled] = useState(false);

  const t = today();
  const periods = useMemo(() => makePeriods(t), [t]);

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

      {/* 4 x 2 grid of period cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {periods.map(p => (
          <PeriodCard
            key={p.key}
            period={p}
            stats={periodStats[p.key]}
            active={openPeriod === p.key}
            onClick={() => handleCardClick(p.key)}
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
