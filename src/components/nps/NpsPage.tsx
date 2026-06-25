import { useState } from 'react';
import { useNps } from '../../state/NpsStore';
import { STORES, ALL_STORES_ID } from '../../lib/constants';
import NpsFilters from './NpsFilters';
import OverviewTab from './OverviewTab';
import CustomerTable from './CustomerTable';
import NpsFormModal from './NpsFormModal';
import Toast from './Toast';

type NpsTab = 'tracker' | 'overview';

const TAB_LABELS: Record<NpsTab, string> = {
  tracker:  'Tracker',
  overview: 'Overview',
};

export default function NpsPage() {
  const { state } = useNps();
  const [activeTab, setActiveTab] = useState<NpsTab>('tracker');

  const storeLabel =
    state.selectedStoreId === ALL_STORES_ID
      ? 'All Stores'
      : STORES.find(s => s.id === state.selectedStoreId)?.name ?? '';

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#F7F7F8' }}>

      {/* Header + filters */}
      <div className="px-6 pt-6 pb-0 space-y-4">
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#111827' }}>NPS Tracker</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Net Promoter Score, {storeLabel}
          </p>
        </div>

        <NpsFilters />

        {/* Tab bar, styled like the Escalation module */}
        <div className="flex gap-0" style={{ borderBottom: '2px solid #E5E7EB' }}>
          {(Object.keys(TAB_LABELS) as NpsTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 text-sm font-semibold transition-colors relative"
              style={{
                color: activeTab === tab ? '#111827' : '#9CA3AF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && (
                <span
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: 2, background: '#F59E0B', borderRadius: 2, bottom: -2 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto px-6 py-5">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'tracker'  && <CustomerTable />}
      </div>

      {/* Modals */}
      {state.openVisitId && <NpsFormModal />}
      <Toast />
    </div>
  );
}
