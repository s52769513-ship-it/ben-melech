import { cacheLife, cacheTag } from "next/cache";
import {
  fetchAll,
  patchRecord,
  createRecord,
  TABLES,
  linkedId,
  num,
  str,
  bool,
  type AirtableRecord,
} from "./client";
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

// ─── Mappers ────────────────────────────────────────────────────────────────

function toCoordinator(r: AirtableRecord): Coordinator {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    name: str(f["שם רכז"]) ?? "",
    phone: str(f["טלפון"]),
    city: str(f["עיר copy"]),
    bank: str(f["בנק"]),
    branch_number: num(f["סניף"]),
    account_number: num(f["חשבון"]),
    id_number: num(f["ת.ז."]),
    email: str(f["מייל"]),
    notes: str(f["הערות"]),
    monthly_salary: num(f["סכום משכורת חודשי"]) ?? 0,
    user_id: null,
  };
}

function toStudent(r: AirtableRecord): Student {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    first_name: str(f["שם"]) ?? "",
    last_name: str(f["משפחה"]) ?? "",
    city: str(f["עיר"]),
    street: str(f["רחוב"]),
    birth_date: str(f["תאריך לידה"]),
    id_number: num(f["מספר מזהה"]),
    phone: str(f["Phone Number"]),
    father_name: str(f["שם האב"]),
    yeshiva: str(f["ישיבה"]),
    track: str(f["מסלול"]),
    enrollment_date: str(f["Enrollment Date"]),
    coordinator_id: linkedId(f["רכז"]),
    nedarim_id: num(f["מזהה נדרים"]),
    group_id: linkedId(f["קבוצה/ישיבה"]),
    notes: str(f["הערות"]),
    nedarim_amount: num(f["כסף להטענה"]),
    nedarim_charged: num(f["הוטען"]),
    remaining_to_load: (num(f["כסף להטענה"]) ?? 0) - (num(f["הוטען"]) ?? 0),
    summer_points: num(f["נקודות זמן קיץ תשפו"]),
    summer_points_over_500: num(f["נקודות זמן קיץ תשפו (מעל 500)"]),
  };
}

function toExam(r: AirtableRecord): Exam {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    parasha: str(f["פרשה"]) ?? "",
    exam_date: str(f["תאריך"]),
    results: str(f["Results"]),
    participation_rate: num(f["Participation Rate (%)"]),
    zman_id: linkedId(f["זמן ושנה"]),
  };
}

function toZman(r: AirtableRecord): Zman {
  const f = r.fields;
  return {
    id: r.id,
    name: str(f["זמן"]) ?? "",
    season: str(f["שם זמן"]),
    exam_ids: (f["פרשה"] as string[] | undefined) ?? [],
  };
}

function toScore(r: AirtableRecord): Score {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    student_id: linkedId(f["בחור"]) ?? "",
    exam_id: linkedId(f["מבחן"]) ?? "",
    chassidut_score: num(f["מבחן חסידות"]),
    halacha_score: num(f["מבחן הלכה"]),
    tefila_score: num(f["מבחן שערי תפילה"]),
    beinoni_score: num(f["מבחן הבינני"]),
    shleimut_score: num(f["מבחן שלימות התפילה"]),
    attended_seder: bool(f["השתתף בסדר"]),
    arrived_on_time: bool(f["הגעה 5 דקות ראשונות"]),
    attended_class: bool(f["השתתף בשיעור"]),
    weekly_summary: bool(f["סיכום שבועי"]),
    attended_seder_old: bool(f["השתתף בסדר {ישן}"]),
    arrived_on_time_old: bool(f['הגעה ב-5 דקות ראשונות {ישן}']),
    paid: bool(f["שולם"]),
    payment_amount: num(f["סכום לתשלום"]) ?? 0,
    points: num(f["נקודות"]),
    points_kaitz: num(f["נקודות זמן קיץ תשפו"]),
    personal_note: str(f['פניה אישית (לכה"פ ל-2 בחורים בשבוע)']),
    rabbi_note: str(f["שמתי לב.... (הערות להרב חיים מרדכי ישיר)"]),
  };
}

