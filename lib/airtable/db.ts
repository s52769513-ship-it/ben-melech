import { cacheLife, cacheTag } from "next/cache";
import {
  fetchAll,
  fetchOne,
  patchRecord,
  patchRecords,
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
  NedarimLedgerEntry,
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
    avg_score: num(f["ממוצע ציונים"]),
    total_exams: num(f["סך מבחנים"]),
    total_sedarim: num(f["סך סדרים"]),
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
    created_at: r.createdTime ?? "",
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
    manual_points: num(f["הוספת נקודות ידני"]),
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
// Scores is by far the biggest table — a full read is one request per 100 rows,
// so it refreshes on a longer beat. Writes push it forward on their own via
// revalidateTag, and stale rows are still served while that happens.
const BULK = { stale: 60, revalidate: 900, expire: 7200 } as const;

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
  return recs
    .map(toZman)
    .filter((z) => z.name.trim() !== "")
    // Newest first: the zman just opened is the one being worked in, so it
    // leads the list and is what "the current zman" means everywhere else.
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
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

// One parasha's scores, read through the exam's own list of score rows. A
// screen about a single parasha costs a handful of requests this way; reading
// the whole table for it costs one per hundred rows in the base. Tagged per
// exam as well, so saving a mark refreshes only that parasha.
async function scoresForExam(examId: string): Promise<Score[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("scores", scoreExamTag(examId));

  const exam = await fetchOne(TABLES.EXAMS, examId);
  const scoreIds = (exam?.fields?.["ציונים"] as string[] | undefined) ?? [];
  if (scoreIds.length === 0) return [];

  const records: AirtableRecord[] = [];
  for (let i = 0; i < scoreIds.length; i += 100) {
    const chunk = scoreIds.slice(i, i + 100);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    records.push(...(await fetchAll(TABLES.SCORES, { filterByFormula: formula })));
  }
  return records.map(toScore);
}

export function scoreExamTag(examId: string): string {
  return `scores-exam-${examId}`;
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
  await patchRecord(TABLES.STUDENTS, id, toStudentFields(data));
}

const STUDENT_FIELDS: Record<string, string> = {
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

const STUDENT_LINK_FIELDS: Record<string, string> = {
  coordinator_id: "רכז",
  group_id: "קבוצה/ישיבה",
};

function toStudentFields(
  data: Record<string, unknown>,
  { skipEmpty = false } = {}
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    // On create, a blank box means "not filled in" — sending it as null asks
    // Airtable to write every field on the table, including ones a new bochur
    // has no business setting.
    if (skipEmpty && (value === null || value === undefined || value === "")) continue;
    if (STUDENT_FIELDS[key]) fields[STUDENT_FIELDS[key]] = value;
    else if (STUDENT_LINK_FIELDS[key]) {
      fields[STUDENT_LINK_FIELDS[key]] = value ? [value as string] : [];
    }
  }
  return fields;
}

export async function createStudent(data: Record<string, unknown>): Promise<string> {
  const record = await createRecord(TABLES.STUDENTS, toStudentFields(data, { skipEmpty: true }));
  return record.id;
}

// Move a whole group of bochurim to another משפיע in one go — the start-of-year
// reshuffle, rather than opening each bochur in turn.
export async function reassignCoordinator(
  studentIds: string[],
  coordinatorId: string | null
): Promise<void> {
  if (studentIds.length === 0) return;
  await patchRecords(
    TABLES.STUDENTS,
    studentIds.map((id) => ({
      id,
      fields: { "רכז": coordinatorId ? [coordinatorId] : [] },
    }))
  );
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

// ─── What the interface is allowed to load ───────────────────────────────────
//
// "כסף להטענה" in Airtable is an all-time figure: it carries every shekel a
// bochur ever earned, including years that were paid out by hand, long before
// this screen existed. Loading that figure onto a card would pay all of it a
// second time. So money earned before this date is history — it is shown, and
// it is never loadable from here. Only parshiyot from the cutoff on count
// toward what may go onto a card.
export const NEDARIM_CUTOFF = process.env.NEDARIM_CUTOFF_DATE ?? "2026-09-01";

// A parasha counts as recent by its own date, or — while none is set yet — by
// the day its row was created.
function isRecentExam(e: Exam): boolean {
  return (e.exam_date ?? e.created_at ?? "").slice(0, 10) >= NEDARIM_CUTOFF;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// Money earned per bochur since the cutoff, summed from the parshiyot
// themselves. Only the recent parshiyot are read, and each of those reads is
// the same cached one the parasha screen already uses.
async function recentMoneyByStudent(): Promise<Map<string, number>> {
  const exams = (await getExams()).filter(isRecentExam);
  const money = new Map<string, number>();
  // Three parshiyot at a time — Airtable throttles a base at five requests a
  // second (same pacing as the score reads above).
  for (let i = 0; i < exams.length; i += 3) {
    const batch = await Promise.all(exams.slice(i, i + 3).map((e) => scoresForExam(e.id)));
    for (const rows of batch) {
      for (const row of rows) {
        if (!row.student_id) continue;
        money.set(row.student_id, (money.get(row.student_id) ?? 0) + (row.payment_amount ?? 0));
      }
    }
  }
  return money;
}

// The loading ledger, one row per bochur.
//
// historic = everything earned before the cutoff. It is settled off-line, so
// the interface writes it off in one go ("הוטען" is raised to cover it) and
// from then on the ordinary "total − charged" arithmetic can only ever reach
// money earned since. Until that write-off happens nothing is loadable for
// that bochur, which is what keeps the old balances off the cards.
export async function getNedarimLedger(coordinatorId?: string): Promise<NedarimLedgerEntry[]> {
  const [students, recentMoney] = await Promise.all([
    getStudentsForNedarim(coordinatorId),
    recentMoneyByStudent(),
  ]);

  return students.map((s) => {
    const total = s.nedarim_amount ?? 0;
    const charged = s.nedarim_charged ?? 0;
    // Airtable's total is the authority on what a bochur earned; the sum from
    // the recent parshiyot can never exceed it.
    const recent = round(Math.min(recentMoney.get(s.id) ?? 0, Math.max(total, 0)));
    const historic = round(Math.max(total - recent, 0));
    const settled = charged >= historic - 0.01;

    return {
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      nedarim_id: s.nedarim_id,
      total: round(total),
      charged: round(charged),
      recent,
      historic,
      chargeable: settled ? round(Math.max(Math.min(total - charged, recent), 0)) : 0,
      settled,
    };
  });
}

// Close the historic balances: "הוטען" is raised to the money earned before the
// cutoff, so those shekels count as handled and only what comes after is left
// to load. Nothing is charged to a card here — this only moves the line in
// Airtable. Bochurim whose historic balance is already covered are skipped.
export async function settleHistoricNedarim(studentIds?: string[]): Promise<number> {
  const ledger = await getNedarimLedger();
  const pending = ledger.filter(
    (e) => !e.settled && (!studentIds || studentIds.includes(e.id))
  );
  if (pending.length === 0) return 0;
  await patchRecords(
    TABLES.STUDENTS,
    pending.map((e) => ({ id: e.id, fields: { "הוטען": e.historic } }))
  );
  return pending.length;
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

// ─── Zmanim ──────────────────────────────────────────────────────────────────

// The zman being worked in: the most recently opened one. Everything created
// from here on hangs off it until the next zman is opened.
export function currentZman(zmanim: Zman[]): Zman | null {
  return zmanim[0] ?? null;
}

export async function createZman(name: string, season: string | null): Promise<string> {
  const fields: Record<string, unknown> = { "זמן": name.trim() };
  if (season) fields["שם זמן"] = season;
  try {
    const record = await createRecord(TABLES.ZMANIM, fields);
    return record.id;
  } catch (err) {
    // "שם זמן" is a single select in some bases and a formula in others; if
    // Airtable refuses it, the zman is still worth creating with its name.
    if (!season) throw err;
    const record = await createRecord(TABLES.ZMANIM, { "זמן": name.trim() });
    return record.id;
  }
}

// Parshiyot linked from here since this server started. A parasha is attached
// on the way into the exams screen, but the exams read is cached for a few
// minutes and still shows it loose — this keeps us from writing the same link
// on every visit until that cache turns over, and lets the screen show the
// link right away.
const linkedByUs = new Map<string, string | null>();

// Moving a parasha between zmanim — an empty link array detaches it.
export async function setExamZman(examId: string, zmanId: string | null): Promise<void> {
  await patchRecord(TABLES.EXAMS, examId, { "זמן ושנה": zmanId ? [zmanId] : [] });
  linkedByUs.set(examId, zmanId);
}

// Every parasha created after a zman was opened belongs to that zman. Airtable
// leaves "זמן ושנה" empty on a new row, so the exams screen attaches the loose
// ones to the current zman as it loads. Parshiyot from before the zman was
// opened, and any parasha already pointing at a zman, are left alone.
export async function attachNewExamsToCurrentZman(): Promise<{
  exams: Exam[];
  zmanim: Zman[];
  current: Zman | null;
}> {
  const [rawExams, zmanim] = await Promise.all([getExams(), getZmanim()]);
  const current = currentZman(zmanim);

  if (current) {
    const loose = rawExams.filter(
      (e) =>
        !e.zman_id &&
        !linkedByUs.has(e.id) &&
        (e.created_at ?? "") >= (current.created_at ?? "")
    );
    if (loose.length > 0) {
      await patchRecords(
        TABLES.EXAMS,
        loose.map((e) => ({ id: e.id, fields: { "זמן ושנה": [current.id] } }))
      );
      for (const e of loose) linkedByUs.set(e.id, current.id);
    }
  }

  const exams = rawExams.map((e) =>
    linkedByUs.has(e.id) ? { ...e, zman_id: linkedByUs.get(e.id) ?? null } : e
  );
  return { exams, zmanim, current };
}

// A parasha belongs to a zman by its own link; the zman's list of parshiyot is
// the fallback for the moment right after a link is written, while the cached
// read still has the old picture.
export function examsOfZman(exams: Exam[], zman: Zman): Exam[] {
  return exams.filter(
    (e) => e.zman_id === zman.id || (!e.zman_id && zman.exam_ids.includes(e.id))
  );
}

// ─── Scores ──────────────────────────────────────────────────────────────────

// Scores for the zman in progress. Built from the per-parasha reads the rest of
// the app already uses, so these entries are shared and usually warm — and no
// screen ever asks Airtable for every score in the base, which took hundreds of
// sequential requests and ran the account into its rate limit.
export async function getScoresForZman(zmanId: string | null): Promise<Score[]> {
  const [exams, zmanim] = await Promise.all([getExams(), getZmanim()]);
  const zman = zmanId ? zmanim.find((z) => z.id === zmanId) : null;
  const examIds = zman
    ? exams.filter((e) => zman.exam_ids.includes(e.id)).map((e) => e.id)
    : exams.map((e) => e.id);

  const scores: Score[] = [];
  // A few parshiyot at a time — Airtable throttles a base at five requests a
  // second, and going wider here slows every other screen down with it.
  for (let i = 0; i < examIds.length; i += 3) {
    const batch = await Promise.all(examIds.slice(i, i + 3).map(scoresForExam));
    for (const rows of batch) scores.push(...rows);
  }
  return scores;
}

// The zman the newest parasha belongs to.
export async function getCurrentZmanId(): Promise<string | null> {
  const [exams, zmanim] = await Promise.all([getExams(), getZmanim()]);
  const withZman = exams.find((e) => e.zman_id);
  if (withZman?.zman_id && zmanim.some((z) => z.id === withZman.zman_id)) {
    return withZman.zman_id;
  }
  return zmanim[0]?.id ?? null;
}

export async function getScoresForCurrentZman(): Promise<Score[]> {
  return getScoresForZman(await getCurrentZmanId());
}

export async function getAllScores(): Promise<Score[]> {
  return getScoresForCurrentZman();
}

export async function getScoresByExam(examId: string): Promise<Score[]> {
  const [scores, students, exams] = await Promise.all([
    scoresForExam(examId),
    studentsWithCoordinator(),
    getExams(),
  ]);
  return withScoreRelations(scores, byId(students), byId(exams));
}

export async function getScoresByExamForCoordinator(
  examId: string,
  coordinatorId: string
): Promise<Score[]> {
  const scores = await getScoresByExam(examId);
  return scores.filter((s) => s.student?.coordinator_id === coordinatorId);
}

export async function getAllScoresForCoordinator(coordinatorId: string): Promise<Score[]> {
  const [scores, students] = await Promise.all([getScoresForCurrentZman(), studentList()]);
  const studentMap = byId(students);
  return scores.filter(
    (s) => studentMap.get(s.student_id)?.coordinator_id === coordinatorId
  );
}

// A bochur's full history, through his own list of score rows — two requests,
// so the profile keeps every zman rather than just the current one.
async function scoresForStudent(studentId: string): Promise<Score[]> {
  "use cache: remote";
  cacheLife(LIVE);
  cacheTag("scores", `scores-student-${studentId}`);

  const student = await fetchOne(TABLES.STUDENTS, studentId);
  const scoreIds = (student?.fields?.["ציונים"] as string[] | undefined) ?? [];
  if (scoreIds.length === 0) return [];

  const records: AirtableRecord[] = [];
  for (let i = 0; i < scoreIds.length; i += 100) {
    const chunk = scoreIds.slice(i, i + 100);
    const formula = `OR(${chunk.map((id) => `RECORD_ID()="${id}"`).join(",")})`;
    records.push(...(await fetchAll(TABLES.SCORES, { filterByFormula: formula })));
  }
  return records.map(toScore);
}

export async function getScoresByStudent(studentId: string): Promise<Score[]> {
  const [scores, exams] = await Promise.all([scoresForStudent(studentId), getExams()]);
  return withScoreRelations(scores, undefined, byId(exams)).sort((a, b) =>
    (b.exam?.exam_date ?? "").localeCompare(a.exam?.exam_date ?? "")
  );
}

// All scores with their student (incl. the student's coordinator) and exam.
export async function getScoresWithRelations(): Promise<Score[]> {
  const [scores, students, exams] = await Promise.all([
    getScoresForCurrentZman(),
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
    // "נקודות זמן קיץ תשפו" is a formula in Airtable and rejects writes — the
    // editable field behind the "נקודות ידני" column is this one.
    manual_points: "הוספת נקודות ידני",
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
