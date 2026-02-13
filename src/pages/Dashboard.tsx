import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchChitsWithComputed, insertChit } from '../lib/api';
import { formatCurrency, formatMonth } from '../lib/utils';
import type { ChitWithComputed } from '../types';
import AddChitModal from '../components/AddChitModal';

export default function Dashboard() {
  const [chits, setChits] = useState<ChitWithComputed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterMember, setFilterMember] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChitsWithComputed();
      setChits(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = chits;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.chit_name.toLowerCase().includes(q) || c.member_name.toLowerCase().includes(q)
      );
    }
    if (filterMember.trim()) {
      const m = filterMember.trim().toLowerCase();
      list = list.filter((c) => c.member_name.toLowerCase().includes(m));
    }
    return list;
  }, [chits, search, filterMember]);

  const totals = useMemo(() => {
    return {
      count: chits.length,
      invested: chits.reduce((s, c) => s + c.amount_invested, 0),
      interest: chits.reduce((s, c) => s + c.interest_earned, 0),
      total: chits.reduce((s, c) => s + c.total_amount, 0),
    };
  }, [chits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600"
        >
          + Add Chit
        </button>
      </div>

      {/* Summary cards - 4 cards like reference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Active Chits</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{totals.count}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Amount Invested</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totals.invested)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Interest Earned</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">{formatCurrency(totals.interest)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{formatCurrency(totals.total)}</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by chit name or member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg w-64 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <input
          type="text"
          placeholder="Filter by member name"
          value={filterMember}
          onChange={(e) => setFilterMember(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg w-48 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Chits table - My Watchlist style card */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">All Chits</h2>
        </div>
        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No chits found. Add one to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Member</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Chit Name</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Monthly</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total Auctions</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Maturity</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Interval</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Start / End</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Completed</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Remaining</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Invested</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Interest</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Total</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium text-gray-900">{c.member_name}</td>
                    <td className="py-3 px-4 text-gray-700">{c.chit_name}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(c.monthly_amount)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.total_auctions ?? '—'}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {c.maturity_amount != null ? formatCurrency(c.maturity_amount) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.interval_months} m</td>
                    <td className="py-3 px-4 text-gray-700">
                      {formatMonth(c.start_month)} / {formatMonth(c.end_month)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.months_completed}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{c.remaining}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(c.amount_invested)}</td>
                    <td className="py-3 px-4 text-right text-green-600">{formatCurrency(c.interest_earned)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(c.total_amount)}</td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/chit/${c.id}`}
                        className="text-primary-500 hover:text-primary-600 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddChitModal
          onClose={() => setShowAddModal(false)}
          onSaved={load}
          insertChit={insertChit}
        />
      )}
    </div>
  );
}
