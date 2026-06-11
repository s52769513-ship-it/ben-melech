import { unstable_cache } from "next/cache";
import {
  fetchAll,
  fetchOne,
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

function toStudent(r: AirtableRecord, coordinatorMap?: Map<string, Coordinator>): Student {
  const f = r.fields;
  const coordinatorId = linkedId(f["רכז"]);
  const groupId = linkedId(f["קבוצה/ישיבה"]);
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
    coordinator_id: coordinatorId,
    nedarim_id: num(f["מזהה נדרים"]),
    group_id: groupId,
    notes: null,
    nedarim_amount: num(f["כסף להטענה"]) ?? 0,
    nedarim_charged: num(f["הוטען"]) ?? 0,
    coordinator: coordinatorId && coordinatorMap ? coordinatorMap.get(coordinatorId) : undefined,
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

function toScore(
  r: AirtableRecord,
  studentMap?: Map<string, Student>,
  examMap?: Map<string, Exam>
): Score {
  const f = r.fields;
  const studentId = linkedId(f["בחור"]);
  const examId = linkedId(f["מבחן"]);
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    student_id: studentId ?? "",
    exam_id: examId ?? "",
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
    student: studentId && studentMap ? studentMap.get(studentId) : undefined,
    exam: examId && examMap ? examMap.get(examId) : undefined,
  };
}

function toInquiry(
  r: AirtableRecord,
  studentMap?: Map<string, Student>,
  coordinatorMap?: Map<string, Coordinator>
): Inquiry {
  const f = r.fields;
  const studentId = linkedId(f["בחור"]);
  const coordinatorId = linkedId(f["רכז"]);
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    title: str(f["שם"]) ?? "",
    coordinator_id: coordinatorId,
    student_id: studentId,
    status: (str(f["סטטוס"]) ?? "פתוח") as Inquiry["status"],
    inquiry_date: str(f["תאריך"]),
    description: str(f["תיאור"]),
    target_date: str(f["תאריך יעד"]),
    close_date: str(f["תאריך סיום"]),
    cancel_reminder: bool(f["ביטול תזכורת"]),
    summary: str(f["סיכום"]),
    category: str(f["קטגוריה"]),
    student: studentId && studentMap ? studentMap.get(studentId) : undefined,
    coordinator: coordinatorId && coordinatorMap ? coordinatorMap.get(coordinatorId) : undefined,
  };
}

function toFinance(
  r: AirtableRecord,
  coordinatorMap?: Map<string, Coordinator>
): Finance {
  const f = r.fields;
  const coordinatorId = linkedId(f["רכז"]);
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    name: str(f["שם"]),
    payment_date: str(f["תאריך"]),
    amount: num(f["סכום"]),
    coordinator_id: coordinatorId,
    coordinator: coordinatorId && coordinatorMap ? coordinatorMap.get(coordinatorId) : undefined,
  };
}

