export type Store = { id: string; name: string };

export type Visit = {
  id: string;
  name: string;
  phone: string;        // 10-digit, no +91
  storeId: string;
  visitDate: string;    // 'YYYY-MM-DD' IST
  visitTime: string;    // 'HH:mm' display
  createdAt: string;    // ISO timestamp
};

export type ReasonKey =
  | 'pricing'
  | 'collection'
  | 'service_delivery'
  | 'sales_experience';

export type Band = 'promoter' | 'passive' | 'detractor';

export type NpsResponse = {
  id: string;
  visitId: string;
  name: string;
  phone: string;
  storeId: string;
  visitDate: string;
  score: number;         // 0..10
  understood: boolean;   // Q2
  reasons: ReasonKey[];  // Q3
  suggestion: string;    // Q4
  band: Band;
  submittedAt: string;   // ISO timestamp
};

export type NavTab =
  | 'leads'
  | 'dashboard'
  | 'footfall'
  | 'funnel'
  | 'report'
  | 'store-visit'
  | 'escalation'
  | 'admin'
  | 'nps';
