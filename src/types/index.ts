export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
}

export interface Chit {
  id: string;
  chit_name: string;
  member_name: string;
  monthly_amount: number;
  maturity_amount: number | null;
  total_auctions: number | null;
  interval_months: number;
  start_month: string | null;
  end_month: string | null;
  notes: string | null;
  created_at: string;
}

export interface ChitScheduleRow {
  id: string;
  chit_id: string;
  s_no: number;
  month_date: string;
  invested: number;
  interest: number;
  mode: string | null;
  reference: string | null;
  created_at: string;
}

/** Computed in app; not stored in DB */
export interface ChitWithComputed extends Chit {
  months_completed: number;
  remaining: number;
  amount_invested: number;
  interest_earned: number;
  total_amount: number;
}

export type ChitInsert = Omit<Chit, 'id' | 'created_at'>;
export type ChitScheduleInsert = Omit<ChitScheduleRow, 'id' | 'created_at'>;
export type ChitScheduleUpdate = Partial<Omit<ChitScheduleRow, 'id' | 'chit_id' | 'created_at'>>;
