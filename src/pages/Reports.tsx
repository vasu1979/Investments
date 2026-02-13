import { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchChitsWithComputed, fetchChitSchedule } from '../lib/api';
import { formatCurrency, formatMonth } from '../lib/utils';
import type { ChitWithComputed, ChitScheduleRow } from '../types';

type ChartPoint = { month: string; invested: number; interest: number; total: number };

function exportToCsv(chits: ChitWithComputed[]) {
  const rows: string[][] = [];
  rows.push([
    'Member',
    'Chit Name',
    'Monthly Amount',
    'Total Auctions',
    'Maturity',
    'Completed',
    'Remaining',
    'Amount Invested',
    'Interest Earned',
    'Total Amount',
  ]);
  chits.forEach((c) => {
    rows.push([
      c.member_name,
      c.chit_name,
      String(c.monthly_amount),
      String(c.total_auctions ?? ''),
      String(c.maturity_amount ?? ''),
      String(c.months_completed),
      String(c.remaining),
      String(c.amount_invested),
      String(c.interest_earned),
      String(c.total_amount),
    ]);
  });
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `chit-fund-report-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function Reports() {
  const [chits, setChits] = useState<ChitWithComputed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annually'>('monthly');
  const [selectedChitId, setSelectedChitId] = useState<string | null>(null);
  const [scheduleByChit, setScheduleByChit] = useState<Record<string, ChitScheduleRow[]>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchChitsWithComputed();
        if (cancelled) return;
        setChits(data);
        if (data.length > 0 && !selectedChitId) setSelectedChitId(data[0].id);
        const byChit: Record<string, ChitScheduleRow[]> = {};
        for (const c of data) {
          const s = await fetchChitSchedule(c.id);
          byChit[c.id] = s;
        }
        if (!cancelled) setScheduleByChit(byChit);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedSchedule = selectedChitId ? scheduleByChit[selectedChitId] ?? [] : [];

  const lineChartData = useMemo((): ChartPoint[] => {
    if (!selectedSchedule.length) return [];
    const map = new Map<string, { invested: number; interest: number }>();
    selectedSchedule.forEach((r) => {
      const key = r.month_date.slice(0, 7);
      const cur = map.get(key) ?? { invested: 0, interest: 0 };
      cur.invested += Number(r.invested ?? 0);
      cur.interest += Number(r.interest ?? 0);
      map.set(key, cur);
    });
    let points: ChartPoint[] = Array.from(map.entries())
      .map(([month, v]) => ({
        month: formatMonth(month + '-01'),
        invested: v.invested,
        interest: v.interest,
        total: v.invested + v.interest,
      }))
      .sort((a, b) => {
        const am = selectedSchedule.find((r) => formatMonth(r.month_date) === a.month);
        const bm = selectedSchedule.find((r) => formatMonth(r.month_date) === b.month);
        return (am?.month_date ?? '').localeCompare(bm?.month_date ?? '');
      });
    if (period === 'quarterly') {
      const qMap = new Map<string, ChartPoint>();
      points.forEach((p, i) => {
        const q = Math.floor(i / 3) + 1;
        const key = `Q${q}`;
        const cur = qMap.get(key) ?? { month: key, invested: 0, interest: 0, total: 0 };
        cur.invested += p.invested;
        cur.interest += p.interest;
        cur.total += p.total;
        qMap.set(key, cur);
      });
      points = Array.from(qMap.values());
    } else if (period === 'annually') {
      const yMap = new Map<string, ChartPoint>();
      points.forEach((p) => {
        const key = selectedSchedule[0]?.month_date?.slice(0, 4) ?? 'Year';
        const cur = yMap.get(key) ?? { month: key, invested: 0, interest: 0, total: 0 };
        cur.invested += p.invested;
        cur.interest += p.interest;
        cur.total += p.total;
        yMap.set(key, cur);
      });
      points = Array.from(yMap.values());
    }
    return points;
  }, [selectedSchedule, period]);

  const barChartData = useMemo(() => {
    return selectedSchedule.slice(0, 12).map((r) => ({
      month: formatMonth(r.month_date),
      invested: Number(r.invested ?? 0),
      interest: Number(r.interest ?? 0),
    }));
  }, [selectedSchedule]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[200px] text-gray-500">Loading…</div>;
  }
  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <button
          onClick={() => exportToCsv(chits)}
          className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export to CSV
        </button>
      </div>

      {chits.length === 0 ? (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-gray-500">
          No chits yet. Add chits on the Dashboard to see reports.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <label className="text-sm text-gray-600">Chit:</label>
            <select
              value={selectedChitId ?? ''}
              onChange={(e) => setSelectedChitId(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {chits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.chit_name} ({c.member_name})
                </option>
              ))}
            </select>
          </div>

          {/* Portfolio performance - line chart */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900">Invested vs Interest Over Time</h2>
            <p className="text-sm text-gray-500 mt-0.5">Cumulative by period for selected chit</p>
            <div className="flex gap-2 mt-4 mb-4">
              {(['monthly', 'quarterly', 'annually'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
                    period === p ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="h-72">
              {lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v >= 1000 ? v / 1000 : v}${v >= 1000 ? 'K' : ''}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="invested" stroke="#3b82f6" name="Invested" strokeWidth={2} />
                    <Line type="monotone" dataKey="interest" stroke="#10b981" name="Interest" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No schedule data for this chit</div>
              )}
            </div>
          </div>

          {/* Bar chart - monthly invested/interest */}
          <div className="bg-white rounded-xl shadow-card border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900">Monthly Invested & Interest</h2>
            <p className="text-sm text-gray-500 mt-0.5">First 12 months for selected chit</p>
            <div className="h-72 mt-4">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v >= 1000 ? v / 1000 : v}${v >= 1000 ? 'K' : ''}`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="invested" fill="#3b82f6" name="Invested" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="interest" fill="#10b981" name="Interest" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">No schedule data</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
