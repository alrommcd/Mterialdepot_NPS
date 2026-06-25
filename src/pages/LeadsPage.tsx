import { useState, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeadStatus =
  | 'In Cart'
  | 'Quote Approval Pending'
  | 'Availability Check'
  | 'Hold Stock'
  | 'Order Placed'
  | 'Order Confirmed'
  | 'Partly Shipped'
  | 'Shipped'
  | 'Partly Delivered'
  | 'Delivered';

type Lead = {
  id: string;
  name: string;
  phone: string;
  created: string;
  assignee: string;
  branch: string;
  clientType: string;
  propertyType: string;
  architectDesigner: string;
  projectPhase: string;
  status: LeadStatus;
  cartItems: string;
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const LEADS: Lead[] = [
  { id: 'ENQ20260619975382', name: 'ravindran',   phone: '9742804753', created: '19 Jun 2026', assignee: 'Anand Alikana',     branch: 'WHITEFIELD', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Order Placed',          cartItems: 'Laminates' },
  { id: 'CT665F00157445',    name: 'Shiva',        phone: '9488536969', created: '19 Jun 2026', assignee: 'Abdul Aziz Faizan', branch: 'JP NAGAR',   clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'In Cart',              cartItems: 'Laminates' },
  { id: 'CT309800249152',    name: 'Shivkumar',    phone: '9738106965', created: '19 Jun 2026', assignee: 'Rishin Mather',     branch: 'YELAHANKA',  clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'In Cart',              cartItems: 'Laminates' },
  { id: 'CTBCCF00284721',    name: 'adithya',      phone: '9939859661', created: '19 Jun 2026', assignee: 'Pulla Abhilash',    branch: 'WHITEFIELD', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'In Cart',              cartItems: 'Laminates' },
  { id: 'CT45600349921',     name: 'Suresh Kumar', phone: '9876000111', created: '18 Jun 2026', assignee: 'Anand Alikana',     branch: 'GACHIBOWLI', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Order Confirmed',       cartItems: 'Vitrified Tiles' },
  { id: 'ENQ20260618112233', name: 'Preethi',      phone: '9901122334', created: '18 Jun 2026', assignee: 'Rishin Mather',     branch: 'WHITEFIELD', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Quote Approval Pending', cartItems: 'Marble' },
  { id: 'CT123400567890',    name: 'Ramesh Babu',  phone: '9812233445', created: '17 Jun 2026', assignee: 'Abdul Aziz Faizan', branch: 'JP NAGAR',   clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Delivered',            cartItems: 'Granite' },
  { id: 'CTAABB00123456',    name: 'Kavitha',      phone: '9900098765', created: '17 Jun 2026', assignee: 'Pulla Abhilash',    branch: 'YELAHANKA',  clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Shipped',              cartItems: 'Wall Tiles' },
  { id: 'CT77701234567',     name: 'Naveen Raj',   phone: '9811123456', created: '16 Jun 2026', assignee: 'Anand Alikana',     branch: 'JP NAGAR',   clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Order Confirmed',       cartItems: 'Floor Tiles' },
  { id: 'ENQ20260615334455', name: 'Divya',        phone: '9988001122', created: '15 Jun 2026', assignee: 'Rishin Mather',     branch: 'WHITEFIELD', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'In Cart',              cartItems: 'Laminates' },
  { id: 'CT99900765432',     name: 'Karthik',      phone: '9870011223', created: '14 Jun 2026', assignee: 'Abdul Aziz Faizan', branch: 'GACHIBOWLI', clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Partly Delivered',     cartItems: 'Ceramic Tiles' },
  { id: 'CTDDEE00998877',    name: 'Meenakshi',    phone: '9765543210', created: '13 Jun 2026', assignee: 'Pulla Abhilash',    branch: 'YELAHANKA',  clientType: '—', propertyType: '—', architectDesigner: 'No', projectPhase: '—', status: 'Hold Stock',           cartItems: 'Marble' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inr(value: number, decimals = 2): string {
  return '₹' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

const AVATAR_COLORS = ['#F59E0B', '#8B5CF6', '#3B82F6', '#EC4899', '#10B981', '#F97316', '#06B6D4', '#EF4444'];
function avatarColor(name: string): string {
  const sum = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}
function initials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_STYLE: Record<LeadStatus, { bg: string; color: string }> = {
  'In Cart':                 { bg: '#EFF6FF', color: '#2563EB' },
  'Quote Approval Pending':  { bg: '#FFFBEB', color: '#D97706' },
  'Availability Check':      { bg: '#F3F4F6', color: '#6B7280' },
  'Hold Stock':              { bg: '#FEF3C7', color: '#92400E' },
  'Order Placed':            { bg: '#FFF7ED', color: '#EA580C' },
  'Order Confirmed':         { bg: '#F0FDF4', color: '#16A34A' },
  'Partly Shipped':          { bg: '#ECFDF5', color: '#059669' },
  'Shipped':                 { bg: '#DCFCE7', color: '#15803D' },
  'Partly Delivered':        { bg: '#D1FAE5', color: '#065F46' },
  'Delivered':               { bg: '#DCFCE7', color: '#15803D' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PipelineKpiRow() {
  const total  = 638474000.35;
  const active = 267648624.7;
  const won    = 157153096.64;
  const lost   = 213672279.01;

  // bar widths proportional to value vs total
  const pWon    = (won    / total) * 100;
  const pActive = (active / total) * 100;
  const pLost   = (lost   / total) * 100;

  return (
    <div className="px-6 pt-5 pb-0" style={{ background: '#fff' }}>
      <div className="grid gap-0" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'TOTAL PIPELINE VALUE', value: inr(total),  sub: '25 leads',    color: '#111827' },
          { label: 'ACTIVE PIPELINE',       value: inr(active), sub: '5527 leads',  color: '#D97706' },
          { label: 'WON',                   value: inr(won),    sub: '5864 leads',  color: '#16A34A' },
          { label: 'LOST / REFUNDED',       value: inr(lost),   sub: '4655 leads',  color: '#6B7280' },
        ].map(k => (
          <div key={k.label} className="pr-6 pb-4">
            <p className="text-xs font-semibold tracking-wider mb-1" style={{ color: '#9CA3AF' }}>{k.label}</p>
            <p className="font-bold leading-tight" style={{ color: k.color, fontSize: 26 }}>{k.value}</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{k.sub}</p>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="flex h-1.5 w-full overflow-hidden">
        <div style={{ width: `${pWon}%`,    background: '#22C55E' }} />
        <div style={{ width: `${pActive}%`, background: '#F59E0B' }} />
        <div style={{ width: `${pLost}%`,   background: '#D1D5DB' }} />
      </div>
    </div>
  );
}

type StatusChip = {
  count: number;
  label: string;
  amount: number | null;
  countColor: string;
  amountColor: string;
};

const CHIPS: StatusChip[] = [
  { count: 5333, label: 'IN CART',                amount: 254739073.42, countColor: '#111827', amountColor: '#D97706' },
  { count: 192,  label: 'QUOTE APPROVAL PENDING', amount: 12692022.28,  countColor: '#D97706', amountColor: '#D97706' },
  { count: 0,    label: 'AVAILABILITY CHECK',     amount: null,         countColor: '#9CA3AF', amountColor: '#9CA3AF' },
  { count: 2,    label: 'HOLD STOCK',             amount: 217529,       countColor: '#111827', amountColor: '#111827' },
  { count: 95,   label: 'ORDER PLACED',           amount: 2743454,      countColor: '#EA580C', amountColor: '#EA580C' },
  { count: 2760, label: 'ORDER CONFIRMED',        amount: 64082193,     countColor: '#111827', amountColor: '#111827' },
  { count: 0,    label: 'PARTLY SHIPPED',         amount: null,         countColor: '#9CA3AF', amountColor: '#9CA3AF' },
  { count: 91,   label: 'SHIPPED',               amount: 3338321,      countColor: '#16A34A', amountColor: '#16A34A' },
  { count: 6,    label: 'PARTLY DELIVERED',       amount: 196492,       countColor: '#16A34A', amountColor: '#16A34A' },
  { count: 2912, label: 'DELIVERED',              amount: 86792636,     countColor: '#16A34A', amountColor: '#16A34A' },
];

function StatusChipsRow() {
  return (
    <div className="overflow-x-auto" style={{ background: '#fff', borderTop: '1px solid #F3F4F6' }}>
      <div className="flex" style={{ minWidth: 'max-content' }}>
        {CHIPS.map((chip, i) => (
          <div
            key={chip.label}
            className="flex-shrink-0 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{
              borderRight: i < CHIPS.length - 1 ? '1px solid #F3F4F6' : undefined,
              minWidth: 130,
            }}
          >
            <p className="font-bold text-xl leading-tight" style={{ color: chip.countColor }}>
              {chip.count.toLocaleString('en-IN')}
            </p>
            <p className="text-xs mt-0.5 font-medium tracking-wide" style={{ color: '#9CA3AF', lineHeight: 1.3 }}>
              {chip.label}
            </p>
            {chip.amount !== null ? (
              <p className="text-xs mt-0.5 font-medium" style={{ color: chip.amountColor }}>
                {inr(chip.amount, 0)}
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: '#E5E7EB' }}>—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const FILTER_PILLS = ['Status', 'Salesperson', 'Branch', 'Created', 'Follow-up', 'Closure', 'Category', '₹ > 0'];

function SearchActionBar({ search, onSearch }: { search: string; onSearch: (v: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-6 py-3"
      style={{ background: '#fff', borderTop: '1px solid #F3F4F6' }}
    >
      {/* Search */}
      <div className="relative" style={{ width: 280 }}>
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-9 pr-3 py-1.5 text-sm outline-none rounded"
          style={{ border: '1px solid #E5E7EB', color: '#111827', background: '#FAFAFA' }}
        />
      </div>

      <div className="flex-1" />

      {/* Action buttons */}
      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded" style={{ border: '1px solid #D1D5DB', color: '#374151', background: '#fff' }}>
        15 selected
        <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {['Download Template', 'Upload CSV', 'Kylas Sync'].map(label => (
        <button
          key={label}
          className="px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-50 transition-colors"
          style={{ border: '1px solid #D1D5DB', color: '#374151', background: '#fff' }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FilterRow() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div
      className="flex items-center gap-2 px-6 py-2 flex-wrap"
      style={{ background: '#fff', borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #E5E7EB' }}
    >
      {FILTER_PILLS.map(pill => (
        <button
          key={pill}
          onClick={() => setActive(p => p === pill ? null : pill)}
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-colors"
          style={{
            border: active === pill ? '1px solid #1F2937' : '1px solid #D1D5DB',
            color: active === pill ? '#1F2937' : '#6B7280',
            background: active === pill ? '#F9FAFB' : '#fff',
          }}
        >
          {pill}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ))}
      <select
        className="px-3 py-1 text-xs font-medium rounded outline-none"
        style={{ border: '1px solid #D1D5DB', color: '#6B7280', background: '#fff', cursor: 'pointer' }}
        defaultValue="Tasks"
      >
        <option>Tasks</option>
        <option>All tasks</option>
        <option>Pending tasks</option>
      </select>
    </div>
  );
}

function LeadIdBadge({ id }: { id: string }) {
  const isEnq = id.startsWith('ENQ');
  return (
    <span
      className="inline-block text-xs font-mono px-2 py-0.5 rounded"
      style={{
        background: isEnq ? '#EFF6FF' : '#F3F4F6',
        color: isEnq ? '#2563EB' : '#374151',
        border: `1px solid ${isEnq ? '#BFDBFE' : '#E5E7EB'}`,
        letterSpacing: '-0.01em',
      }}
    >
      {id}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const bg = avatarColor(name);
  const ini = initials(name);
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
      style={{ width: 28, height: 28, background: bg, fontSize: 11 }}
    >
      {ini}
    </span>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

const SORT_COLS = ['name', 'phone', 'created', 'assignee', 'branch'] as const;
type SortCol = typeof SORT_COLS[number];

function LeadsTable({ leads }: { leads: Lead[] }) {
  const [sortCol, setSortCol]   = useState<SortCol>('created');
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortCol, sortDir]);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: SortCol }) => (
    <span className="ml-1 inline-flex flex-col" style={{ fontSize: 8, lineHeight: 1, color: sortCol === col ? '#374151' : '#D1D5DB' }}>
      <span style={{ opacity: sortDir === 'asc' && sortCol === col ? 1 : 0.4 }}>▲</span>
      <span style={{ opacity: sortDir === 'desc' && sortCol === col ? 1 : 0.4 }}>▼</span>
    </span>
  );

  const thStyle: React.CSSProperties = {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    whiteSpace: 'nowrap',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  return (
    <div className="flex-1 overflow-auto">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            <th style={thStyle}>LEAD ID</th>
            {(['name', 'phone', 'created', 'assignee', 'branch'] as SortCol[]).map(col => (
              <th
                key={col}
                style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => toggleSort(col)}
              >
                {col === 'name'     ? 'CLIENT NAME' :
                 col === 'phone'    ? 'CLIENT PHONE' :
                 col === 'created'  ? 'CREATED' :
                 col === 'assignee' ? 'ASSIGNED TO' :
                 'BRANCH'}
                <SortIcon col={col} />
              </th>
            ))}
            <th style={thStyle}>CLIENT TYPE</th>
            <th style={thStyle}>PROPERTY TYPE</th>
            <th style={thStyle}>ARCHITECT/DESIGNER</th>
            <th style={thStyle}>PROJECT PHASE</th>
            <th style={thStyle}>STATUS</th>
            <th style={thStyle}>CART ITEMS</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr
              key={lead.id}
              className="hover:bg-blue-50 cursor-pointer transition-colors"
              style={{ borderBottom: '1px solid #F3F4F6' }}
            >
              <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                <LeadIdBadge id={lead.id} />
              </td>
              <td style={{ padding: '10px 12px', color: '#111827', fontWeight: 500 }}>{lead.name}</td>
              <td style={{ padding: '10px 12px', color: '#374151' }}>{lead.phone}</td>
              <td style={{ padding: '10px 12px', color: '#374151', whiteSpace: 'nowrap' }}>{lead.created}</td>
              <td style={{ padding: '10px 12px' }}>
                <div className="flex items-center gap-2">
                  <Avatar name={lead.assignee} />
                  <span style={{ color: '#374151', whiteSpace: 'nowrap' }}>{lead.assignee}</span>
                </div>
              </td>
              <td style={{ padding: '10px 12px', color: '#374151', fontWeight: 500 }}>{lead.branch}</td>
              <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.clientType}</td>
              <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.propertyType}</td>
              <td style={{ padding: '10px 12px', color: '#374151' }}>{lead.architectDesigner}</td>
              <td style={{ padding: '10px 12px', color: '#9CA3AF' }}>{lead.projectPhase}</td>
              <td style={{ padding: '10px 12px' }}><StatusBadge status={lead.status} /></td>
              <td style={{ padding: '10px 12px', color: '#374151' }}>{lead.cartItems}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return LEADS;
    const q = search.toLowerCase();
    return LEADS.filter(
      l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.id.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className="flex flex-col" style={{ background: '#fff', flex: 1, overflow: 'hidden' }}>
      <PipelineKpiRow />
      <StatusChipsRow />
      <SearchActionBar search={search} onSearch={setSearch} />
      <FilterRow />
      <LeadsTable leads={filtered} />
    </div>
  );
}
