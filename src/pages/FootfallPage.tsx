import { useState } from 'react';
import { useNps } from '../state/NpsStore';
import type { Visit, NpsResponse } from '../lib/types';
import { today, daysAgoDate, formatDateDisplay } from '../lib/dates';
import { computeNps, bandBreakdown } from '../lib/nps';
import { STORES, ALL_STORES_ID } from '../lib/constants';

type TrailingMonths = 1 | 3 | 6 | 9 | 12;
type CardKey = 'today' | 'yesterday' | 'dby' | 'trailing';

type WindowStats = {
  footfall: number;
  filled: number;
  notFilled: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number | null;
};

const TRAILING_DAYS: Record<TrailingMonths, number> = {
  1: 30, 3: 91, 6: 182, 9: 273, 12: 365,
};

const TOTAL_FOOTFALL = 3069;
const TOTAL_CART     = 2941;
const TOTAL_PI       = 719;
const TOTAL_ORDER    = 657;

const BRANCH_DATA = [
  { name: 'JP NAGAR',   footfall: 1281, cart: 1167, pi: 250, order: 229 },
  { name: 'WHITEFIELD', footfall: 737,  cart: 735,  pi: 197, order: 179 },
  { name: 'YELAHANKA',  footfall: 530,  cart: 525,  pi: 137, order: 125 },
  { name: 'Gachibowli', footfall: 505,  cart: 499,  pi: 128, order: 118 },
  { name: 'Unknown',    footfall: 16,   cart: 15,   pi: 7,   order: 6   },
];

const BM_DATA = [
  { name: 'Aakriti',      footfall: 1,   cart: 0,   pi: 0,  order: 0  },
  { name: 'Abhishek',     footfall: 45,  cart: 43,  pi: 12, order: 11 },
  { name: 'Amrita',       footfall: 89,  cart: 87,  pi: 23, order: 21 },
  { name: 'Anand',        footfall: 67,  cart: 64,  pi: 15, order: 14 },
  { name: 'Anjali',       footfall: 123, cart: 118, pi: 31, order: 28 },
  { name: 'Arun',         footfall: 56,  cart: 54,  pi: 14, order: 13 },
  { name: 'Bhavna',       footfall: 78,  cart: 75,  pi: 19, order: 17 },
  { name: 'Chandana',     footfall: 34,  cart: 32,  pi: 8,  order: 7  },
  { name: 'Deepak',       footfall: 92,  cart: 89,  pi: 24, order: 22 },
  { name: 'Divya',        footfall: 145, cart: 140, pi: 37, order: 34 },
  { name: 'Gopal',        footfall: 61,  cart: 59,  pi: 15, order: 14 },
  { name: 'Harsha',       footfall: 83,  cart: 80,  pi: 21, order: 19 },
  { name: 'Kavya',        footfall: 49,  cart: 47,  pi: 11, order: 10 },
  { name: 'Kiran',        footfall: 108, cart: 104, pi: 27, order: 25 },
  { name: 'Lakshmi',      footfall: 72,  cart: 69,  pi: 18, order: 16 },
  { name: 'Mohan',        footfall: 95,  cart: 91,  pi: 24, order: 22 },
  { name: 'Neeraj',       footfall: 38,  cart: 36,  pi: 9,  order: 8  },
  { name: 'Pavan',        footfall: 117, cart: 113, pi: 30, order: 27 },
  { name: 'Pooja',        footfall: 86,  cart: 83,  pi: 22, order: 20 },
  { name: 'Rahul',        footfall: 64,  cart: 62,  pi: 16, order: 14 },
];

function computeWindowStats(
  visits: Visit[],
  responses: NpsResponse[],
  fromDate: string,
  toDate: string,
  storeId: string,
): WindowStats {
  const scoped = storeId !== ALL_STORES_ID
    ? visits.filter(v => v.storeId === storeId)
    : visits;
  const windowVisits = scoped.filter(v => v.visitDate >= fromDate && v.visitDate <= toDate);
  const footfall = windowVisits.length;
  if (footfall === 0) {
    return { footfall: 0, filled: 0, notFilled: 0, promoters: 0, passives: 0, detractors: 0, nps: null };
  }
  const responseMap = new Map(responses.map(r => [`${r.phone}:${r.visitDate}`, r]));
  const filledResponses = windowVisits
    .map(v => responseMap.get(`${v.phone}:${v.visitDate}`))
    .filter((r): r is NpsResponse => r !== undefined);
  const bd = bandBreakdown(filledResponses);
  return {
    footfall,
    filled: filledResponses.length,
    notFilled: footfall - filledResponses.length,
    promoters: bd.promoters,
    passives: bd.passives,
    detractors: bd.detractors,
    nps: computeNps(filledResponses),
  };
}

