import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useNps } from '../../state/NpsStore';
import { ALL_STORES_ID } from '../../lib/constants';
import {
  rangeStats, npsByDay, visitsByDay, npsByStore,
} from '../../lib/nps';
import { formatDateDisplay } from '../../lib/dates';

// ---------- helpers ----------

function npsColor(nps: number | null): string {
  if (nps === null) return '#9CA3AF';
  if (nps >= 50) return '#15803D';
  if (nps >= 0) return '#D97706';
  return '#B91C1C';
}

function fmtNps(nps: number | null): string {
  if (nps === null) return 'N/A';
  return nps > 0 ? `+${nps}` : `${nps}`;
}

function fmtPct(n: number | null): string {
  if (n === null) return 'N/A';
  return `${n.toFixed(1)}%`;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

// ---------- small card ----------

function SummaryCard({
  label, value, sub, color,
}: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div
      className="flex-1 rounded-xl p-5 flex flex-col gap-1"
      style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  );
}

// ---------- custom tooltip for NPS trend ----------

function NpsTip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { nps: number | null; count: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { nps, count } = payload[0].payload;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: '#1F2937', color: '#F9FAFB', border: 'none' }}
    >
      <p className="font-semibold mb-1">{label}</p>
      <p>NPS: <span style={{ color: npsColor(nps) }}>{fmtNps(nps)}</span></p>
      <p style={{ color: '#9CA3AF' }}>{count} response{count !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ---------- custom tooltip for response trend ----------

function RespTip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: '#1F2937', color: '#F9FAFB' }}
    >
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ---------- main ----------

export default function OverviewTab() {
  const { state } = useNps();
  const storeId = state.selectedStoreId !== ALL_STORES_ID ? state.selectedStoreId : undefined;

  const stats = useMemo(
    () => rangeStats(state.visits, state.responses, state.fromDate, state.toDate, storeId),
    [state.visits, state.responses, state.fromDate, state.toDate, storeId],
  );

  const trendData = useMemo(
    () => npsByDay(state.responses, state.fromDate, state.toDate, storeId)
      .map(d => ({ ...d, label: shortDate(d.date), fullDate: formatDateDisplay(d.date), npsVal: d.nps ?? 0 })),
    [state.responses, state.fromDate, state.toDate, storeId],
  );

  const respTrend = useMemo(
    () => visitsByDay(state.visits, state.responses, state.fromDate, state.toDate, storeId)
      .map(d => ({ ...d, label: shortDate(d.date) })),
    [state.visits, state.responses, state.fromDate, state.toDate, storeId],
  );

  const storeData = useMemo(
    () => npsByStore(state.responses, state.fromDate, state.toDate)
      .filter(s => s.count > 0)
      .map(s => ({ ...s, npsVal: s.nps ?? 0 })),
    [state.responses, state.fromDate, state.toDate],
  );

  const bandData = [
    { name: 'Promoters',  value: stats.promoters,  color: '#15803D' },
    { name: 'Passives',   value: stats.passives,    color: '#D97706' },
    { name: 'Detractors', value: stats.detractors,  color: '#B91C1C' },
  ];

  const chartCard = (title: string, children: React.ReactNode) => (
    <div
      className="rounded-xl p-5"
      style={{ background: '#fff', border: '1px solid #ECECEF', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <p className="text-sm font-bold mb-4" style={{ color: '#111827' }}>{title}</p>
      {children}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* Summary cards */}
      <div className="flex gap-4">
        <SummaryCard
          label="Period NPS"
          value={fmtNps(stats.nps)}
          sub={`${stats.responseCount} response${stats.responseCount !== 1 ? 's' : ''}`}
          color={npsColor(stats.nps)}
        />
        <SummaryCard
          label="Response Rate"
          value={fmtPct(stats.responseRate)}
          sub={`${stats.responseCount} of ${stats.visitCount} visits`}
          color="#2563EB"
        />
        <SummaryCard
          label="Promoters"
          value={String(stats.promoters)}
          sub={stats.responseCount > 0 ? `${((stats.promoters / stats.responseCount) * 100).toFixed(1)}% of responses` : 'no responses'}
          color="#15803D"
        />
        <SummaryCard
          label="Detractors"
          value={String(stats.detractors)}
          sub={stats.responseCount > 0 ? `${((stats.detractors / stats.responseCount) * 100).toFixed(1)}% of responses` : 'no responses'}
          color="#B91C1C"
        />
      </div>

      {/* NPS trend + Band distribution */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {chartCard('NPS Score by Day',
          trendData.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No responses in this period</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={trendData} barSize={28} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[-100, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NpsTip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Bar dataKey="npsVal" radius={[4, 4, 0, 0]}>
                    {trendData.map((d, i) => (
                      <Cell key={i} fill={npsColor(d.nps)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ),
        )}

        {chartCard('Response Breakdown',
          stats.responseCount === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No responses yet</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={bandData}
                  layout="vertical"
                  barSize={22}
                  margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(v: number, name: string) => [
                      `${v} (${stats.responseCount > 0 ? ((v / stats.responseCount) * 100).toFixed(1) : 0}%)`,
                      name,
                    ]}
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {bandData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ),
        )}
      </div>

      {/* Response trend + NPS by store */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 1fr' }}>

        {chartCard('Daily Response Trend',
          respTrend.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No visits in this period</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={respTrend} barSize={16} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RespTip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="filled" name="Filled" stackId="a" fill="#15803D" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="notFilled" name="Not filled" stackId="a" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ),
        )}

        {chartCard('NPS by Store',
          storeData.length === 0
            ? <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>No data</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={storeData}
                  layout="vertical"
                  barSize={22}
                  margin={{ top: 4, right: 40, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                  <XAxis type="number" domain={[-100, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    formatter={(v: number) => [fmtNps(v), 'NPS']}
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#F9FAFB', fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#F9FAFB' }}
                  />
                  <Bar dataKey="npsVal" radius={[0, 4, 4, 0]}>
                    {storeData.map((d, i) => (
                      <Cell key={i} fill={npsColor(d.nps)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ),
        )}
      </div>

    </div>
  );
}
