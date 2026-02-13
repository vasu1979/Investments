export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
}

/** Format date as "Apr-22" (first day of month stored as YYYY-MM-DD) */
export function formatMonth(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

/** YYYY-MM-DD for first day of month from month/year */
export function toMonthDate(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}-01`;
}
