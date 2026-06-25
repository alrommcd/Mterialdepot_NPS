import type { Visit, NpsResponse } from './types';
import { today } from './dates';
import { bandFor } from './nps';

const KEY_VISITS    = 'md_nps_visits';
const KEY_RESPONSES = 'md_nps_responses';
const KEY_SEED_VER  = 'md_nps_seed_ver';
const SEED_VERSION  = '3';  // bump this whenever seed data changes

// In-memory fallback when localStorage is unavailable
let memVisits:    Visit[]       = [];
let memResponses: NpsResponse[] = [];
let usingMemory = false;

type StorageError = { message: string };
let lastStorageError: StorageError | null = null;

export function getLastStorageError(): StorageError | null {
  return lastStorageError;
}

function safeGet<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Corrupt: not an array');
    return parsed as T[];
  } catch (err) {
    lastStorageError = { message: `Storage read error (${key}): ${String(err)}` };
    usingMemory = true;
    return fallback;
  }
}

function safeSet<T>(key: string, value: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    lastStorageError = { message: `Storage write error (${key}): ${String(err)}` };
    usingMemory = true;
  }
}

export function loadVisits(): Visit[] {
  if (usingMemory) return memVisits;
  const v = safeGet<Visit>(KEY_VISITS, []);
  if (!usingMemory) memVisits = v;
  return v;
}

export function saveVisits(visits: Visit[]): void {
  memVisits = visits;
  if (!usingMemory) safeSet(KEY_VISITS, visits);
}

export function loadResponses(): NpsResponse[] {
  if (usingMemory) return memResponses;
  const r = safeGet<NpsResponse>(KEY_RESPONSES, []);
  if (!usingMemory) memResponses = r;
  return r;
}

export function saveResponses(responses: NpsResponse[]): void {
  memResponses = responses;
  if (!usingMemory) safeSet(KEY_RESPONSES, responses);
}

export function upsertResponse(
  responses: NpsResponse[],
  incoming: Omit<NpsResponse, 'id' | 'band' | 'submittedAt'> & { id?: string },
): NpsResponse[] {
  const band = bandFor(incoming.score);
  const now  = new Date().toISOString();
  const existing = responses.find(
    r => r.phone === incoming.phone && r.visitDate === incoming.visitDate,
  );
  if (existing) {
    const updated: NpsResponse = { ...existing, ...incoming, band, submittedAt: now };
    const next = responses.map(r => r.id === existing.id ? updated : r);
    saveResponses(next);
    return next;
  }
  const fresh: NpsResponse = {
    ...incoming,
    id: incoming.id ?? crypto.randomUUID(),
    band,
    submittedAt: now,
  };
  const next = [...responses, fresh];
  saveResponses(next);
  return next;
}

// Wipe and re-seed if the stored seed version doesn't match SEED_VERSION.
// This lets us fix seed data without requiring a manual localStorage clear.
function shouldReseed(): boolean {
  try {
    return localStorage.getItem(KEY_SEED_VER) !== SEED_VERSION;
  } catch {
    return false;
  }
}

function markSeeded(): void {
  try {
    localStorage.setItem(KEY_SEED_VER, SEED_VERSION);
  } catch { /* ignore */ }
}

function clearSeedKeys(): void {
  try {
    localStorage.removeItem(KEY_VISITS);
    localStorage.removeItem(KEY_RESPONSES);
  } catch { /* ignore */ }
  memVisits    = [];
  memResponses = [];
}

