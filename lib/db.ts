import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase";
import type {
  Coordinator,
  Student,
  Exam,
  Score,
  Inquiry,
  Finance,
  CoordinatorInstruction,
  Group,
  Zman,
} from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function n(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const x = Number(v);
  return isNaN(x) ? null : x;
}

function s(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v) || null;
}

// ─── Row → Type mappers ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCoordinator(r: any): Coordinator {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    name: r.name ?? "",
    phone: s(r.phone),
    city: s(r.city),
    bank: s(r.bank),
    branch_number: n(r.branch_number),
    account_number: n(r.account_number),
    id_number: n(r.id_number),
    email: s(r.email),
    notes: s(r.notes),
    monthly_salary: n(r.monthly_salary) ?? 0,
    user_id: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStudent(r: any, coordinatorMap?: Map<string, Coordinator>): Student {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    city: s(r.city),
    street: s(r.street),
    birth_date: s(r.birth_date),
    id_number: n(r.id_number),
    phone: s(r.phone),
    father_name: s(r.father_name),
    yeshiva: s(r.yeshiva),
    track: s(r.track),
    enrollment_date: s(r.enrollment_date),
    coordinator_id: s(r.coordinator_id),
    nedarim_id: n(r.nedarim_id),
    group_id: s(r.group_id),
    notes: s(r.notes),
    nedarim_amount: n(r.nedarim_amount),
    nedarim_charged: n(r.nedarim_charged),
    remaining_to_load: (n(r.nedarim_amount) ?? 0) - (n(r.nedarim_charged) ?? 0),
    summer_points: n(r.summer_points),
    summer_points_over_500: n(r.summer_points_over_500),
    coordinator: r.coordinator_id && coordinatorMap ? coordinatorMap.get(r.coordinator_id) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExam(r: any): Exam {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    parasha: r.parasha ?? "",
    exam_date: s(r.exam_date),
    results: s(r.results),
    participation_rate: n(r.participation_rate),
    zman_id: s(r.zman_id),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToScore(r: any, studentMap?: Map<string, Student>, examMap?: Map<string, Exam>): Score {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    student_id: r.student_id ?? "",
    exam_id: r.exam_id ?? "",
    chassidut_score: n(r.chassidut_score),
    halacha_score: n(r.halacha_score),
    tefila_score: n(r.tefila_score),
    beinoni_score: n(r.beinoni_score),
    shleimut_score: n(r.shleimut_score),
    attended_seder: r.attended_seder === true,
    arrived_on_time: r.arrived_on_time === true,
    attended_class: r.attended_class === true,
    weekly_summary: r.weekly_summary === true,
    attended_seder_old: r.attended_seder_old === true,
    arrived_on_time_old: r.arrived_on_time_old === true,
    paid: r.paid === true,
    payment_amount: n(r.payment_amount) ?? 0,
    points: n(r.points),
    points_kaitz: n(r.points_kaitz),
    personal_note: s(r.personal_note),
    rabbi_note: s(r.rabbi_note),
    student: r.student_id && studentMap ? studentMap.get(r.student_id) : undefined,
    exam: r.exam_id && examMap ? examMap.get(r.exam_id) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInquiry(r: any, studentMap?: Map<string, Student>, coordinatorMap?: Map<string, Coordinator>): Inquiry {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    title: r.title ?? "",
    coordinator_id: s(r.coordinator_id),
    student_id: s(r.student_id),
    status: (r.status ?? "חדש") as Inquiry["status"],
    inquiry_date: s(r.inquiry_date),
    description: s(r.description),
    target_date: s(r.target_date),
    close_date: s(r.close_date),
    cancel_reminder: r.cancel_reminder === true,
    student: r.student_id && studentMap ? studentMap.get(r.student_id) : undefined,
    coordinator: r.coordinator_id && coordinatorMap ? coordinatorMap.get(r.coordinator_id) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToFinance(r: any, coordinatorMap?: Map<string, Coordinator>): Finance {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    name: s(r.name),
    payment_date: s(r.payment_date),
    amount: n(r.amount),
    coordinator_id: s(r.coordinator_id),
    coordinator: r.coordinator_id && coordinatorMap ? coordinatorMap.get(r.coordinator_id) : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToInstruction(r: any, coordinatorMap?: Map<string, Coordinator>): CoordinatorInstruction {
  return {
    id: r.id,
    created_at: r.created_at ?? "",
    title: r.title ?? "",
    content: s(r.content),
    coordinator_id: s(r.coordinator_id),
    viewed: r.viewed === true,
    coordinator_response: s(r.coordinator_response),
    sent_date: r.sent_date ?? "",
    office_status: s(r.office_status),
    bank_notice: r.bank_notice === true,
    coordinator: r.coordinator_id && coordinatorMap ? coordinatorMap.get(r.coordinator_id) : undefined,
  };
}

// ─── Internal cached lists ────────────────────────────────────────────────────

const getStudentList = unstable_cache(
  async (): Promise<Student[]> => {
    const coordinatorMap = await getCoordinatorMap();
    const { data, error } = await supabase.from("students").select("*");
    if (error) throw error;
    return data.map((r) => rowToStudent(r, coordinatorMap));
  },
  ["student-list"],
  { revalidate: 120, tags: ["students"] }
);

async function getCoordinatorMap(): Promise<Map<string, Coordinator>> {
  const coords = await getCoordinators();
  return new Map(coords.map((c) => [c.id, c]));
}

async function getStudentMap(): Promise<Map<string, Student>> {
  const students = await getStudentList();
  return new Map(students.map((s) => [s.id, s]));
}

async function getExamMap(): Promise<Map<string, Exam>> {
  const exams = await getExams();
  return new Map(exams.map((e) => [e.id, e]));
}

// ─── Coordinators ────────────────────────────────────────────────────────────

export const getCoordinators = unstable_cache(
  async (): Promise<Coordinator[]> => {
    const { data, error } = await supabase.from("coordinators").select("*");
    if (error) throw error;
    return data.map(rowToCoordinator).sort((a, b) => a.name.localeCompare(b.name, "he"));
  },
  ["coordinators"],
  { revalidate: 120, tags: ["coordinators"] }
);

export const getCoordinator = unstable_cache(
  async (id: string): Promise<Coordinator | null> => {
    const { data, error } = await supabase.from("coordinators").select("*").eq("id", id).single();
    if (error) return null;
    return rowToCoordinator(data);
  },
  ["coordinator"],
  { revalidate: 120, tags: ["coordinators"] }
);

export async function updateCoordinator(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = ["name", "phone", "city", "bank", "branch_number", "account_number", "id_number", "email", "notes", "monthly_salary"];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("coordinators").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(filters?: {
  coordinator?: string;
  city?: string;
  yeshiva?: string;
}): Promise<Student[]> {
  let students = await getStudentList();

  if (filters?.coordinator)
    students = students.filter((s) => s.coordinator_id === filters.coordinator);
  if (filters?.city)
    students = students.filter((s) => s.city === filters.city);
  if (filters?.yeshiva) {
    const term = filters.yeshiva.toLowerCase();
    students = students.filter((s) => s.yeshiva?.toLowerCase().includes(term));
  }

  return [...students].sort(
    (a, b) =>
      a.last_name.localeCompare(b.last_name, "he") ||
      a.first_name.localeCompare(b.first_name, "he")
  );
}

export async function getStudent(id: string): Promise<Student | null> {
  const coordinatorMap = await getCoordinatorMap();
  const { data, error } = await supabase.from("students").select("*").eq("id", id).single();
  if (error) return null;
  return rowToStudent(data, coordinatorMap);
}

export async function createStudent(data: Record<string, unknown>): Promise<string> {
  const allowed = [
    "first_name", "last_name", "phone", "city", "street", "birth_date",
    "id_number", "father_name", "yeshiva", "track", "enrollment_date",
    "coordinator_id", "nedarim_id", "group_id", "notes",
  ];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k) && v !== null && v !== undefined && v !== "") {
      fields[k] = v;
    }
  }
  const { data: row, error } = await supabase.from("students").insert(fields).select("id").single();
  if (error) throw error;
  return row.id;
}

export async function updateStudent(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = [
    "first_name", "last_name", "phone", "city", "street", "birth_date",
    "id_number", "father_name", "yeshiva", "track", "enrollment_date",
    "coordinator_id", "nedarim_id", "nedarim_charged", "group_id", "notes",
  ];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("students").update(fields).eq("id", id);
  if (error) throw error;
}

export async function getStudentsForNedarim(coordinatorId?: string): Promise<
  Pick<Student, "id" | "first_name" | "last_name" | "nedarim_id" | "nedarim_amount" | "nedarim_charged">[]
> {
  let query = supabase.from("students").select("id, first_name, last_name, nedarim_id, nedarim_amount, nedarim_charged");
  if (coordinatorId) query = query.eq("coordinator_id", coordinatorId);
  const { data, error } = await query;
  if (error) throw error;
  return data
    .map((r) => ({
      id: r.id,
      first_name: r.first_name ?? "",
      last_name: r.last_name ?? "",
      nedarim_id: n(r.nedarim_id),
      nedarim_amount: n(r.nedarim_amount),
      nedarim_charged: n(r.nedarim_charged),
    }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "he"));
}

export async function updateNedarimCharged(id: string, charged: number): Promise<void> {
  const { error } = await supabase.from("students").update({ nedarim_charged: charged }).eq("id", id);
  if (error) throw error;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase.from("groups").select("*");
  if (error) throw error;
  return data
    .map((r) => ({ id: r.id, name: r.name ?? "", group_number: n(r.group_number) }))
    .sort((a, b) => a.name.localeCompare(b.name, "he"));
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export const getExams = unstable_cache(
  async (): Promise<Exam[]> => {
    const { data, error } = await supabase.from("exams").select("*");
    if (error) throw error;
    return data
      .map(rowToExam)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  },
  ["exams"],
  { revalidate: 60, tags: ["exams"] }
);

export async function getExam(id: string): Promise<Exam | null> {
  const { data, error } = await supabase.from("exams").select("*").eq("id", id).single();
  if (error) return null;
  return rowToExam(data);
}

export async function getZmanim(): Promise<Zman[]> {
  const { data, error } = await supabase.from("zmanim").select("*");
  if (error) throw error;
  return data
    .map((r) => ({ id: r.id, name: r.name ?? "", season: s(r.season), exam_ids: [] }))
    .filter((z) => z.name.trim() !== "");
}

export async function updateExam(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = ["parasha", "exam_date", "results", "participation_rate"];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("exams").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export const getScoresByExam = unstable_cache(
  async (examId: string): Promise<Score[]> => {
    const [studentMap, { data, error }] = await Promise.all([
      getStudentMap(),
      supabase.from("scores").select("*").eq("exam_id", examId),
    ]);
    if (error) throw error;
    const exam = await getExam(examId);
    const examMap = exam ? new Map([[exam.id, exam]]) : new Map<string, Exam>();
    return data.map((r) => rowToScore(r, studentMap, examMap));
  },
  ["scores-by-exam"],
  { revalidate: 60, tags: ["scores"] }
);

export const getScoresByExamForCoordinator = unstable_cache(
  async (examId: string, coordinatorId: string): Promise<Score[]> => {
    const [{ data: studentRows }, { data, error }] = await Promise.all([
      supabase.from("students").select("*").eq("coordinator_id", coordinatorId),
      supabase.from("scores").select("*").eq("exam_id", examId),
    ]);
    if (error) throw error;
    const studentMap = new Map((studentRows ?? []).map((r) => [r.id, rowToStudent(r)]));
    const exam = await getExam(examId);
    const examMap = exam ? new Map([[exam.id, exam]]) : new Map<string, Exam>();
    const coordStudentIds = new Set(studentMap.keys());
    return (data ?? [])
      .filter((r) => coordStudentIds.has(r.student_id))
      .map((r) => rowToScore(r, studentMap, examMap));
  },
  ["scores-by-exam-coordinator"],
  { revalidate: 60, tags: ["scores"] }
);

export const getAllScoresForCoordinator = unstable_cache(
  async (coordinatorId: string): Promise<Score[]> => {
    const { data: studentRows } = await supabase.from("students").select("id").eq("coordinator_id", coordinatorId);
    const ids = (studentRows ?? []).map((r) => r.id);
    if (ids.length === 0) return [];
    const { data, error } = await supabase.from("scores").select("*").in("student_id", ids);
    if (error) throw error;
    return (data ?? []).map((r) => rowToScore(r));
  },
  ["all-scores-coordinator"],
  { revalidate: 60, tags: ["scores"] }
);

export async function getScoresByStudent(studentId: string): Promise<Score[]> {
  const [examMap, { data, error }] = await Promise.all([
    getExamMap(),
    supabase.from("scores").select("*").eq("student_id", studentId),
  ]);
  if (error) throw error;
  return (data ?? [])
    .map((r) => rowToScore(r, undefined, examMap))
    .sort((a, b) => (b.exam?.exam_date ?? "").localeCompare(a.exam?.exam_date ?? ""));
}

export const getAllScores = unstable_cache(
  async (): Promise<Score[]> => {
    const { data, error } = await supabase.from("scores").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => rowToScore(r));
  },
  ["all-scores"],
  { revalidate: 60, tags: ["scores"] }
);

export const getScoresWithRelations = unstable_cache(
  async (): Promise<Score[]> => {
    const [studentMap, examMap, { data, error }] = await Promise.all([
      getStudentMap(),
      getExamMap(),
      supabase.from("scores").select("*"),
    ]);
    if (error) throw error;
    return (data ?? [])
      .map((r) => rowToScore(r, studentMap, examMap))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  },
  ["scores-with-relations"],
  { revalidate: 60, tags: ["scores"] }
);

export const getScoresWithRelationsForCoordinator = unstable_cache(
  async (coordinatorId: string): Promise<Score[]> => {
    const { data: studentRows } = await supabase.from("students").select("id").eq("coordinator_id", coordinatorId);
    const ids = (studentRows ?? []).map((r) => r.id);
    if (ids.length === 0) return [];
    const [studentMap, examMap, { data, error }] = await Promise.all([
      getStudentMap(),
      getExamMap(),
      supabase.from("scores").select("*").in("student_id", ids),
    ]);
    if (error) throw error;
    return (data ?? [])
      .map((r) => rowToScore(r, studentMap, examMap))
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  },
  ["scores-with-relations-coordinator"],
  { revalidate: 60, tags: ["scores"] }
);

export async function updateScore(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = [
    "chassidut_score", "halacha_score", "tefila_score", "beinoni_score", "shleimut_score",
    "attended_seder", "arrived_on_time", "attended_class", "weekly_summary",
    "attended_seder_old", "arrived_on_time_old", "paid", "points_kaitz",
    "personal_note", "rabbi_note",
  ];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("scores").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Inquiries ───────────────────────────────────────────────────────────────

export async function getInquiries(statusFilter?: string): Promise<Inquiry[]> {
  const [coordinatorMap, studentMap, { data, error }] = await Promise.all([
    getCoordinatorMap(),
    getStudentMap(),
    supabase.from("inquiries").select("*"),
  ]);
  if (error) throw error;
  let inquiries = (data ?? []).map((r) => rowToInquiry(r, studentMap, coordinatorMap));
  if (statusFilter) inquiries = inquiries.filter((i) => i.status === statusFilter);
  return inquiries.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function getInquiriesByStudent(studentId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase.from("inquiries").select("*").eq("student_id", studentId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => rowToInquiry(r))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function getInquiriesByCoordinator(coordinatorId: string): Promise<Inquiry[]> {
  const { data: studentRows } = await supabase.from("students").select("id, first_name, last_name").eq("coordinator_id", coordinatorId);
  const studentMap = new Map((studentRows ?? []).map((r) => [r.id, rowToStudent(r)]));
  const { data, error } = await supabase.from("inquiries").select("*").eq("coordinator_id", coordinatorId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => rowToInquiry(r, studentMap))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function createInquiry(data: {
  title: string;
  coordinator_id: string | null;
  student_id: string | null;
  inquiry_date: string | null;
  target_date: string | null;
  description: string | null;
}): Promise<void> {
  const { error } = await supabase.from("inquiries").insert({
    title: data.title,
    status: "חדש",
    coordinator_id: data.coordinator_id || null,
    student_id: data.student_id || null,
    inquiry_date: data.inquiry_date || null,
    target_date: data.target_date || null,
    description: data.description || null,
  });
  if (error) throw error;
}

export async function updateInquiry(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = ["title", "status", "inquiry_date", "description", "target_date", "close_date", "cancel_reminder", "coordinator_id", "student_id"];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("inquiries").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Finances ────────────────────────────────────────────────────────────────

export async function getFinances(): Promise<Finance[]> {
  const [coordinatorMap, { data, error }] = await Promise.all([
    getCoordinatorMap(),
    supabase.from("finances").select("*"),
  ]);
  if (error) throw error;
  return (data ?? [])
    .map((r) => rowToFinance(r, coordinatorMap))
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));
}

export async function getFinancesByCoordinator(coordinatorId: string): Promise<Finance[]> {
  const { data, error } = await supabase.from("finances").select("*").eq("coordinator_id", coordinatorId);
  if (error) throw error;
  return (data ?? [])
    .map((r) => rowToFinance(r))
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));
}

export async function updateFinance(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = ["name", "payment_date", "amount", "coordinator_id"];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("finances").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Coordinator Instructions ─────────────────────────────────────────────────

export async function getInstructions(): Promise<CoordinatorInstruction[]> {
  const [coordinatorMap, { data, error }] = await Promise.all([
    getCoordinatorMap(),
    supabase.from("coordinator_instructions").select("*"),
  ]);
  if (error) throw error;
  return (data ?? []).map((r) => rowToInstruction(r, coordinatorMap));
}

export async function updateInstruction(id: string, data: Record<string, unknown>): Promise<void> {
  const allowed = ["title", "content", "viewed", "coordinator_response", "office_status", "bank_notice", "coordinator_id"];
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (allowed.includes(k)) fields[k] = v;
  }
  const { error } = await supabase.from("coordinator_instructions").update(fields).eq("id", id);
  if (error) throw error;
}

// ─── Coordinator Exam Notes ───────────────────────────────────────────────────

export type CoordinatorExamNote = {
  id: string;
  coordinator_id: string | null;
  exam_id: string | null;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
};

export async function getExamNotesByExam(examId: string): Promise<CoordinatorExamNote[]> {
  const { data, error } = await supabase.from("exam_notes").select("*").eq("exam_id", examId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    coordinator_id: s(r.coordinator_id),
    exam_id: s(r.exam_id),
    sicha_beinyan: s(r.sicha_beinyan),
    maskana: s(r.maskana),
    hemshech_tipul: s(r.hemshech_tipul),
  }));
}

export async function upsertExamNote({
  coordinatorId,
  examId,
  sicha_beinyan,
  maskana,
  hemshech_tipul,
}: {
  coordinatorId: string;
  examId: string;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
}): Promise<void> {
  const { error } = await supabase.from("exam_notes").upsert(
    {
      coordinator_id: coordinatorId,
      exam_id: examId,
      sicha_beinyan,
      maskana,
      hemshech_tipul,
    },
    { onConflict: "coordinator_id,exam_id" }
  );
  if (error) throw error;
}
