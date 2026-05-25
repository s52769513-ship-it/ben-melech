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
  coordinator?: Coordinator;
}

export interface Exam {
  id: string;
  created_at: string;
  parasha: string;
  exam_date: string | null;
  results: string | null;
  participation_rate: number | null;
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
  paid: boolean;
  payment_amount: number;
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
  status: "פתוח" | "בטיפול" | "סגור";
  inquiry_date: string | null;
  description: string | null;
  target_date: string | null;
  close_date: string | null;
  cancel_reminder: boolean;
  summary: string | null;
  category: string | null;
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
