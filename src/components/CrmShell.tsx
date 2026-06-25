import { useState } from 'react';
import type { NavTab } from '../lib/types';
import TopNav from './TopNav';
import NavTabs from './NavTabs';
import NpsPage from './nps/NpsPage';
import LeadsPage from '../pages/LeadsPage';
import FootfallPage from '../pages/FootfallPage';
import PlaceholderPage from '../pages/PlaceholderPage';

const TAB_LABELS: Record<NavTab, string> = {
  leads:         'Leads',
  dashboard:     'Dashboard',
  footfall:      'Footfall',
  funnel:        'Weekly Funnel',
  report:        'Report Card',
  'store-visit': 'Store Visit Form',
  escalation:    'Escalation visibility',
  admin:         'Admin',
  nps:           'NPS',
};

export default function CrmShell() {
  const [activeTab, setActiveTab] = useState<NavTab>('leads');

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F7F8' }}>
      <TopNav />
      <NavTabs active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'leads'    && <LeadsPage />}
        {activeTab === 'nps'      && <NpsPage />}
        {activeTab === 'footfall' && <FootfallPage />}
        {activeTab !== 'leads' && activeTab !== 'nps' && activeTab !== 'footfall' && (
          <PlaceholderPage label={TAB_LABELS[activeTab]} />
        )}
      </main>
    </div>
  );
}