export function seedIfEmpty(): { visits: Visit[]; responses: NpsResponse[] } {
  // Re-seed if version mismatch (fixes stale demo data)
  if (shouldReseed()) {
    clearSeedKeys();
  } else {
    const existing = loadVisits();
    if (existing.length > 0) {
      return { visits: existing, responses: loadResponses() };
    }
  }

  const t = today();
  const mkDate = (daysAgo: number): string => {
    const [y, m, d] = t.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - daysAgo);
    return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
  };

  const d1 = mkDate(1);   // yesterday
  const d2 = mkDate(2);   // day before yesterday

  const visits: Visit[] = [
    // [0-2] Today, JP Nagar
    { id: crypto.randomUUID(), name: 'Rachna Sharma',        phone: '9876543210', storeId: 'jp-nagar',   visitDate: t,  visitTime: '10:15', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Arjun Mehta',          phone: '9845001234', storeId: 'jp-nagar',   visitDate: t,  visitTime: '11:30', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Priya Nair',           phone: '9900112233', storeId: 'jp-nagar',   visitDate: t,  visitTime: '14:00', createdAt: new Date().toISOString() },
    // [3-4] Today, Whitefield
    { id: crypto.randomUUID(), name: 'Karan Patel',          phone: '9812345678', storeId: 'whitefield', visitDate: t,  visitTime: '09:45', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Sunita Rao',           phone: '9988776655', storeId: 'whitefield', visitDate: t,  visitTime: '13:20', createdAt: new Date().toISOString() },
    // [5-6] Today, Gachibowli
    { id: crypto.randomUUID(), name: 'Vikram Joshi',         phone: '9771234567', storeId: 'gachibowli', visitDate: t,  visitTime: '10:50', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Ananya Krishnan',      phone: '9654321098', storeId: 'gachibowli', visitDate: t,  visitTime: '15:05', createdAt: new Date().toISOString() },
    // [7-8] Today, Yelahanka
    { id: crypto.randomUUID(), name: 'Suresh Kumar',         phone: '9811223344', storeId: 'yelahanka',  visitDate: t,  visitTime: '11:10', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Lakshmi Devi',         phone: '9722334455', storeId: 'yelahanka',  visitDate: t,  visitTime: '14:45', createdAt: new Date().toISOString() },
    // [9] Past within 90d (kept from v2, shifted to index 9)
    { id: crypto.randomUUID(), name: 'Deepak Verma',         phone: '9501234567', storeId: 'jp-nagar',   visitDate: mkDate(20), visitTime: '11:00', createdAt: new Date().toISOString() },
    // [10-16] Yesterday
    { id: crypto.randomUUID(), name: 'Amit Sharma',          phone: '9633445566', storeId: 'jp-nagar',   visitDate: d1, visitTime: '10:20', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Pooja Singh',          phone: '9544556677', storeId: 'jp-nagar',   visitDate: d1, visitTime: '12:05', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Ramesh Kumar',         phone: '9455667788', storeId: 'jp-nagar',   visitDate: d1, visitTime: '15:30', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Kavitha Reddy',        phone: '9366778899', storeId: 'jp-nagar',   visitDate: d1, visitTime: '16:00', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Santosh Pillai',       phone: '9277889900', storeId: 'whitefield', visitDate: d1, visitTime: '09:30', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Divya Menon',          phone: '9188990011', storeId: 'whitefield', visitDate: d1, visitTime: '11:45', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Nikhil Sharma',        phone: '9100112233', storeId: 'gachibowli', visitDate: d1, visitTime: '14:10', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Ganesh Rao',           phone: '9011223344', storeId: 'yelahanka',  visitDate: d1, visitTime: '10:55', createdAt: new Date().toISOString() },
    // [18-25] Day before yesterday
    { id: crypto.randomUUID(), name: 'Karthik Iyer',         phone: '8922334455', storeId: 'jp-nagar',   visitDate: d2, visitTime: '10:00', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Swati Gupta',          phone: '8833445566', storeId: 'jp-nagar',   visitDate: d2, visitTime: '13:15', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Mohit Verma',          phone: '8744556677', storeId: 'jp-nagar',   visitDate: d2, visitTime: '15:45', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Sanjay Patel',         phone: '8655667788', storeId: 'whitefield', visitDate: d2, visitTime: '09:50', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Ritu Agarwal',         phone: '8566778899', storeId: 'whitefield', visitDate: d2, visitTime: '14:30', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Vijay Kumar',          phone: '8477889900', storeId: 'gachibowli', visitDate: d2, visitTime: '11:20', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Rahul Nair',           phone: '8388990011', storeId: 'yelahanka',  visitDate: d2, visitTime: '10:35', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Preeti Sharma',        phone: '8299001122', storeId: 'yelahanka',  visitDate: d2, visitTime: '15:00', createdAt: new Date().toISOString() },
    // [26-30] Days 3-7 ago
    { id: crypto.randomUUID(), name: 'Deepika Rao',          phone: '8200112233', storeId: 'jp-nagar',   visitDate: mkDate(3),  visitTime: '10:40', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Harish Patel',         phone: '8111223344', storeId: 'whitefield', visitDate: mkDate(4),  visitTime: '12:50', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Sundar Krishnan',      phone: '8022334455', storeId: 'gachibowli', visitDate: mkDate(5),  visitTime: '09:15', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Nalini Suresh',        phone: '7933445566', storeId: 'jp-nagar',   visitDate: mkDate(6),  visitTime: '14:20', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Prasad Hegde',         phone: '7844556677', storeId: 'yelahanka',  visitDate: mkDate(7),  visitTime: '11:05', createdAt: new Date().toISOString() },
    // [31-34] Days 8-14 ago
    { id: crypto.randomUUID(), name: 'Mamatha Bhat',         phone: '7755667788', storeId: 'jp-nagar',   visitDate: mkDate(9),  visitTime: '10:30', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Sunil Joshi',          phone: '7666778899', storeId: 'whitefield', visitDate: mkDate(11), visitTime: '13:40', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Padma Venkat',         phone: '7577889900', storeId: 'gachibowli', visitDate: mkDate(13), visitTime: '11:55', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Girish Kumar',         phone: '7488990011', storeId: 'yelahanka',  visitDate: mkDate(14), visitTime: '15:25', createdAt: new Date().toISOString() },
    // [35-37] Days 15-21 ago
    { id: crypto.randomUUID(), name: 'Usha Reddy',           phone: '7399001122', storeId: 'jp-nagar',   visitDate: mkDate(16), visitTime: '10:10', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Rajan Pillai',         phone: '7300112233', storeId: 'whitefield', visitDate: mkDate(18), visitTime: '14:00', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Shilpa Menon',         phone: '7211223344', storeId: 'gachibowli', visitDate: mkDate(20), visitTime: '12:30', createdAt: new Date().toISOString() },
    // [38-39] Days 22-30 ago
    { id: crypto.randomUUID(), name: 'Balaji Rao',           phone: '7122334455', storeId: 'jp-nagar',   visitDate: mkDate(24), visitTime: '09:45', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Suma Bhat',            phone: '7033445566', storeId: 'yelahanka',  visitDate: mkDate(28), visitTime: '13:50', createdAt: new Date().toISOString() },
    // [40-42] Days 31-60 ago (within 3-month trailing window)
    { id: crypto.randomUUID(), name: 'Krishnamurthy S',      phone: '6944556677', storeId: 'jp-nagar',   visitDate: mkDate(35), visitTime: '10:25', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Shantha Bai',          phone: '6855667788', storeId: 'whitefield', visitDate: mkDate(50), visitTime: '11:40', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Ravi Shankar',         phone: '6766778899', storeId: 'yelahanka',  visitDate: mkDate(55), visitTime: '14:15', createdAt: new Date().toISOString() },
    // [43-44] Days 61-90 ago
    { id: crypto.randomUUID(), name: 'Nandini Rao',          phone: '6677889900', storeId: 'jp-nagar',   visitDate: mkDate(65), visitTime: '09:55', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Venkat Subramanian',   phone: '6588990011', storeId: 'gachibowli', visitDate: mkDate(75), visitTime: '13:05', createdAt: new Date().toISOString() },
    // [45-47] Days 91-180 ago (within 6-month trailing window)
    { id: crypto.randomUUID(), name: 'Saraswati Devi',       phone: '6499001122', storeId: 'whitefield', visitDate: mkDate(100), visitTime: '10:45', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Murali Krishna',       phone: '6400112233', storeId: 'jp-nagar',   visitDate: mkDate(130), visitTime: '12:00', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Kamala Patel',         phone: '6311223344', storeId: 'yelahanka',  visitDate: mkDate(160), visitTime: '15:35', createdAt: new Date().toISOString() },
    // [48-49] Days 181-270 ago (within 9-month trailing window)
    { id: crypto.randomUUID(), name: 'Subramaniam Pillai',   phone: '6222334455', storeId: 'jp-nagar',   visitDate: mkDate(200), visitTime: '11:15', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Revathi Sharma',       phone: '6133445566', storeId: 'whitefield', visitDate: mkDate(240), visitTime: '14:50', createdAt: new Date().toISOString() },
    // [50-51] Days 271-365 ago (within 12-month trailing window)
    { id: crypto.randomUUID(), name: 'Sujata Iyer',          phone: '6044556677', storeId: 'gachibowli', visitDate: mkDate(300), visitTime: '10:05', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), name: 'Nagaraju Rao',         phone: '5955667788', storeId: 'jp-nagar',   visitDate: mkDate(340), visitTime: '13:25', createdAt: new Date().toISOString() },
    // [52] Past Whitefield (was v2 index 8)
    { id: crypto.randomUUID(), name: 'Meera Iyer',           phone: '9412345678', storeId: 'whitefield', visitDate: mkDate(45), visitTime: '10:30', createdAt: new Date().toISOString() },
    // [53] Past Gachibowli (was v2 index 9)
    { id: crypto.randomUUID(), name: 'Rohit Bansal',         phone: '9323456789', storeId: 'gachibowli', visitDate: mkDate(80), visitTime: '12:15', createdAt: new Date().toISOString() },
  ];

  saveVisits(visits);

  let responses: NpsResponse[] = [];
  const seedResp = (
    v: Visit,
    score: number,
    understood: boolean,
    reasons: NpsResponse['reasons'],
    suggestion: string,
  ) => {
    responses = upsertResponse(responses, {
      visitId: v.id,
      name: v.name, phone: v.phone, storeId: v.storeId, visitDate: v.visitDate,
      score, understood, reasons, suggestion,
    });
  };

  // Today: [0-8], visits[4] Sunita and [6] Ananya remain Pending
  seedResp(visits[0], 9,  true,  [],                              'Great tile selection!');
  seedResp(visits[1], 9,  true,  [],                              'Very helpful staff.');
  seedResp(visits[2], 4,  false, ['pricing', 'sales_experience'], 'Prices were too high.');
  seedResp(visits[3], 10, true,  [],                              'Loved the showroom.');
  seedResp(visits[5], 8,  true,  [],                              '');
  seedResp(visits[7], 9,  true,  [],                              'Nice ambience.');
  seedResp(visits[8], 10, true,  [],                              'Beautiful display!');

  // 20d ago JP Nagar
  seedResp(visits[9], 9,  true,  [],                              '');

  // Yesterday: visits[13] Kavitha remains Pending
  seedResp(visits[10], 9,  true,  [],                             'Staff was very helpful.');
  seedResp(visits[11], 7,  true,  ['service_delivery'],           'Delivery time was a bit long.');
  seedResp(visits[12], 2,  false, ['pricing', 'collection'],      'Did not find what I needed.');
  seedResp(visits[14], 10, true,  [],                             'Excellent showroom!');
  seedResp(visits[15], 9,  true,  [],                             'Great experience overall.');
  seedResp(visits[16], 8,  true,  [],                             '');
  seedResp(visits[17], 10, true,  [],                             'Love the new collection.');

  // Day before yesterday: all responded
  seedResp(visits[18], 9,  true,  [],                             '');
  seedResp(visits[19], 10, true,  [],                             'Best showroom in Bangalore!');
  seedResp(visits[20], 3,  false, ['sales_experience'],           'Sales team was pushy.');
  seedResp(visits[21], 8,  true,  ['service_delivery'],           'Delivery could be faster.');
  seedResp(visits[22], 10, true,  [],                             'Wonderful experience.');
  seedResp(visits[23], 9,  true,  [],                             'Very good collection.');
  seedResp(visits[24], 10, true,  [],                             'Amazing tiles!');
  seedResp(visits[25], 7,  true,  [],                             '');

  // Days 3-7 ago
  seedResp(visits[26], 9,  true,  [],                             '');
  seedResp(visits[27], 7,  true,  ['pricing'],                    'Slightly expensive.');
  seedResp(visits[28], 10, true,  [],                             'Very impressed.');
  seedResp(visits[29], 9,  true,  [],                             '');
  seedResp(visits[30], 3,  false, ['collection'],                 'Limited options for my budget.');

  // Days 8-14 ago
  seedResp(visits[31], 10, true,  [],                             'Outstanding service!');
  seedResp(visits[32], 9,  true,  [],                             '');
  seedResp(visits[33], 5,  false, ['sales_experience'],           'Did not feel welcomed.');
  seedResp(visits[34], 8,  true,  [],                             '');

  // Days 15-21 ago
  seedResp(visits[35], 9,  true,  [],                             'Very professional.');
  seedResp(visits[36], 10, true,  [],                             'Will recommend to friends.');
  seedResp(visits[37], 7,  true,  ['service_delivery'],           '');

  // Days 22-30 ago
  seedResp(visits[38], 9,  true,  [],                             '');
  seedResp(visits[39], 10, true,  [],                             'Perfect tiles for my home.');

  // Days 31-60 ago
  seedResp(visits[40], 9,  true,  [],                             '');
  seedResp(visits[41], 8,  true,  [],                             'Good range of products.');
  seedResp(visits[42], 3,  false, ['pricing'],                    'Too expensive.');

  // Days 61-90 ago
  seedResp(visits[43], 10, true,  [],                             'Lovely store.');
  seedResp(visits[44], 9,  true,  [],                             '');

  // Days 91-180 ago
  seedResp(visits[45], 7,  true,  ['service_delivery'],           '');
  seedResp(visits[46], 10, true,  [],                             'Great showroom.');
  seedResp(visits[47], 9,  true,  [],                             '');

  // Days 181-270 ago
  seedResp(visits[48], 8,  true,  [],                             '');
  seedResp(visits[49], 10, true,  [],                             'Always a pleasure.');

  // Days 271-365 ago
  seedResp(visits[50], 9,  true,  [],                             '');
  seedResp(visits[51], 5,  false, ['collection'],                 'Not enough variety.');

  // v2 legacy: Meera (45d) and Rohit (80d)
  seedResp(visits[52], 10, true,  [],                             'Excellent staff.');
  seedResp(visits[53], 3,  false, ['collection'],                 'Not enough options.');

  markSeeded();
  return { visits, responses };
}
