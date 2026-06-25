import { useMemo, useState } from 'react';
import { useNps } from '../../state/NpsStore';
import { ALL_STORES_ID, STORES } from '../../lib/constants';
import { formatDateDisplay } from '../../lib/dates';
import StatusBadge from './StatusBadge';
import ResultBadge from './ResultBadge';
import EmptyState from './EmptyState';

export default function CustomerTable() {
  const { state, dispatch } = useNps();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return state.visits
      .filter(v => {
        const storeMatch =
          state.selectedStoreId === ALL_STORES_ID ||
          v.storeId === state.selectedStoreId;
        const dateMatch =
          v.visitDate >= state.fromDate && v.visitDate <= state.toDate;
        const textMatch =
          !q ||
          v.name.toLowerCase().includes(q) ||
          v.phone.includes(search);
        return storeMatch && dateMatch && textMatch;
      })
      .map(v => {
        const resp = state.responses.find(
          r => r.phone === v.phone && r.visitDate === v.visitDate,
        );
        return { visit: v, response: resp ?? null };
      });
  }, [state.visits, state.responses, state.selectedStoreId, state.fromDate, state.toDate, search]);

  return (
    <div className="space-y-3">
      {/* Search bar inside the Tracker tab */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search name or phone..."
        className="px-3 py-1.5 rounded-full text-sm border bg-white"
        style={{ border: '1px solid #ECECEF', color: '#374151', minWidth: 220, outline: 'none' }}
      />

      {rows.length === 0
        ? <EmptyState />
        : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #ECECEF', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #ECECEF' }}>
                  {['Name', 'Phone', 'Store', 'Visit Date', 'Time', 'Status', 'Result'].map(col => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#9CA3AF' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ visit, response }, idx) => {
                  const status = response ? 'Submitted' : 'Pending';
                  return (
                    <tr
                      key={visit.id}
                      onClick={() => dispatch({ type: 'OPEN_FORM', visitId: visit.id })}
                      className="cursor-pointer transition-colors hover:bg-blue-50"
                      style={{ borderBottom: idx < rows.length - 1 ? '1px solid #F3F4F6' : undefined }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#111827' }}>{visit.name}</td>
                      <td className="px-4 py-3" style={{ color: '#374151' }}>+91 {visit.phone}</td>
                      <td className="px-4 py-3" style={{ color: '#374151' }}>{storeLabel(visit.storeId)}</td>
                      <td className="px-4 py-3" style={{ color: '#374151' }}>{formatDateDisplay(visit.visitDate)}</td>
                      <td className="px-4 py-3" style={{ color: '#6B7280' }}>{visit.visitTime}</td>
                      <td className="px-4 py-3"><StatusBadge status={status} /></td>
                      <td className="px-4 py-3">
                        {response
                          ? <ResultBadge score={response.score} band={response.band} />
                          : <span className="text-gray-400 text-xs">--</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2 text-xs" style={{ color: '#9CA3AF', borderTop: '1px solid #F3F4F6' }}>
              {rows.length} customer{rows.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
    </div>
  );
}

function storeLabel(storeId: string): string {
  return STORES.find(s => s.id === storeId)?.name ?? storeId;
}
