import { useNps } from '../../state/NpsStore';
import { STORES, ALL_STORES_ID } from '../../lib/constants';
import { today } from '../../lib/dates';

export default function NpsFilters() {
  const { state, dispatch } = useNps();
  const isFiltered =
    state.selectedStoreId !== ALL_STORES_ID ||
    state.selectedDate !== today() ||
    state.searchQuery !== '';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Store select */}
      <select
        value={state.selectedStoreId}
        onChange={e => dispatch({ type: 'SET_STORE', storeId: e.target.value })}
        className="px-3 py-1.5 rounded-full text-sm border bg-white cursor-pointer"
        style={{ border: '1px solid #ECECEF', color: '#374151', outline: 'none' }}
      >
        <option value={ALL_STORES_ID}>All Stores</option>
        {STORES.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      {/* Date filter */}
      <input
        type="date"
        value={state.selectedDate}
        onChange={e => dispatch({ type: 'SET_DATE', date: e.target.value })}
        className="px-3 py-1.5 rounded-full text-sm border cursor-pointer"
        style={
          state.selectedDate === today()
            ? { background: '#F59E0B', border: '1px solid #F59E0B', color: '#1c1917', outline: 'none', fontWeight: 600 }
            : { background: '#fff', border: '1px solid #ECECEF', color: '#374151', outline: 'none' }
        }
      />

      {/* Search */}
      <input
        type="text"
        value={state.searchQuery}
        onChange={e => dispatch({ type: 'SET_SEARCH', query: e.target.value })}
        placeholder="Search name or phone…"
        className="px-3 py-1.5 rounded-full text-sm border bg-white"
        style={{ border: '1px solid #ECECEF', color: '#374151', minWidth: 200, outline: 'none' }}
      />

      {/* Clear */}
      {isFiltered && (
        <button
          onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
          className="px-3 py-1.5 rounded-full text-sm border flex items-center gap-1 hover:bg-red-50 transition-colors"
          style={{ border: '1px solid #EF4444', color: '#EF4444', background: '#fff' }}
        >
          ✕ Clear
        </button>
      )}

    </div>
  );
}