function toInquiry(r: AirtableRecord): Inquiry {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    title: str(f["שם"]) ?? "",
    coordinator_id: linkedId(f["רכז"]),
    student_id: linkedId(f["בחור"]),
    status: (str(f["סטטוס"]) ?? "חדש") as Inquiry["status"],
    inquiry_date: str(f["תאריך"]),
    description: str(f["תיאור"]),
    target_date: str(f["תאריך יעד"]),
    close_date: str(f["תאריך סיום"]),
    cancel_reminder: bool(f["ביטול תזכורת"]),
  };
}

function toFinance(r: AirtableRecord): Finance {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    name: str(f["שם"]),
    payment_date: str(f["תאריך"]),
    amount: num(f["סכום"]),
    coordinator_id: linkedId(f["רכז"]),
  };
}

function toInstruction(r: AirtableRecord): CoordinatorInstruction {
  const f = r.fields;
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    title: str(f["כותרת"]) ?? "",
    content: str(f["טקסט"]),
    coordinator_id: linkedId(f["רכז"]),
    viewed: bool(f["נצפה"]),
    coordinator_response: str(f["תגובת רכז"]),
    sent_date: str(f["תאריך"]) ?? "",
    office_status: str(f["סטטוס משרד"]),
    bank_notice: bool(f["הודעת בנק"]),
  };
}

function toGroup(r: AirtableRecord): Group {
  const f = r.fields;
  return {
    id: r.id,
    name: str(f["Name"]) ?? "",
    group_number: num(f["ID"]),
  };
}

// ─── Cached table reads ──────────────────────────────────────────────────────
//
// Every screen is built from these ten reads and nothing else. Each table is
// pulled once, shared by every page and every user, and then sliced in memory
// (by coordinator, exam, student…) instead of issuing a filtered Airtable
// request per view. `use cache: remote` keeps the entry in the platform cache
// so it survives across requests and server instances — Airtable is rate
// limited, so a shared cache is what keeps us far below the limit.
//
// Writes call updateTag() (see the server actions), which expires the matching
// tag immediately, so an edit is visible on the very next render without
// waiting for the revalidate window.

const LIVE = { stale: 30, revalidate: 180, expire: 3600 } as const;
const STABLE = { stale: 60, revalidate: 1800, expire: 86400 } as const;

