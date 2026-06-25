import { useNps } from '../../state/NpsStore';
import { STORES, ALL_STORES_ID } from '../../lib/constants';
import NpsFilters from './NpsFilters';
import KpiRow from './KpiRow';
import CustomerTable from './CustomerTable';
import NpsFormModal from './NpsFormModal';
import Toast from './Toast';

export default function NpsPage() {
  const { state } = useNps();

  const storeLabel =
    state.selectedStoreId === ALL_STORES_ID
      ? 'All Stores'
      : STORES.find(s => s.id === state.selectedStoreId)?.name ?? '';

  return (
    <div className="flex-1 px-6 py-6 space-y-5" style={{ background: '#F7F7F8' }}>
      {/* Page title */}
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#111827' }}>NPS Tracker</h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          Net Promoter Score · {storeLabel}
        </p>
      </div>

      {/* Filters */}
      <NpsFilters />

      {/* KPI cards */}
      <KpiRow />

      {/* Customer table */}
      <CustomerTable />

      {/* Modals */}
      {state.openVisitId && <NpsFormModal />}

      {/* Toast */}
      <Toast />
    </div>
  );
}
