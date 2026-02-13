import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchChit,
  fetchChitSchedule,
  computeChitSummary,
  insertChitScheduleRow,
  updateChitScheduleRow,
  deleteChitScheduleRow,
} from '../lib/api';
import { formatCurrency, formatMonth } from '../lib/utils';
import type { Chit, ChitScheduleRow, ChitWithComputed } from '../types';

export default function ChitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chit, setChit] = useState<Chit | null>(null);
  const [schedule, setSchedule] = useState<ChitScheduleRow[]>([]);
  const [summary, setSummary] = useState<ChitWithComputed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addForm, setAddForm] = useState({
    s_no: 1,
    month_date: '',
    invested: 0,
    interest: 0,
    mode: '',
    reference: '',
  });
  const [editForm, setEditForm] = useState({
    invested: 0,
    interest: 0,
    mode: '',
    reference: '',
  });
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [c, s] = await Promise.all([fetchChit(id), fetchChitSchedule(id)]);
      setChit(c);
      setSchedule(s);
      if (c) setSummary(computeChitSummary(c, s));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSaveRow = async (rowId: string) => {
    setSaveError(null);
    try {
      await updateChitScheduleRow(rowId, editForm);
      await load();
      setEditingId(null);
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  const handleAddRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addForm.month_date) return;
    setSaveError(null);
    try {
      const nextNo = schedule.length > 0 ? Math.max(...schedule.map((r) => r.s_no)) + 1 : 1;
      await insertChitScheduleRow({
        chit_id: id,
        s_no: addForm.s_no || nextNo,
        month_date: addForm.month_date.length === 7 ? addForm.month_date + '-01' : addForm.month_date,
        invested: addForm.invested,
        interest: addForm.interest,
        mode: addForm.mode || null,
        reference: addForm.reference || null,
      });
      await load();
      setShowAddRow(false);
      setAddForm({ s_no: nextNo + 1, month_date: '', invested: 0, interest: 0, mode: '', reference: '' });
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Remove this schedule row?')) return;
    setSaveError(null);
    try {
      await deleteChitScheduleRow(rowId);
      await load();
    } catch (e) {
      setSaveError((e as Error).message);
    }
  };

  if (loading || !id) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500">
        {loading ? 'Loading…' : 'Invalid chit.'}
      </div>
    );
  }
  if (error || !chit) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/')} className="text-primary-500 hover:underline">
          ← Back to Dashboard
        </button>
        <p className="text-red-600">{error || 'Chit not found.'}</p>
      </div>
    );
  }

  const totalAuctions = chit.total_auctions ?? 0;
  const progressPct = totalAuctions > 0 ? Math.round((summary!.months_completed / totalAuctions) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/')}
        className="text-primary-500 hover:text-primary-600 font-medium"
      >
        ← Back to Dashboard
      </button>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">{chit.chit_name}</h1>
        <p className="text-gray-500">{chit.member_name}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Amount Invested</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(summary!.amount_invested)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Interest Earned</p>
          <p className="text-xl font-semibold text-green-600 mt-1">{formatCurrency(summary!.interest_earned)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{formatCurrency(summary!.total_amount)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border border-gray-100">
          <p className="text-sm text-gray-500">Progress</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">{summary!.months_completed} / {totalAuctions}</span>
          </div>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{saveError}</div>
      )}

      {/* Schedule table */}
      <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-base font-semibold text-gray-900">Monthly Schedule</h2>
          <button
            onClick={() => setShowAddRow(true)}
            className="px-3 py-1.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600"
          >
            + Add Row
          </button>
        </div>

        {showAddRow && (
          <form onSubmit={handleAddRow} className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">S.No</label>
              <input
                type="number"
                min={1}
                value={addForm.s_no}
                onChange={(e) => setAddForm((f) => ({ ...f, s_no: Number(e.target.value) }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
              <input
                type="month"
                required
                value={addForm.month_date}
                onChange={(e) => setAddForm((f) => ({ ...f, month_date: e.target.value }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Invested</label>
              <input
                type="number"
                min={0}
                value={addForm.invested || ''}
                onChange={(e) => setAddForm((f) => ({ ...f, invested: Number(e.target.value) || 0 }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Interest</label>
              <input
                type="number"
                min={0}
                value={addForm.interest || ''}
                onChange={(e) => setAddForm((f) => ({ ...f, interest: Number(e.target.value) || 0 }))}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
              <input
                type="text"
                value={addForm.mode}
                onChange={(e) => setAddForm((f) => ({ ...f, mode: e.target.value }))}
                placeholder="Gpay, Cash..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-primary-500 text-white text-sm rounded hover:bg-primary-600">
                Save
              </button>
              <button type="button" onClick={() => setShowAddRow(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-4 font-medium text-gray-600">S.No</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Month</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Invested</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Interest</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Mode</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Reference</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="py-2 px-4 text-gray-700">{row.s_no}</td>
                  <td className="py-2 px-4 text-gray-700">{formatMonth(row.month_date)}</td>
                  {editingId === row.id ? (
                    <>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min={0}
                          value={editForm.invested}
                          onChange={(e) => setEditForm((f) => ({ ...f, invested: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min={0}
                          value={editForm.interest}
                          onChange={(e) => setEditForm((f) => ({ ...f, interest: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editForm.mode}
                          onChange={(e) => setEditForm((f) => ({ ...f, mode: e.target.value }))}
                          className="w-20 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          value={editForm.reference}
                          onChange={(e) => setEditForm((f) => ({ ...f, reference: e.target.value }))}
                          className="w-28 px-2 py-1 border rounded"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => handleSaveRow(row.id)}
                          className="text-primary-500 hover:underline mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:underline"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-2 px-4 text-right text-gray-700">{formatCurrency(row.invested)}</td>
                      <td className="py-2 px-4 text-right text-green-600">{formatCurrency(row.interest)}</td>
                      <td className="py-2 px-4 text-gray-700">{row.mode ?? '—'}</td>
                      <td className="py-2 px-4 text-gray-700">{row.reference ?? '—'}</td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => {
                            setEditingId(row.id);
                            setEditForm({
                              invested: row.invested,
                              interest: row.interest,
                              mode: row.mode ?? '',
                              reference: row.reference ?? '',
                            });
                          }}
                          className="text-primary-500 hover:underline mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schedule.length === 0 && !showAddRow && (
          <div className="p-6 text-center text-gray-500">No schedule rows yet. Add one above.</div>
        )}
      </div>
    </div>
  );
}