export async function getCoordinators(): Promise<Coordinator[]> {
  "use cache: remote";
  cacheLife(STABLE);
  cacheTag("coordinators");
  const recs = await fetchAll(TABLES.COORDINATORS);
  return recs.map(toCoordinator).sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getGroups(): Promise<Group[]> {
  "use cache: remote";
  cacheLife(STABLE);
  cacheTag("groups");
  const recs = await fetchAll(TABLES.GROUPS);
  return recs.map(toGroup).sort((a, b) => a.name.localeCompare(b.name, "he"));
}

export async function getZmanim(): Promise<Zman[]> {
  "use cache: remote";
  cacheLife(STABLE);
  cacheTag("zmanim");
  const recs = await fetchAll(TABLES.ZMANIM);
  return recs.map(toZman).filter((z) => z.name.trim() !== "");
}

export async function getExams(): Promise<Exam[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("exams");
  const recs = await fetchAll(TABLES.EXAMS);
  return recs
    .map(toExam)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

async function studentList(): Promise<Student[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("students");
  const recs = await fetchAll(TABLES.STUDENTS);
  return recs.map(toStudent);
}

async function scoreList(): Promise<Score[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("scores");
  const recs = await fetchAll(TABLES.SCORES);
  return recs.map(toScore);
}

async function inquiryList(): Promise<Inquiry[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("inquiries");
  const recs = await fetchAll(TABLES.INQUIRIES);
  return recs
    .map(toInquiry)
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

async function financeList(): Promise<Finance[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("finances");
  const recs = await fetchAll(TABLES.FINANCES);
  return recs
    .map(toFinance)
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));
}

async function instructionList(): Promise<CoordinatorInstruction[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("instructions");
  const recs = await fetchAll(TABLES.INSTRUCTIONS);
  return recs.map(toInstruction);
}

async function examNoteList(): Promise<CoordinatorExamNote[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("exam-notes");
  const recs = await fetchAll(TABLES.EXAM_NOTES);
  return recs.map(toExamNote);
}

// ─── Relation helpers (in memory — no Airtable traffic) ──────────────────────

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

async function coordinatorMap(): Promise<Map<string, Coordinator>> {
  return byId(await getCoordinators());
}

// Students carrying their coordinator — several screens read
// `score.student.coordinator.name`, so the two lists are stitched together here
// rather than fetched together.
async function studentsWithCoordinator(): Promise<Student[]> {
  const [students, coordinators] = await Promise.all([studentList(), coordinatorMap()]);
  return withCoordinator(students, coordinators);
}

function withCoordinator<T extends { coordinator_id: string | null }>(
  rows: T[],
  coordinators: Map<string, Coordinator>
): (T & { coordinator?: Coordinator })[] {
  return rows.map((row) => ({
    ...row,
    coordinator: row.coordinator_id
      ? coordinators.get(row.coordinator_id)
      : undefined,
  }));
}

function withScoreRelations(
  scores: Score[],
  students?: Map<string, Student>,
  exams?: Map<string, Exam>
): Score[] {
  if (!students && !exams) return scores;
  return scores.map((s) => ({
    ...s,
    student: students && s.student_id ? students.get(s.student_id) : undefined,
    exam: exams && s.exam_id ? exams.get(s.exam_id) : undefined,
  }));
}

// ─── Coordinators ────────────────────────────────────────────────────────────

export async function getCoordinator(id: string): Promise<Coordinator | null> {
  const coordinators = await getCoordinators();
  return coordinators.find((c) => c.id === id) ?? null;
}

export async function updateCoordinator(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    name: "שם רכז",
    phone: "טלפון",
    city: "עיר copy",
    bank: "בנק",
    branch_number: "סניף",
    account_number: "חשבון",
    id_number: "ת.ז.",
    email: "מייל",
    notes: "הערות",
    monthly_salary: "סכום משכורת חודשי",
  };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
  }
  await patchRecord(TABLES.COORDINATORS, id, fields);
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(filters?: {
  coordinator?: string;
  city?: string;
  yeshiva?: string;
}): Promise<Student[]> {
  let students = await studentsWithCoordinator();

  if (filters?.coordinator)
    students = students.filter((s) => s.coordinator_id === filters.coordinator);
  if (filters?.city)
    students = students.filter((s) => s.city === filters.city);
  if (filters?.yeshiva) {
    const term = filters.yeshiva.toLowerCase();
    students = students.filter((s) => s.yeshiva?.toLowerCase().includes(term));
  }

  return students.sort((a, b) =>
    a.last_name.localeCompare(b.last_name, "he") ||
    a.first_name.localeCompare(b.first_name, "he")
  );
}

export async function getStudent(id: string): Promise<Student | null> {
  const students = await studentsWithCoordinator();
  return students.find((s) => s.id === id) ?? null;
}

export async function updateStudent(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    first_name: "שם",
    last_name: "משפחה",
    city: "עיר",
    street: "רחוב",
    birth_date: "תאריך לידה",
    id_number: "מספר מזהה",
    phone: "Phone Number",
    father_name: "שם האב",
    yeshiva: "ישיבה",
    track: "מסלול",
    enrollment_date: "Enrollment Date",
    nedarim_id: "מזהה נדרים",
    nedarim_charged: "הוטען",
    notes: "הערות",
  };
  const linkFields: Record<string, string> = {
    coordinator_id: "רכז",
    group_id: "קבוצה/ישיבה",
  };

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) {
      fields[fieldMap[k]] = v;
    } else if (linkFields[k]) {
      fields[linkFields[k]] = v ? [v as string] : [];
    }
  }
  await patchRecord(TABLES.STUDENTS, id, fields);
}

export async function getStudentsForNedarim(coordinatorId?: string): Promise<
  Pick<Student, "id" | "first_name" | "last_name" | "nedarim_id" | "nedarim_amount" | "nedarim_charged">[]
> {
  const students = await studentList();
  return students
    .filter((s) => !coordinatorId || s.coordinator_id === coordinatorId)
    .map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      nedarim_id: s.nedarim_id,
      nedarim_amount: s.nedarim_amount,
      nedarim_charged: s.nedarim_charged,
    }))
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "he"));
}

export async function updateNedarimCharged(id: string, charged: number): Promise<void> {
  await patchRecord(TABLES.STUDENTS, id, { "הוטען": charged });
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export async function getExam(id: string): Promise<Exam | null> {
  const exams = await getExams();
  return exams.find((e) => e.id === id) ?? null;
}

export async function updateExam(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    parasha: "פרשה",
    exam_date: "תאריך",
    results: "Results",
    participation_rate: "Participation Rate (%)",
  };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
  }
  await patchRecord(TABLES.EXAMS, id, fields);
}