function fmtPct(num: number, denom: number): string {
  if (denom === 0) return 'N/A';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function npsDisplay(nps: number | null): string {
  if (nps === null) return 'N/A';
  return nps > 0 ? `+${nps}` : `${nps}`;
}

function npsColor(nps: number | null): string {
  if (nps === null) return '#9CA3AF';
  if (nps >= 50) return '#15803D';
  if (nps >= 0) return '#D97706';
  return '#B91C1C';
}

function monthRangeDisplay(): string {
  const t = today();
  const [y, m] = t.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return `01/${mm}/${y} - ${String(last).padStart(2, '0')}/${mm}/${y}`;
}

// Shared progress bar: same component used in conv% table cells and NPS drill-down
function ProgBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#F3F4F6', height: 4 }}>
      <div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, height: 4 }} />
    </div>
  );
}

// Conv% cell: percentage text + progress bar, used in By Branch and By BM tables
function ConvCell({ value, footfall: ff, color }: { value: number; footfall: number; color: string }) {
  const p = ff > 0 ? (value / ff) * 100 : 0;
  return (
    <td className="px-4 py-3" style={{ minWidth: 140 }}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold tabular-nums flex-shrink-0" style={{ color, minWidth: 44, textAlign: 'right' }}>
          {fmtPct(value, ff)}
        </span>
        <ProgBar pct={p} color={color} />
      </div>
    </td>
  );
}

// ValBar: same layout as ConvCell, used inside the NPS drill-down panel
function ValBar({ value, total, color }: { value: number; total: number; color: string }) {
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 200 }}>
      <span
        className="text-xs font-semibold tabular-nums flex-shrink-0"
        style={{ color, minWidth: 44, textAlign: 'right' }}
      >
        {fmtPct(value, total)}
      </span>
      <ProgBar pct={total > 0 ? (value / total) * 100 : 0} color={color} />
      <span
        className="text-xs tabular-nums flex-shrink-0"
        style={{ color: '#9CA3AF', minWidth: 28, textAlign: 'right' }}
      >
        {value}
      </span>
    </div>
  );
}

type NpsTrackerCardProps = {
  label: string;
  subtitle: string;
  stats: WindowStats;
  active: boolean;
  onClick: () => void;
  trailing?: boolean;
  trailingMonths?: TrailingMonths;
  onTrailingChange?: (m: TrailingMonths) => void;
};

// NPS Tracker card: same visual style as the 4 summary KPI cards above it
function NpsTrackerCard({
  label, subtitle, stats, active, onClick,
  trailing, trailingMonths, onTrailingChange,
}: NpsTrackerCardProps) {
  return (
    <div
      className="flex-1 rounded-xl p-5 flex flex-col gap-1 cursor-pointer select-none"
      style={{
        background: '#fff',
        border: active ? '2px solid #F59E0B' : '1px solid #ECECEF',
        boxShadow: active
          ? '0 0 0 3px rgba(245,158,11,0.12)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'border 0.15s, box-shadow 0.15s',
      }}
      onClick={onClick}
      role="button"
      aria-pressed={active}
    >
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
            className="text-xs rounded border"
            style={{
              border: '1px solid #ECECEF',
              color: '#374151',
              outline: 'none',
              background: '#F9FAFB',
              cursor: 'pointer',
              padding: '1px 4px',
            }}
          >
            <option value={1}>1 month</option>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={9}>9 months</option>
            <option value={12}>12 months</option>
          </select>
        )}
      </div>
      <p className="text-3xl font-bold" style={{ color: npsColor(stats.nps) }}>
        {npsDisplay(stats.nps)}
      </p>
      <p className="text-xs" style={{ color: '#9CA3AF' }}>
        {stats.filled} response{stats.filled !== 1 ? 's' : ''}
      </p>
      <p className="text-xs" style={{ color: '#D1D5DB' }}>{subtitle}</p>
    </div>
  );
}

