CREATE TABLE coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  bank TEXT,
  branch_number INTEGER,
  account_number INTEGER,
  id_number BIGINT,
  email TEXT UNIQUE,
  notes TEXT,
  monthly_salary NUMERIC(10,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  group_number INTEGER
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  city TEXT,
  street TEXT,
  birth_date DATE,
  id_number BIGINT,
  phone TEXT,
  father_name TEXT,
  yeshiva TEXT,
  track TEXT,
  enrollment_date DATE,
  coordinator_id UUID REFERENCES coordinators(id),
  nedarim_id INTEGER,
  group_id UUID REFERENCES groups(id),
  notes TEXT
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  parasha TEXT NOT NULL,
  exam_date DATE,
  results TEXT,
  participation_rate NUMERIC(5,2)
);

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  chassidut_score NUMERIC(5,2),
  halacha_score NUMERIC(5,2),
  tefila_score NUMERIC(5,2),
  beinoni_score NUMERIC(5,2),
  shleimut_score NUMERIC(5,2),
  attended_seder BOOLEAN DEFAULT false,
  arrived_on_time BOOLEAN DEFAULT false,
  attended_class BOOLEAN DEFAULT false,
  weekly_summary BOOLEAN DEFAULT false,
  attended_seder_old BOOLEAN DEFAULT false,
  arrived_on_time_old BOOLEAN DEFAULT false,
  paid BOOLEAN DEFAULT false,
  payment_amount NUMERIC(10,2) DEFAULT 0,
  personal_note TEXT,
  rabbi_note TEXT
);

CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  coordinator_id UUID REFERENCES coordinators(id),
  student_id UUID REFERENCES students(id),
  status TEXT DEFAULT 'פתוח' CHECK (status IN ('פתוח', 'בטיפול', 'סגור')),
  inquiry_date DATE,
  description TEXT,
  target_date DATE,
  close_date DATE,
  cancel_reminder BOOLEAN DEFAULT false,
  summary TEXT,
  category TEXT
);

CREATE TABLE finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT,
  payment_date DATE,
  amount NUMERIC(10,2),
  coordinator_id UUID REFERENCES coordinators(id)
);

CREATE TABLE coordinator_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT,
  coordinator_id UUID REFERENCES coordinators(id),
  viewed BOOLEAN DEFAULT false,
  coordinator_response TEXT,
  sent_date TIMESTAMPTZ DEFAULT now(),
  office_status TEXT,
  bank_notice BOOLEAN DEFAULT false
);

CREATE TABLE coordinator_exam_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  coordinator_id UUID REFERENCES coordinators(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  sicha_beinyan TEXT,
  maskana TEXT,
  hemshech_tipul TEXT,
  UNIQUE(coordinator_id, exam_id)
);

ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access coordinators" ON coordinators FOR ALL USING (true);
CREATE POLICY "Admin full access students" ON students FOR ALL USING (true);
CREATE POLICY "Admin full access exams" ON exams FOR ALL USING (true);
CREATE POLICY "Admin full access scores" ON scores FOR ALL USING (true);
CREATE POLICY "Admin full access inquiries" ON inquiries FOR ALL USING (true);
CREATE POLICY "Admin full access finances" ON finances FOR ALL USING (true);
CREATE POLICY "Admin full access instructions" ON coordinator_instructions FOR ALL USING (true);
CREATE POLICY "Admin full access groups" ON groups FOR ALL USING (true);
