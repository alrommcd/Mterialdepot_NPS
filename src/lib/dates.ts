const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIst(d: Date): Date {
  return new Date(d.getTime() + IST_OFFSET_MS);
}

export function today(): string {
  const ist = toIst(new Date());
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function nowTimeIST(): string {
  const ist = toIst(new Date());
  const h = String(ist.getUTCHours()).padStart(2, '0');
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function withinLast90Days(dateStr: string): boolean {
  const t = today();
  const cutoff = shiftDate(t, -89); // inclusive of today = 90 days
  return dateStr >= cutoff && dateStr <= t;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const ny = dt.getUTCFullYear();
  const nm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(dt.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

export function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d} ${months[Number(m) - 1]} ${y}`;
}

export function daysAgoDate(n: number): string {
  return shiftDate(today(), -n);
}

export function isToday(dateStr: string): boolean {
  return dateStr === today();
}

export function isFuture(dateStr: string): boolean {
  return dateStr > today();
}
