import { useMemo } from 'react';
import { useNps } from '../../state/NpsStore';
import { kpisFor } from '../../lib/nps';
import { ALL_STORES_ID } from '../../lib/constants';
import KpiCard from './KpiCard';

export default function KpiRow() {
  const { state } = useNps();
  const storeId = state.selectedStoreId === ALL_STORES_ID ? undefined : state.selectedStoreId;

  const kpis = useMemo(
    () => kpisFor(state.responses, storeId),
    [state.responses, storeId],
  );

  return (
    <div className="flex gap-4">
      <KpiCard
        label="Today's NPS"
        value={kpis.todayNps}
        count={kpis.todayCount}
        accent="#475569"
      />
      <KpiCard
        label="Last 90 Days NPS"
        value={kpis.quarterNps}
        count={kpis.quarterCount}
        accent="#2563EB"
      />
      <KpiCard
        label="All-Time NPS"
        value={kpis.allTimeNps}
        count={kpis.allTimeCount}
        accent="#15803D"
      />
    </div>
  );
}