// ─── Scores ──────────────────────────────────────────────────────────────────

export async function getAllScores(): Promise<Score[]> {
  return scoreList();
}

export async function getScoresByExam(examId: string): Promise<Score[]> {
  const [scores, students, exams] = await Promise.all([
    scoreList(),
    studentsWithCoordinator(),
    getExams(),
  ]);
  return withScoreRelations(
    scores.filter((s) => s.exam_id === examId),
    byId(students),
    byId(exams)
  );
}

export async function getScoresByExamForCoordinator(
  examId: string,
  coordinatorId: string
): Promise<Score[]> {
  const scores = await getScoresByExam(examId);
  return scores.filter((s) => s.student?.coordinator_id === coordinatorId);
}

export async function getAllScoresForCoordinator(coordinatorId: string): Promise<Score[]> {
  const [scores, students] = await Promise.all([scoreList(), studentList()]);
  const studentMap = byId(students);
  return scores.filter(
    (s) => studentMap.get(s.student_id)?.coordinator_id === coordinatorId
  );
}

export async function getScoresByStudent(studentId: string): Promise<Score[]> {
  const [scores, exams] = await Promise.all([scoreList(), getExams()]);
  const examMap = byId(exams);
  return withScoreRelations(
    scores.filter((s) => s.student_id === studentId),
    undefined,
    examMap
  ).sort((a, b) => (b.exam?.exam_date ?? "").localeCompare(a.exam?.exam_date ?? ""));
}

// All scores with their student (incl. the student's coordinator) and exam.
export async function getScoresWithRelations(): Promise<Score[]> {
  const [scores, students, exams] = await Promise.all([
    scoreList(),
    studentsWithCoordinator(),
    getExams(),
  ]);
  return withScoreRelations(scores, byId(students), byId(exams)).sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? "")
  );
}

export async function getScoresWithRelationsForCoordinator(
  coordinatorId: string
): Promise<Score[]> {
  const scores = await getScoresWithRelations();
  return scores.filter((s) => s.student?.coordinator_id === coordinatorId);
}

export async function updateScore(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    chassidut_score: "מבחן חסידות",
    halacha_score: "מבחן הלכה",
    tefila_score: "מבחן שערי תפילה",
    beinoni_score: "מבחן הבינני",
    shleimut_score: "מבחן שלימות התפילה",
    attended_seder: "השתתף בסדר",
    arrived_on_time: "הגעה 5 דקות ראשונות",
    attended_class: "השתתף בשיעור",
    weekly_summary: "סיכום שבועי",
    attended_seder_old: 'השתתף בסדר {ישן}',
    arrived_on_time_old: 'הגעה ב-5 דקות ראשונות {ישן}',
    paid: "שולם",
    points_kaitz: "נקודות זמן קיץ תשפו",
    personal_note: 'פניה אישית (לכה"פ ל-2 בחורים בשבוע)',
    rabbi_note: "שמתי לב.... (הערות להרב חיים מרדכי ישיר)",
  };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
  }
  await patchRecord(TABLES.SCORES, id, fields);
}

// ─── Inquiries ───────────────────────────────────────────────────────────────

async function inquiriesWithRelations(): Promise<Inquiry[]> {
  const [inquiries, students, coordinators] = await Promise.all([
    inquiryList(),
    studentsWithCoordinator(),
    coordinatorMap(),
  ]);
  const studentMap = byId(students);
  return inquiries.map((i) => ({
    ...i,
    student: i.student_id ? studentMap.get(i.student_id) : undefined,
    coordinator: i.coordinator_id ? coordinators.get(i.coordinator_id) : undefined,
  }));
}

export async function getInquiries(statusFilter?: string): Promise<Inquiry[]> {
  const inquiries = await inquiriesWithRelations();
  return statusFilter ? inquiries.filter((i) => i.status === statusFilter) : inquiries;
}

export async function getInquiriesByStudent(studentId: string): Promise<Inquiry[]> {
  const inquiries = await inquiryList();
  return inquiries.filter((i) => i.student_id === studentId);
}

export async function getInquiriesByCoordinator(coordinatorId: string): Promise<Inquiry[]> {
  const inquiries = await inquiriesWithRelations();
  return inquiries.filter((i) => i.coordinator_id === coordinatorId);
}

