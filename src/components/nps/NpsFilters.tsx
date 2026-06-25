import { useNps } from '../../state/NpsStore';
import { STORES, ALL_STORES_ID } from '../../lib/constants';
import { today, monthStart } from '../../lib/dates';

export default function NpsFilters() {
  const { state, dispatch } = useNps();

  const isFiltered =
    state.selectedStoreId !== ALL_STORES_ID ||
    state.fromDate !== monthStart() ||
    state.toDate !== today();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Store */}
      <div className="relative flex items-center">
        <span
          className="absolute left-3 w-2 h-2 rounded-full pointer-events-none"
          style={{ background: '#3B82F6' }}
        />
        <select
          value={state.selectedStoreId}
          onChange={e => dispatch({ type: 'SET_STORE', storeId: e.target.value })}
          className="pl-7 pr-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
          style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none' }}
        >
          <option value={ALL_STORES_ID}>All Stores</option>
          {STORES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* From date */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>From</span>
        <input
          type="date"
          value={state.fromDate}
          max={state.toDate}
          onChange={e => dispatch({ type: 'SET_FROM_DATE', date: e.target.value })}
          className="px-3 py-1.5 rounded-full text-sm border cursor-pointer"
          style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none', background: '#fff' }}
        />
      </div>

      {/* To date */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>To</span>
        <input
          type="date"
          value={state.toDate}
          min={state.fromDate}
          max={today()}
          onChange={e => dispatch({ type: 'SET_TO_DATE', date: e.target.value })}
          className="px-3 py-1.5 rounded-full text-sm border cursor-pointer"
          style={{
            border: '1px solid #F59E0B',
            color: '#1c1917',
            outline: 'none',
            background: '#FEF3C7',
            fontWeight: 600,
          }}
        />
      </div>

      {/* Clear */}
      {isFiltered && (
        <button
          onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
          className="px-3 py-1.5 rounded-full text-sm border flex items-center gap-1 hover:bg-red-50 transition-colors"
          style={{ border: '1px solid #EF4444', color: '#EF4444', background: '#fff' }}
        >
          &#10005; Clear
        </button>
      )}
    </div>
  );
}
