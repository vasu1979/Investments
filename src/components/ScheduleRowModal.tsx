import { useState, useEffect } from 'react';
import type { ChitScheduleRow } from '../types';

type Props = {
  chitId: string;
  row: ChitScheduleRow | null;
  nextSNo: number;
  suggestedMonth: string | null;
  onClose: () => void;
  onSave: (row: {
    chit_id: string;
    s_no: number;
    month_date: string;
    invested: number;
    interest: number;
    mode: string | null;
    reference: string | null;
  }) => Promise<void>;
};

export default function ScheduleRowModal({
  chitId,
  row,
  nextSNo,
  suggestedMonth,
  onClose,
  onSave,
}: Props) {
  const isEdit = !!row;
  const [s_no, setSNo] = useState(row?.s_no ?? nextSNo);
  const [month_date, setMonthDate] = useState(
    row?.month_date?.slice(0, 10) ?? suggestedMonth ?? ''
  );
  const [invested, setInvested] = useState(String(row?.invested ?? 0));
  const [interest, setInterest] = useState(String(row?.interest ?? 0));
  const [mode, setMode] = useState(row?.mode ?? '');
  const [reference, setReference] = useState(row?.reference ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!row && suggestedMonth) setMonthDate(suggestedMonth);
  }, [row, suggestedMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month_date.trim()) {
      setError('Month date is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        chit_id: chitId,
        s_no,
        month_date: month_date.slice(0, 7) + '-01',
        invested: Number(invested) || 0,
        interest: Number(interest) || 0,
        mode: mode.trim() || null,
        reference: reference.trim() || null,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit schedule row' : 'Add schedule row'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">S.No</label>
              <input
                type="number"
                min={1}
                value={s_no}
                onChange={(e) => setSNo(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
              <input
                type="month"
                value={month_date.slice(0, 7)}
                onChange={(e) => setMonthDate(e.target.value + '-01')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invested</label>
              <input
                type="number"
                min={0}
                step={1}
                value={invested}
                onChange={(e) => setInvested(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interest</label>
              <input
                type="number"
                min={0}
                step={1}
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <input
              type="text"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Gpay, Cash, Bank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 153032-Gpay"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium disabled:opacity-60">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