function toInstruction(
  r: AirtableRecord,
  coordinatorMap?: Map<string, Coordinator>
): CoordinatorInstruction {
  const f = r.fields;
  const coordinatorId = linkedId(f["רכז"]);
  return {
    id: r.id,
    created_at: r.createdTime ?? "",
    title: str(f["כותרת"]) ?? "",
    content: str(f["טקסט"]),
    coordinator_id: coordinatorId,
    viewed: bool(f["נצפה"]),
    coordinator_response: str(f["תגובת רכז"]),
    sent_date: str(f["תאריך"]) ?? "",
    office_status: str(f["סטטוס משרד"]),
    bank_notice: bool(f["הודעת בנק"]),
    coordinator: coordinatorId && coordinatorMap ? coordinatorMap.get(coordinatorId) : undefined,
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getCoordinatorMap(): Promise<Map<string, Coordinator>> {
  const recs = await fetchAll(TABLES.COORDINATORS);
  return new Map(recs.map((r) => [r.id, toCoordinator(r)]));
}

async function getStudentMap(
  coordinatorMap?: Map<string, Coordinator>
): Promise<Map<string, Student>> {
  const recs = await fetchAll(TABLES.STUDENTS);
  return new Map(recs.map((r) => [r.id, toStudent(r, coordinatorMap)]));
}

async function getExamMap(): Promise<Map<string, Exam>> {
  const recs = await fetchAll(TABLES.EXAMS);
  return new Map(recs.map((r) => [r.id, toExam(r)]));
}

// ─── Coordinators ────────────────────────────────────────────────────────────

export const getCoordinators = unstable_cache(
  async (): Promise<Coordinator[]> => {
    const recs = await fetchAll(TABLES.COORDINATORS);
    return recs.map(toCoordinator).sort((a, b) => a.name.localeCompare(b.name, "he"));
  },
  ["coordinators"],
  { revalidate: 120, tags: ["coordinators"] }
);

export const getCoordinator = unstable_cache(
  async (id: string): Promise<Coordinator | null> => {
    const r = await fetchOne(TABLES.COORDINATORS, id);
    return r ? toCoordinator(r) : null;
  },
  ["coordinator"],
  { revalidate: 120, tags: ["coordinators"] }
);

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchByIds(tableId: string, ids: string[]): Promise<AirtableRecord[]> {
  if (ids.length === 0) return [];
  const all: AirtableRecord[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    const recs = await fetchAll(tableId, { filterByFormula: formula });
    all.push(...recs);
  }
  return all;
}

// ─── Students ────────────────────────────────────────────────────────────────

export async function getStudents(filters?: {
  coordinator?: string;
  city?: string;
  yeshiva?: string;
}): Promise<Student[]> {
  const coordinatorMap = await getCoordinatorMap();
  // {ID רכז} is a multipleLookupValues field containing the coordinator record ID — ARRAYJOIN works on it
  const airtableParams: Record<string, string> | undefined = filters?.coordinator
    ? { filterByFormula: `FIND("${filters.coordinator}",ARRAYJOIN({ID רכז}))>0` }
    : undefined;
  const recs = await fetchAll(TABLES.STUDENTS, airtableParams);
  let students = recs.map((r) => toStudent(r, coordinatorMap));

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
  const [r, coordinatorMap] = await Promise.all([
    fetchOne(TABLES.STUDENTS, id),
    getCoordinatorMap(),
  ]);
  return r ? toStudent(r, coordinatorMap) : null;
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
  const params: Record<string, string> | undefined = coordinatorId
    ? { filterByFormula: `FIND("${coordinatorId}",ARRAYJOIN({ID רכז}))>0` }
    : undefined;
  const recs = await fetchAll(TABLES.STUDENTS, params);
  return recs
    .map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        first_name: str(f["שם"]) ?? "",
        last_name: str(f["משפחה"]) ?? "",
        nedarim_id: num(f["מזהה נדרים"]),
        nedarim_amount: num(f["כסף להטענה"]) ?? 0,
        nedarim_charged: num(f["הוטען"]) ?? 0,
      };
    })
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "he"));
}

