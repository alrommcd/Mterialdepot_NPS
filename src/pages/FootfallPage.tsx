import { useState } from 'react';
import { STORES, ALL_STORES_ID } from '../lib/constants';
import { today } from '../lib/dates';

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
  { name: 'Aakriti',    footfall: 1,   cart: 0,   pi: 0,  order: 0  },
  { name: 'Abhishek',   footfall: 45,  cart: 43,  pi: 12, order: 11 },
  { name: 'Amrita',     footfall: 89,  cart: 87,  pi: 23, order: 21 },
  { name: 'Anand',      footfall: 67,  cart: 64,  pi: 15, order: 14 },
  { name: 'Anjali',     footfall: 123, cart: 118, pi: 31, order: 28 },
  { name: 'Arun',       footfall: 56,  cart: 54,  pi: 14, order: 13 },
  { name: 'Bhavna',     footfall: 78,  cart: 75,  pi: 19, order: 17 },
  { name: 'Chandana',   footfall: 34,  cart: 32,  pi: 8,  order: 7  },
  { name: 'Deepak',     footfall: 92,  cart: 89,  pi: 24, order: 22 },
  { name: 'Divya',      footfall: 145, cart: 140, pi: 37, order: 34 },
  { name: 'Gopal',      footfall: 61,  cart: 59,  pi: 15, order: 14 },
  { name: 'Harsha',     footfall: 83,  cart: 80,  pi: 21, order: 19 },
  { name: 'Kavya',      footfall: 49,  cart: 47,  pi: 11, order: 10 },
  { name: 'Kiran',      footfall: 108, cart: 104, pi: 27, order: 25 },
  { name: 'Lakshmi',    footfall: 72,  cart: 69,  pi: 18, order: 16 },
  { name: 'Mohan',      footfall: 95,  cart: 91,  pi: 24, order: 22 },
  { name: 'Neeraj',     footfall: 38,  cart: 36,  pi: 9,  order: 8  },
  { name: 'Pavan',      footfall: 117, cart: 113, pi: 30, order: 27 },
  { name: 'Pooja',      footfall: 86,  cart: 83,  pi: 22, order: 20 },
  { name: 'Rahul',      footfall: 64,  cart: 62,  pi: 16, order: 14 },
];

function fmtPct(num: number, denom: number): string {
  if (denom === 0) return 'N/A';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function monthRangeDisplay(): string {
  const t = today();
  const [y, m] = t.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return `01/${mm}/${y} - ${String(last).padStart(2, '0')}/${mm}/${y}`;
}

function ProgBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="flex-1 rounded-full overflow-hidden" style={{ background: '#F3F4F6', height: 4 }}>
      <div style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, height: 4 }} />
    </div>
  );
}

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

export default function FootfallPage() {
  const [selectedBranch, setSelectedBranch] = useState(ALL_STORES_ID);
  const [bmSearch, setBmSearch] = useState('');

  const filteredBm = BM_DATA.filter(bm =>
    bm.name.toLowerCase().includes(bmSearch.toLowerCase()),
  );

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
          <span className="absolute left-3 w-2 h-2 rounded-full pointer-events-none" style={{ background: '#3B82F6' }} />
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
          <span className="absolute left-3 w-2 h-2 rounded-full pointer-events-none" style={{ background: '#7C3AED' }} />
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
          <span className="absolute left-3 w-2 h-2 rounded-full pointer-events-none" style={{ background: '#16A34A' }} />
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

      {/* 4 KPI cards */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-xl p-5 flex flex-col gap-1" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Footfall Clients</p>
          <p className="text-3xl font-bold" style={{ color: '#111827' }}>{TOTAL_FOOTFALL.toLocaleString('en-IN')}</p>
        </div>
        <div className="flex-1 rounded-xl p-5 flex flex-col gap-1" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Cart Clients</p>
          <p className="text-3xl font-bold" style={{ color: '#2563EB' }}>{TOTAL_CART.toLocaleString('en-IN')}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_CART, TOTAL_FOOTFALL)} of footfall</p>
        </div>
        <div className="flex-1 rounded-xl p-5 flex flex-col gap-1" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>PI Clients</p>
          <p className="text-3xl font-bold" style={{ color: '#7C3AED' }}>{TOTAL_PI.toLocaleString('en-IN')}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_PI, TOTAL_FOOTFALL)} of footfall</p>
        </div>
        <div className="flex-1 rounded-xl p-5 flex flex-col gap-1" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Order Clients</p>
          <p className="text-3xl font-bold" style={{ color: '#16A34A' }}>{TOTAL_ORDER.toLocaleString('en-IN')}</p>
          <p className="text-xs" style={{ color: '#9CA3AF' }}>{fmtPct(TOTAL_ORDER, TOTAL_FOOTFALL)} of footfall</p>
        </div>
      </div>

      {/* By Branch */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
              <tr key={row.name} style={{ borderBottom: i < BRANCH_DATA.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>{row.footfall.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#2563EB' }}>{row.cart.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#7C3AED' }}>{row.pi.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>{row.order.toLocaleString('en-IN')}</td>
                <ConvCell value={row.cart}  footfall={row.footfall} color="#16A34A" />
                <ConvCell value={row.pi}    footfall={row.footfall} color="#D97706" />
                <ConvCell value={row.order} footfall={row.footfall} color="#B91C1C" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* By BM */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
              <tr key={row.name} style={{ borderBottom: i < filteredBm.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{row.name}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>{row.footfall}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#2563EB' }}>{row.cart}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium" style={{ color: '#7C3AED' }}>{row.pi}</td>
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: '#374151' }}>{row.order}</td>
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