export async function createInquiry(data: {
  title: string;
  coordinator_id: string | null;
  student_id: string | null;
  inquiry_date: string | null;
  target_date: string | null;
  description: string | null;
}): Promise<void> {
  const fields: Record<string, unknown> = {
    "שם": data.title,
    "סטטוס": "חדש",
  };
  if (data.coordinator_id) fields["רכז"] = [data.coordinator_id];
  if (data.student_id) fields["בחור"] = [data.student_id];
  if (data.inquiry_date) fields["תאריך"] = data.inquiry_date;
  if (data.target_date) fields["תאריך יעד"] = data.target_date;
  if (data.description) fields["תיאור"] = data.description;
  await createRecord(TABLES.INQUIRIES, fields);
}

export async function updateInquiry(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    title: "שם",
    status: "סטטוס",
    inquiry_date: "תאריך",
    description: "תיאור",
    target_date: "תאריך יעד",
    close_date: "תאריך סיום",
    cancel_reminder: "ביטול תזכורת",
  };
  const linkFields: Record<string, string> = {
    coordinator_id: "רכז",
    student_id: "בחור",
  };

  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
    else if (linkFields[k]) fields[linkFields[k]] = v ? [v as string] : [];
  }
  await patchRecord(TABLES.INQUIRIES, id, fields);
}

// ─── Finances ────────────────────────────────────────────────────────────────

export async function getFinances(): Promise<Finance[]> {
  const [finances, coordinators] = await Promise.all([financeList(), coordinatorMap()]);
  return withCoordinator(finances, coordinators);
}

export async function getFinancesByCoordinator(coordinatorId: string): Promise<Finance[]> {
  const finances = await getFinances();
  return finances.filter((f) => f.coordinator_id === coordinatorId);
}

export async function updateFinance(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    name: "שם",
    payment_date: "תאריך",
    amount: "סכום",
  };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
    else if (k === "coordinator_id") fields["רכז"] = v ? [v as string] : [];
  }
  await patchRecord(TABLES.FINANCES, id, fields);
}

// ─── Coordinator Instructions ─────────────────────────────────────────────────

export async function getInstructions(): Promise<CoordinatorInstruction[]> {
  const [instructions, coordinators] = await Promise.all([
    instructionList(),
    coordinatorMap(),
  ]);
  return withCoordinator(instructions, coordinators);
}

export async function updateInstruction(
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const fieldMap: Record<string, string> = {
    title: "כותרת",
    content: "טקסט",
    viewed: "נצפה",
    coordinator_response: "תגובת רכז",
    office_status: "סטטוס משרד",
    bank_notice: "הודעת בנק",
  };
  const fields: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (fieldMap[k]) fields[fieldMap[k]] = v;
    else if (k === "coordinator_id") fields["רכז"] = v ? [v as string] : [];
  }
  await patchRecord(TABLES.INSTRUCTIONS, id, fields);
}

// ─── Coordinator Exam Notes (אקסל מנהל) ─────────────────────────────────────

export type CoordinatorExamNote = {
  id: string;
  coordinator_id: string | null;
  exam_id: string | null;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
};

function toExamNote(r: AirtableRecord): CoordinatorExamNote {
  const f = r.fields;
  return {
    id: r.id,
    coordinator_id: linkedId(f["משפיע"]),
    exam_id: linkedId(f["פרשה"]),
    sicha_beinyan: str(f["שיחה בעניין"]),
    maskana: str(f["מסקנה"]),
    hemshech_tipul: str(f["המשך טיפול ומעקב"]),
  };
}

export async function getExamNotesByExam(examId: string): Promise<CoordinatorExamNote[]> {
  const notes = await examNoteList();
  return notes.filter((n) => n.exam_id === examId);
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
  const notes = await examNoteList();
  const existing = notes.find(
    (n) => n.coordinator_id === coordinatorId && n.exam_id === examId
  );

  const fields: Record<string, unknown> = {
    "שיחה בעניין": sicha_beinyan ?? null,
    "מסקנה": maskana ?? null,
    "המשך טיפול ומעקב": hemshech_tipul ?? null,
  };

  if (existing) {
    await patchRecord(TABLES.EXAM_NOTES, existing.id, fields);
  } else {
    await createRecord(TABLES.EXAM_NOTES, {
      ...fields,
      "משפיע": [coordinatorId],
      "פרשה": [examId],
    });
  }
}
