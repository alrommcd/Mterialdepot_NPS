import type { Store, ReasonKey } from './types';

export const STORES: Store[] = [
  { id: 'jp-nagar',   name: 'JP Nagar' },
  { id: 'whitefield', name: 'Whitefield' },
  { id: 'yelahanka',  name: 'Yelahanka' },
  { id: 'gachibowli', name: 'Gachibowli' },
];

export const REASON_LABELS: Record<ReasonKey, string> = {
  pricing:          'Pricing / Budget Expectations',
  collection:       'Collection / Product Preference',
  service_delivery: 'Service & Delivery Timelines',
  sales_experience: 'Sales Experience',
};

export const ALL_STORES_ID = '__all__';