type ExpandedPanelProps = {
  stats: WindowStats;
  showFilled: boolean;
  onFilledClick: () => void;
};

function ExpandedPanel({ stats, showFilled, onFilledClick }: ExpandedPanelProps) {
  const { footfall, filled, notFilled, promoters, passives, detractors } = stats;

  return (
    <div className="px-5 pb-5">
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #ECECEF' }}>

        {/* Total footfall: context count, no bar */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid #F3F4F6' }}
        >
          <span className="text-sm font-medium" style={{ color: '#374151' }}>Total footfall</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: '#111827' }}>{footfall}</span>
        </div>

        {/* Filled: clickable, with progress bar */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          style={{ borderBottom: '1px solid #F3F4F6' }}
          onClick={onFilledClick}
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-medium" style={{ color: '#374151' }}>Filled</span>
            <span
              style={{
                display: 'inline-block',
                fontSize: 10,
                color: '#9CA3AF',
                transform: showFilled ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s',
                lineHeight: 1,
              }}
            >
              &#9654;
            </span>
          </div>
          <ValBar value={filled} total={footfall} color="#1F2937" />
        </div>

        {/* Filled sub-rows: promoters, passives, detractors with progress bars */}
        {showFilled && (
          <>
            <div
              className="flex items-center justify-between py-2.5"
              style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', paddingLeft: 32, paddingRight: 16 }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#15803D' }} />
                <span className="text-sm" style={{ color: '#374151' }}>Promoters</span>
              </div>
              <ValBar value={promoters} total={filled} color="#15803D" />
            </div>
            <div
              className="flex items-center justify-between py-2.5"
              style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', paddingLeft: 32, paddingRight: 16 }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#D97706' }} />
                <span className="text-sm" style={{ color: '#374151' }}>Passives</span>
              </div>
              <ValBar value={passives} total={filled} color="#D97706" />
            </div>
            <div
              className="flex items-center justify-between py-2.5"
              style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', paddingLeft: 32, paddingRight: 16 }}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#B91C1C' }} />
                <span className="text-sm" style={{ color: '#374151' }}>Detractors</span>
              </div>
              <ValBar value={detractors} total={filled} color="#B91C1C" />
            </div>
          </>
        )}

        {/* Not filled: with progress bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium flex-shrink-0" style={{ color: '#374151' }}>Not filled</span>
          <ValBar value={notFilled} total={footfall} color="#9CA3AF" />
        </div>

      </div>
    </div>
  );
}

export default function FootfallPage() {
  const { state } = useNps();
  const [selectedBranch, setSelectedBranch] = useState(ALL_STORES_ID);
  const [trailingMonths, setTrailingMonths] = useState<TrailingMonths>(1);
  const [expandedCard, setExpandedCard] = useState<CardKey | null>(null);
  const [showFilled, setShowFilled] = useState(false);
  const [bmSearch, setBmSearch] = useState('');

  const t         = today();
  const yday      = daysAgoDate(1);
  const dby       = daysAgoDate(2);
  const trailFrom = daysAgoDate(TRAILING_DAYS[trailingMonths] - 1);

  const todayStats    = computeWindowStats(state.visits, state.responses, t,         t,    selectedBranch);
  const ydayStats     = computeWindowStats(state.visits, state.responses, yday,      yday, selectedBranch);
  const dbyStats      = computeWindowStats(state.visits, state.responses, dby,       dby,  selectedBranch);
  const trailingStats = computeWindowStats(state.visits, state.responses, trailFrom, t,    selectedBranch);

  function handleCardClick(key: CardKey) {
    if (expandedCard === key) {
      setExpandedCard(null);
      setShowFilled(false);
    } else {
      setExpandedCard(key);
      setShowFilled(false);
    }
  }

  const statsMap: Record<CardKey, WindowStats> = {
    today: todayStats, yesterday: ydayStats, dby: dbyStats, trailing: trailingStats,
  };

  const filteredBm = BM_DATA.filter(bm =>
    bm.name.toLowerCase().includes(bmSearch.toLowerCase()),
  );

  const branchLabel = selectedBranch !== ALL_STORES_ID
    ? STORES.find(s => s.id === selectedBranch)?.name ?? ''
    : '';

  // Shared table header cell style
  const thStyle = { color: '#9CA3AF' };
  const thClass = 'text-xs font-semibold uppercase tracking-wider px-4 py-3';

  return (
    <div className="flex-1 px-6 py-6 space-y-5 overflow-auto" style={{ background: '#F7F7F8' }}>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider flex-shrink-0" style={{ color: '#9CA3AF' }}>
          Filter
        </span>

        <div className="relative flex items-center">
          <span
            className="absolute left-3 w-2 h-2 rounded-full pointer-events-none"
            style={{ background: '#3B82F6' }}
          />
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="pl-7 pr-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
            style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none' }}
          >
            <option value={ALL_STORES_ID}>Branch: All</option>
            {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="relative flex items-center">
          <span
            className="absolute left-3 w-2 h-2 rounded-full pointer-events-none"
            style={{ background: '#7C3AED' }}
          />
          <select
            className="pl-7 pr-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
            style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none' }}
          >
            <option>BM: All</option>
            {BM_DATA.map(b => <option key={b.name}>{b.name}</option>)}
          </select>
        </div>

        <span
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: '#F59E0B', border: '1px solid #F59E0B', color: '#1c1917' }}
        >
          {monthRangeDisplay()}
        </span>

        <div className="relative flex items-center">
          <span
            className="absolute left-3 w-2 h-2 rounded-full pointer-events-none"
            style={{ background: '#16A34A' }}
          />
          <select
            className="pl-7 pr-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
            style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none' }}
          >
            <option>Category: All</option>
          </select>
        </div>

        <button
          onClick={() => setSelectedBranch(ALL_STORES_ID)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border hover:bg-red-50 transition-colors"
          style={{ border: '1px solid #EF4444', color: '#EF4444', background: '#fff' }}
        >
          &#10005; Clear
        </button>

        <button
          className="px-3 py-1.5 rounded-full text-sm border hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #ECECEF', color: '#374151', background: '#fff' }}
        >
          Export CSV
        </button>

        <div className="flex-1" />
        <span className="text-sm font-medium" style={{ color: '#374151' }}>
          {TOTAL_FOOTFALL.toLocaleString('en-IN')} clients
        </span>
      </div>

      {/* 4 KPI summary cards: all identical white style, only value color differs */}
      <div className="flex gap-4">
        <div
          className="flex-1 rounded-xl p-5 flex flex-col gap-1"
          style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Footfall Clients
          </p>
          <p className="text-3xl font-bold" style={{ color: '#111827' }}>
            {TOTAL_FOOTFALL.toLocaleString('en-IN')}
          </p>
        </div>
        <div
          className="flex-1 rounded-xl p-5 flex flex-col gap-1"
          style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Cart Clients
          </p>
          <p className="text-3xl font-bold" style={{ color: '#2563EB' }}>
            {TOTAL_CART.toLocaleString('en-IN')}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_CART, TOTAL_FOOTFALL)} of footfall</p>
        </div>
        <div
          className="flex-1 rounded-xl p-5 flex flex-col gap-1"
          style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            PI Clients
          </p>
          <p className="text-3xl font-bold" style={{ color: '#7C3AED' }}>
            {TOTAL_PI.toLocaleString('en-IN')}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_PI, TOTAL_FOOTFALL)} of footfall</p>
        </div>
        <div
          className="flex-1 rounded-xl p-5 flex flex-col gap-1"
          style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
            Order Clients
          </p>
          <p className="text-3xl font-bold" style={{ color: '#16A34A' }}>
            {TOTAL_ORDER.toLocaleString('en-IN')}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_ORDER, TOTAL_FOOTFALL)} of footfall</p>
        </div>
      </div>

      {/* NPS Tracker: same card style as the 4 summary cards above */}
      <div
        className="rounded-xl"
        style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-bold" style={{ color: '#111827' }}>NPS Tracker</h2>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Net Promoter Score by visit window{branchLabel ? ` (${branchLabel})` : ''}
          </p>
        </div>
        <div className="flex gap-4 px-5 pb-5">
          <NpsTrackerCard
            label="Today"
            subtitle={formatDateDisplay(t)}
            stats={todayStats}
            active={expandedCard === 'today'}
            onClick={() => handleCardClick('today')}
          />
          <NpsTrackerCard
            label="Yesterday"
            subtitle={formatDateDisplay(yday)}
            stats={ydayStats}
            active={expandedCard === 'yesterday'}
            onClick={() => handleCardClick('yesterday')}
          />
          <NpsTrackerCard
            label="Day before yesterday"
            subtitle={formatDateDisplay(dby)}
            stats={dbyStats}
            active={expandedCard === 'dby'}
            onClick={() => handleCardClick('dby')}
          />
          <NpsTrackerCard
            label={`Last ${trailingMonths} month${trailingMonths > 1 ? 's' : ''}`}
            subtitle={`${formatDateDisplay(trailFrom)} to ${formatDateDisplay(t)}`}
            stats={trailingStats}
            active={expandedCard === 'trailing'}
            onClick={() => handleCardClick('trailing')}
            trailing
            trailingMonths={trailingMonths}
            onTrailingChange={m => {
              setTrailingMonths(m);
              setShowFilled(false);
            }}
          />
        </div>
        {expandedCard && (
          <ExpandedPanel
            stats={statsMap[expandedCard]}
            showFilled={showFilled}
            onFilledClick={() => setShowFilled(f => !f)}
          />
        )}
      </div>

      {/* By Branch */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold" style={{ color: '#111827' }}>By Branch</h2>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{BRANCH_DATA.length} rows</span>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #ECECEF' }}>
              <th className={`${thClass} text-left`} style={thStyle}>By Branch</th>
              <th className={`${thClass} text-right`} style={thStyle}>Footfall</th>
              <th className={`${thClass} text-right`} style={thStyle}>Cart</th>
              <th className={`${thClass} text-right`} style={thStyle}>PI</th>
              <th className={`${thClass} text-right`} style={thStyle}>Order</th>
              <th className={thClass} style={thStyle}>Cart Conv%</th>
              <th className={thClass} style={thStyle}>PI Conv%</th>
              <th className={thClass} style={thStyle}>Order Conv%</th>
            </tr>
          </thead>
          <tbody>
            {BRANCH_DATA.map((row, i) => (
              <tr
                key={row.name}
                style={{ borderBottom: i < BRANCH_DATA.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>
                  {row.footfall.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#2563EB' }}>
                  {row.cart.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#7C3AED' }}>
                  {row.pi.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>
                  {row.order.toLocaleString('en-IN')}
                </td>
                <ConvCell value={row.cart}  footfall={row.footfall} color="#16A34A" />
                <ConvCell value={row.pi}    footfall={row.footfall} color="#D97706" />
                <ConvCell value={row.order} footfall={row.footfall} color="#B91C1C" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By BM */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold" style={{ color: '#111827' }}>By BM</h2>
            <input
              type="text"
              value={bmSearch}
              onChange={e => setBmSearch(e.target.value)}
              placeholder="Search By BM..."
              className="px-3 py-1.5 rounded-full text-sm border bg-white"
              style={{ border: '1px solid #ECECEF', color: '#374151', minWidth: 160, outline: 'none' }}
            />
          </div>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>{filteredBm.length} rows</span>
        </div>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid #ECECEF' }}>
              <th className={`${thClass} text-left`} style={thStyle}>By BM</th>
              <th className={`${thClass} text-right`} style={thStyle}>Footfall</th>
              <th className={`${thClass} text-right`} style={thStyle}>Cart</th>
              <th className={`${thClass} text-right`} style={thStyle}>PI</th>
              <th className={`${thClass} text-right`} style={thStyle}>Order</th>
              <th className={thClass} style={thStyle}>Cart Conv%</th>
              <th className={thClass} style={thStyle}>PI Conv%</th>
              <th className={thClass} style={thStyle}>Order Conv%</th>
            </tr>
          </thead>
          <tbody>
            {filteredBm.map((row, i) => (
              <tr
                key={row.name}
                style={{ borderBottom: i < filteredBm.length - 1 ? '1px solid #F3F4F6' : 'none' }}
              >
                <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>
                  {row.footfall}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#2563EB' }}>
                  {row.cart}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#7C3AED' }}>
                  {row.pi}
                </td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>
                  {row.order}
                </td>
                <ConvCell value={row.cart}  footfall={row.footfall} color="#16A34A" />
                <ConvCell value={row.pi}    footfall={row.footfall} color="#D97706" />
                <ConvCell value={row.order} footfall={row.footfall} color="#B91C1C" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
