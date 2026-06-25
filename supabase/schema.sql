-- Ben Melech CRM schema
-- Run this in your Supabase SQL editor before migration

CREATE TABLE IF NOT EXISTS coordinators (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  city TEXT,
  bank TEXT,
  branch_number INTEGER,
  account_number INTEGER,
  id_number INTEGER,
  email TEXT,
  notes TEXT,
  monthly_salary NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  group_number INTEGER
);

CREATE TABLE IF NOT EXISTS zmanim (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  season TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  city TEXT,
  street TEXT,
  birth_date TEXT,
  id_number INTEGER,
  phone TEXT,
  father_name TEXT,
  yeshiva TEXT,
  track TEXT,
  enrollment_date TEXT,
  coordinator_id TEXT REFERENCES coordinators(id) ON DELETE SET NULL,
  nedarim_id INTEGER,
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  notes TEXT,
  nedarim_amount NUMERIC,
  nedarim_charged NUMERIC,
  summer_points NUMERIC,
  summer_points_over_500 NUMERIC
);

CREATE INDEX IF NOT EXISTS students_coordinator_id_idx ON students(coordinator_id);
CREATE INDEX IF NOT EXISTS students_group_id_idx ON students(group_id);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  parasha TEXT NOT NULL DEFAULT '',
  exam_date TEXT,
  results TEXT,
  participation_rate NUMERIC,
  zman_id TEXT REFERENCES zmanim(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  chassidut_score NUMERIC,
  halacha_score NUMERIC,
  tefila_score NUMERIC,
  beinoni_score NUMERIC,
  shleimut_score NUMERIC,
  attended_seder BOOLEAN DEFAULT FALSE,
  arrived_on_time BOOLEAN DEFAULT FALSE,
  attended_class BOOLEAN DEFAULT FALSE,
  weekly_summary BOOLEAN DEFAULT FALSE,
  attended_seder_old BOOLEAN DEFAULT FALSE,
  arrived_on_time_old BOOLEAN DEFAULT FALSE,
  paid BOOLEAN DEFAULT FALSE,
  payment_amount NUMERIC DEFAULT 0,
  points NUMERIC,
  points_kaitz NUMERIC,
  personal_note TEXT,
  rabbi_note TEXT
);

CREATE INDEX IF NOT EXISTS scores_student_id_idx ON scores(student_id);
CREATE INDEX IF NOT EXISTS scores_exam_id_idx ON scores(exam_id);

CREATE TABLE IF NOT EXISTS inquiries (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL DEFAULT '',
  coordinator_id TEXT REFERENCES coordinators(id) ON DELETE SET NULL,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'חדש',
  inquiry_date TEXT,
  description TEXT,
  target_date TEXT,
  close_date TEXT,
  cancel_reminder BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS finances (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT,
  payment_date TEXT,
  amount NUMERIC,
  coordinator_id TEXT REFERENCES coordinators(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS coordinator_instructions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL DEFAULT '',
  content TEXT,
  coordinator_id TEXT REFERENCES coordinators(id) ON DELETE SET NULL,
  viewed BOOLEAN DEFAULT FALSE,
  coordinator_response TEXT,
  sent_date TEXT NOT NULL DEFAULT '',
  office_status TEXT,
  bank_notice BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS exam_notes (
  id TEXT PRIMARY KEY,
  coordinator_id TEXT REFERENCES coordinators(id) ON DELETE SET NULL,
  exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
  sicha_beinyan TEXT,
  maskana TEXT,
  hemshech_tipul TEXT,
  UNIQUE(coordinator_id, exam_id)
);
