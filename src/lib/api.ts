import { supabase } from './supabase';
import type { Chit, ChitWithComputed, ChitInsert, ChitScheduleRow, ChitScheduleInsert, ChitScheduleUpdate } from '../types';

export async function fetchChits(): Promise<Chit[]> {
  const { data, error } = await supabase.from('chits').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchChit(id: string): Promise<Chit | null> {
  const { data, error } = await supabase.from('chits').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function fetchChitSchedule(chitId: string): Promise<ChitScheduleRow[]> {
  const { data, error } = await supabase
    .from('chit_schedule')
    .select('*')
    .eq('chit_id', chitId)
    .order('s_no', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertChit(row: ChitInsert): Promise<Chit> {
  const { data, error } = await supabase.from('chits').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateChit(id: string, updates: Partial<ChitInsert>): Promise<Chit> {
  const { data, error } = await supabase.from('chits').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteChit(id: string): Promise<void> {
  const { error } = await supabase.from('chits').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertChitScheduleRow(row: ChitScheduleInsert): Promise<ChitScheduleRow> {
  const { data, error } = await supabase.from('chit_schedule').upsert(row, {
    onConflict: 'chit_id,s_no',
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateChitScheduleRow(id: string, updates: ChitScheduleUpdate): Promise<ChitScheduleRow> {
  const { data, error } = await supabase.from('chit_schedule').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function insertChitScheduleRow(row: ChitScheduleInsert): Promise<ChitScheduleRow> {
  const { data, error } = await supabase.from('chit_schedule').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deleteChitScheduleRow(id: string): Promise<void> {
  const { error } = await supabase.from('chit_schedule').delete().eq('id', id);
  if (error) throw error;
}

/** Compute summary for a single chit from its schedule */
export function computeChitSummary(chit: Chit, schedule: ChitScheduleRow[]): ChitWithComputed {
  const totalAuctions = chit.total_auctions ?? 0;
  const completed = schedule.filter((r) => (r.invested ?? 0) > 0 || (r.interest ?? 0) > 0).length;
  const amount_invested = schedule.reduce((s, r) => s + Number(r.invested ?? 0), 0);
  const interest_earned = schedule.reduce((s, r) => s + Number(r.interest ?? 0), 0);
  return {
    ...chit,
    months_completed: completed,
    remaining: Math.max(0, totalAuctions - completed),
    amount_invested,
    interest_earned,
    total_amount: amount_invested + interest_earned,
  };
}

/** Fetch all chits with schedule and compute summaries (for dashboard) */
export async function fetchChitsWithComputed(): Promise<ChitWithComputed[]> {
  const chits = await fetchChits();
  const result: ChitWithComputed[] = [];
  for (const chit of chits) {
    const schedule = await fetchChitSchedule(chit.id);
    result.push(computeChitSummary(chit, schedule));
  }
  return result;
}
