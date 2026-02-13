import { useState, FormEvent } from 'react';
import type { ChitInsert } from '../types';
type Props = {
  onClose: () => void;
  onSaved: () => void;
  insertChit: (row: ChitInsert) => Promise<unknown>;
};

const initial: ChitInsert = {
  chit_name: '',
  member_name: '',
  monthly_amount: 0,
  maturity_amount: null,
  total_auctions: null,
  interval_months: 3,
  start_month: null,
  end_month: null,
  notes: null,
};

export default function AddChitModal({ onClose, onSaved, insertChit }: Props) {
  const [form, setForm] = useState<ChitInsert>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ChitInsert, v: string | number | null) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.chit_name?.trim()) e.chit_name = 'Chit name is required';
    if (!form.member_name?.trim()) e.member_name = 'Member name is required';
    if (form.monthly_amount == null || form.monthly_amount < 0) e.monthly_amount = 'Valid monthly amount required';
    if (form.interval_months == null || form.interval_months < 1) e.interval_months = 'Interval must be ≥ 1';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await insertChit({
        ...form,
        monthly_amount: Number(form.monthly_amount),
        maturity_amount: form.maturity_amount != null && String(form.maturity_amount).trim() !== '' ? Number(form.maturity_amount) : null,
        total_auctions: form.total_auctions != null && String(form.total_auctions).trim() !== '' ? Number(form.total_auctions) : null,
        start_month: form.start_month || null,
        end_month: form.end_month || null,
        notes: form.notes || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      setErrors({ submit: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Chit</h2>
          <p className="text-sm text-gray-500 mt-0.5">Enter chit summary details</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{errors.submit}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chit name *</label>
            <input
              type="text"
              value={form.chit_name}
              onChange={(e) => set('chit_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Sabari-2022-50K-(12.5L)"
            />
            {errors.chit_name && <p className="text-red-600 text-sm mt-1">{errors.chit_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member name *</label>
            <input
              type="text"
              value={form.member_name}
              onChange={(e) => set('member_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g. Sabari, Chandru"
            />
            {errors.member_name && <p className="text-red-600 text-sm mt-1">{errors.member_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly amount (₹) *</label>
              <input
                type="number"
                min={0}
                value={form.monthly_amount || ''}
                onChange={(e) => set('monthly_amount', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {errors.monthly_amount && <p className="text-red-600 text-sm mt-1">{errors.monthly_amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interval (months) *</label>
              <input
                type="number"
                min={1}
                value={form.interval_months}
                onChange={(e) => set('interval_months', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {errors.interval_months && <p className="text-red-600 text-sm mt-1">{errors.interval_months}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maturity amount (₹)</label>
              <input
                type="number"
                min={0}
                value={form.maturity_amount ?? ''}
                onChange={(e) => set('maturity_amount', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total auctions</label>
              <input
                type="number"
                min={0}
                value={form.total_auctions ?? ''}
                onChange={(e) => set('total_auctions', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start month</label>
              <input
                type="month"
                value={form.start_month ? form.start_month.slice(0, 7) : ''}
                onChange={(e) => set('start_month', e.target.value ? e.target.value + '-01' : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End month</label>
              <input
                type="month"
                value={form.end_month ? form.end_month.slice(0, 7) : ''}
                onChange={(e) => set('end_month', e.target.value ? e.target.value + '-01' : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add Chit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