export async function updateNedarimCharged(id: string, charged: number): Promise<void> {
  await patchRecord(TABLES.STUDENTS, id, { "הוטען": charged });
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export async function getGroups(): Promise<Group[]> {
  const recs = await fetchAll(TABLES.GROUPS);
  return recs.map(toGroup).sort((a, b) => a.name.localeCompare(b.name, "he"));
}

// ─── Exams ───────────────────────────────────────────────────────────────────

export const getExams = unstable_cache(
  async (): Promise<Exam[]> => {
    const recs = await fetchAll(TABLES.EXAMS);
    return recs
      .map(toExam)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  },
  ["exams"],
  { revalidate: 60, tags: ["exams"] }
);

export async function getExam(id: string): Promise<Exam | null> {
  const r = await fetchOne(TABLES.EXAMS, id);
  return r ? toExam(r) : null;
}

export async function getZmanim(): Promise<Zman[]> {
  const recs = await fetchAll(TABLES.ZMANIM);
  return recs
    .map(toZman)
    .filter((z) => z.name.trim() !== "");
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

// Fetch scores for a specific exam using the exam's reverse-linked score IDs.
// Note: ARRAYJOIN on linked record fields returns display names not IDs, so we
// can't use filterByFormula with record IDs on multipleRecordLinks fields.
export async function getScoresByExam(examId: string): Promise<Score[]> {
  const examRec = await fetchOne(TABLES.EXAMS, examId);
  if (!examRec) return [];
  const scoreIds = (examRec.fields["ציונים"] as string[] | undefined) ?? [];
  if (scoreIds.length === 0) return [];
  const [coordinatorMap, recs] = await Promise.all([
    getCoordinatorMap(),
    fetchByIds(TABLES.SCORES, scoreIds),
  ]);
  const studentMap = await getStudentMap(coordinatorMap);
  const exam = toExam(examRec);
  const examMap = new Map<string, Exam>([[examId, exam]]);
  return recs.map((r) => toScore(r, studentMap, examMap));
}

// {ID רכז} is a multipleLookupValues field → ARRAYJOIN works correctly.
// Then filter by exam in memory using raw fields["מבחן"] array (contains record IDs).
export async function getScoresByExamForCoordinator(
  examId: string,
  coordinatorId: string
): Promise<Score[]> {
  const [recs, coordinatorMap] = await Promise.all([
    fetchAll(TABLES.SCORES, {
      filterByFormula: `FIND("${coordinatorId}",ARRAYJOIN({ID רכז}))>0`,
    }),
    getCoordinatorMap(),
  ]);
  const studentMap = await getStudentMap(coordinatorMap);
  const exam: Exam | null = await getExam(examId);
  const examMap = exam ? new Map([[exam.id, exam]]) : new Map<string, Exam>();
  return recs
    .filter((r) => {
      const linked = r.fields["מבחן"] as string[] | null;
      return Array.isArray(linked) && linked.includes(examId);
    })
    .map((r) => toScore(r, studentMap, examMap));
}

export async function getAllScoresForCoordinator(coordinatorId: string): Promise<Score[]> {
  const recs = await fetchAll(TABLES.SCORES, {
    filterByFormula: `FIND("${coordinatorId}",ARRAYJOIN({ID רכז}))>0`,
  });
  return recs.map((r) => toScore(r));
}

// Use STUDENTS.{ציונים} reverse-link to get score IDs for this student.
export async function getScoresByStudent(studentId: string): Promise<Score[]> {
  const studentRec = await fetchOne(TABLES.STUDENTS, studentId);
  if (!studentRec) return [];
  const scoreIds = (studentRec.fields["ציונים"] as string[] | undefined) ?? [];
  if (scoreIds.length === 0) return [];
  const [examMap, recs] = await Promise.all([
    getExamMap(),
    fetchByIds(TABLES.SCORES, scoreIds),
  ]);
  return recs
    .map((r) => toScore(r, undefined, examMap))
    .sort((a, b) => (b.exam?.exam_date ?? "").localeCompare(a.exam?.exam_date ?? ""));
}

export async function getAllScores(): Promise<Score[]> {
  const recs = await fetchAll(TABLES.SCORES);
  return recs.map((r) => toScore(r));
}

// Fetch all scores with relations — no exam filtering (caller filters in memory).
export async function getScoresWithRelations(): Promise<Score[]> {
  const [coordinatorMap, examMap] = await Promise.all([
    getCoordinatorMap(),
    getExamMap(),
  ]);
  const studentMap = await getStudentMap(coordinatorMap);
  const recs = await fetchAll(TABLES.SCORES);
  return recs
    .map((r) => toScore(r, studentMap, examMap))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function getScoresWithRelationsForCoordinator(coordinatorId: string): Promise<Score[]> {
  const [recs, coordinatorMap, examMap] = await Promise.all([
    fetchAll(TABLES.SCORES, {
      filterByFormula: `FIND("${coordinatorId}",ARRAYJOIN({ID רכז}))>0`,
    }),
    getCoordinatorMap(),
    getExamMap(),
  ]);
  const studentMap = await getStudentMap(coordinatorMap);
  return recs
    .map((r) => toScore(r, studentMap, examMap))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
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

export async function getInquiries(statusFilter?: string): Promise<Inquiry[]> {
  const [coordinatorMap, studentRecs] = await Promise.all([
    getCoordinatorMap(),
    fetchAll(TABLES.STUDENTS),
  ]);
  const studentMap = new Map(studentRecs.map((r) => [r.id, toStudent(r, coordinatorMap)]));

  const recs = await fetchAll(TABLES.INQUIRIES);
  let inquiries = recs.map((r) => toInquiry(r, studentMap, coordinatorMap));

  if (statusFilter) inquiries = inquiries.filter((i) => i.status === statusFilter);

  return inquiries.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function getInquiriesByStudent(studentId: string): Promise<Inquiry[]> {
  // Use student's {פניות} reverse-link — REST API returns record IDs, not display names
  const studentRec = await fetchOne(TABLES.STUDENTS, studentId);
  if (!studentRec) return [];
  const inquiryIds = (studentRec.fields["פניות"] as string[] | undefined) ?? [];
  if (inquiryIds.length === 0) return [];
  const recs = await fetchByIds(TABLES.INQUIRIES, inquiryIds);
  return recs
    .map((r) => toInquiry(r))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
}

export async function getInquiriesByCoordinator(coordinatorId: string): Promise<Inquiry[]> {
  // Use coordinator's {פניות} reverse-link — REST API returns record IDs, not display names
  const [coordinatorRec, studentRecs] = await Promise.all([
    fetchOne(TABLES.COORDINATORS, coordinatorId),
    fetchAll(TABLES.STUDENTS, {
      filterByFormula: `FIND("${coordinatorId}",ARRAYJOIN({ID רכז}))>0`,
    }),
  ]);
  const studentMap = new Map(studentRecs.map((r) => [r.id, toStudent(r)]));
  const inquiryIds = (coordinatorRec?.fields["פניות"] as string[] | undefined) ?? [];
  if (inquiryIds.length === 0) return [];
  const recs = await fetchByIds(TABLES.INQUIRIES, inquiryIds);
  return recs
    .map((r) => toInquiry(r, studentMap))
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
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
    summary: "סיכום",
    category: "קטגוריה",
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
  const coordinatorMap = await getCoordinatorMap();
  const recs = await fetchAll(TABLES.FINANCES);
  return recs
    .map((r) => toFinance(r, coordinatorMap))
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));
}

export async function getFinancesByCoordinator(coordinatorId: string): Promise<Finance[]> {
  // Filter in memory — REST API returns IDs in linked record fields, safe to compare
  const recs = await fetchAll(TABLES.FINANCES);
  return recs
    .filter((r) => {
      const linked = r.fields["רכז"] as string[] | null;
      return Array.isArray(linked) && linked.includes(coordinatorId);
    })
    .map((r) => toFinance(r))
    .sort((a, b) => (b.payment_date ?? "").localeCompare(a.payment_date ?? ""));
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
  const coordinatorMap = await getCoordinatorMap();
  const recs = await fetchAll(TABLES.INSTRUCTIONS);
  return recs.map((r) => toInstruction(r, coordinatorMap));
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
  const recs = await fetchAll(TABLES.EXAM_NOTES, {
    filterByFormula: `FIND("${examId}", ARRAYJOIN({פרשה}))>0`,
  });
  return recs.map(toExamNote);
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
  const existing = await fetchAll(TABLES.EXAM_NOTES, {
    filterByFormula: `AND(FIND("${coordinatorId}", ARRAYJOIN({משפיע}))>0, FIND("${examId}", ARRAYJOIN({פרשה}))>0)`,
  });

  const fields: Record<string, unknown> = {
    "שיחה בעניין": sicha_beinyan ?? null,
    "מסקנה": maskana ?? null,
    "המשך טיפול ומעקב": hemshech_tipul ?? null,
  };

  if (existing.length > 0) {
    await patchRecord(TABLES.EXAM_NOTES, existing[0].id, fields);
  } else {
    await createRecord(TABLES.EXAM_NOTES, {
      ...fields,
      "משפיע": [coordinatorId],
      "פרשה": [examId],
    });
  }
}
