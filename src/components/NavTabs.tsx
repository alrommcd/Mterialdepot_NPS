import type { NavTab } from '../lib/types';

const TABS: { id: NavTab; label: string }[] = [
  { id: 'leads',       label: 'Leads' },
  { id: 'dashboard',   label: 'Dashboard' },
  { id: 'footfall',    label: 'Footfall' },
  { id: 'funnel',      label: 'Weekly Funnel' },
  { id: 'report',      label: 'Report Card' },
  { id: 'store-visit', label: 'Store Visit Form' },
  { id: 'escalation',  label: 'Escalation visibility' },
  { id: 'admin',       label: 'Admin' },
  { id: 'nps',         label: 'NPS' },
];

type Props = {
  active: NavTab;
  onChange: (tab: NavTab) => void;
};

export default function NavTabs({ active, onChange }: Props) {
  return (
    <nav style={{ background: '#0F1115' }} className="w-full px-6 border-t border-gray-800">
      <div className="flex items-end gap-0">
        {TABS.map(tab => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200',
              ].join(' ')}
              style={{ outline: 'none', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: '#F59E0B' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
