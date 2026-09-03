export interface Zman {
  id: string;
  created_at: string;
  name: string;
  season: string | null;
  exam_ids: string[];
}

// One writable column on the zmanim table, as the new-zman form should show it.
export interface ZmanFormField {
  name: string;
  kind: "text" | "number" | "date" | "checkbox" | "select";
  choices?: string[];
}

export interface Coordinator {
  id: string;
  created_at: string;
  name: string;
  phone: string | null;
  city: string | null;
  bank: string | null;
  branch_number: number | null;
  account_number: number | null;
  id_number: number | null;
  email: string | null;
  notes: string | null;
  monthly_salary: number;
  user_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  group_number: number | null;
}

export interface Student {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  city: string | null;
  street: string | null;
  birth_date: string | null;
  id_number: number | null;
  phone: string | null;
  father_name: string | null;
  yeshiva: string | null;
  track: string | null;
  enrollment_date: string | null;
  coordinator_id: string | null;
  nedarim_id: number | null;
  group_id: string | null;
  notes: string | null;
  nedarim_amount: number | null;
  nedarim_charged: number | null;
  remaining_to_load: number | null;
  summer_points: number | null;
  summer_points_over_500: number | null;
  // Computed by Airtable per bochur — no need to walk the scores table for them.
  avg_score: number | null;
  total_exams: number | null;
  total_sedarim: number | null;
  coordinator?: Coordinator;
}

export interface Exam {
  id: string;
  created_at: string;
  parasha: string;
  exam_date: string | null;
  results: string | null;
  participation_rate: number | null;
  zman_id: string | null;
}

export interface Score {
  id: string;
  created_at: string;
  student_id: string;
  exam_id: string;
  chassidut_score: number | null;
  halacha_score: number | null;
  tefila_score: number | null;
  beinoni_score: number | null;
  shleimut_score: number | null;
  attended_seder: boolean;
  arrived_on_time: boolean;
  attended_class: boolean;
  weekly_summary: boolean;
  attended_seder_old: boolean;
  arrived_on_time_old: boolean;
  paid: boolean;
  payment_amount: number;
  points: number | null;
  points_kaitz: number | null;
  // "הוספת נקודות ידני" — the editable one. points_kaitz is a formula.
  manual_points: number | null;
  personal_note: string | null;
  rabbi_note: string | null;
  student?: Student;
  exam?: Exam;
}

export interface Inquiry {
  id: string;
  created_at: string;
  title: string;
  coordinator_id: string | null;
  student_id: string | null;
  status: "חדש" | "בטיפול" | "סגור";
  inquiry_date: string | null;
  description: string | null;
  target_date: string | null;
  close_date: string | null;
  cancel_reminder: boolean;
  coordinator?: Coordinator;
  student?: Student;
}

export interface Finance {
  id: string;
  created_at: string;
  name: string | null;
  payment_date: string | null;
  amount: number | null;
  coordinator_id: string | null;
  coordinator?: Coordinator;
}

// One bochur's card-loading ledger. "total" is Airtable's all-time figure; the
// interface may only load "chargeable", which never includes money earned
// before the cutoff (see NEDARIM_CUTOFF).
export interface NedarimLedgerEntry {
  id: string;
  first_name: string;
  last_name: string;
  nedarim_id: number | null;
  total: number;
  charged: number;
  // Earned from the cutoff on — the only money this screen may load.
  recent: number;
  // Earned before the cutoff. Settled off-line; never loaded from here.
  historic: number;
  chargeable: number;
  // The historic balance was written off, so "הוטען" now covers all of it.
  settled: boolean;
}

export interface CoordinatorInstruction {
  id: string;
  created_at: string;
  title: string;
  content: string | null;
  coordinator_id: string | null;
  viewed: boolean;
  coordinator_response: string | null;
  sent_date: string;
  office_status: string | null;
  bank_notice: boolean;
  coordinator?: Coordinator;
}
