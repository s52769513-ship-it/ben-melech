/**
 * One-time migration: Airtable → Supabase
 * Run with: npx tsx scripts/migrate-from-airtable.ts
 *
 * Requires env vars: AIRTABLE_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

const BASE_ID = "appFwuERdEigGl4Ko";
const TABLES = {
  COORDINATORS: "tbl9qvdwAmwA8TIhr",
  STUDENTS: "tblWmWBpyEEcxVWIU",
  FINANCES: "tblyu8tJ4melhX6cD",
  INQUIRIES: "tbl2h0uddAfcW524w",
  EXAMS: "tbl2pigfbScOzjse3",
  SCORES: "tblP8DKZzh3yOtxOi",
  INSTRUCTIONS: "tblDIiuNxgFqMTXQ0",
  GROUPS: "tblHoD5ExTHeeR7EM",
  EXAM_NOTES: "tbl2w1Xbzpi2FXEtR",
  ZMANIM: "tblrLUJBm4PqYt8rg",
} as const;

function getToken() {
  const t = process.env.AIRTABLE_TOKEN;
  if (!t) throw new Error("AIRTABLE_TOKEN not set");
  return t;
}

async function airtableRequest(path: string) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ records: { id: string; fields: Record<string, unknown>; createdTime?: string }[]; offset?: string }>;
}

async function fetchAll(tableId: string) {
  const records: { id: string; fields: Record<string, unknown>; createdTime?: string }[] = [];
  let offset: string | undefined;
  do {
    const sp = new URLSearchParams({ pageSize: "100" });
    if (offset) sp.set("offset", offset);
    const data = await airtableRequest(`${tableId}?${sp}`);
    records.push(...data.records);
    offset = data.offset;
    if (offset) await new Promise((r) => setTimeout(r, 200)); // rate limit
  } while (offset);
  return records;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v) || null;
}
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}
function bool(v: unknown): boolean {
  return v === true;
}
function linkedId(v: unknown): string | null {
  const arr = v as string[] | undefined;
  return arr?.[0] ?? null;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");

  const sb = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  async function upsert(table: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      const { error } = await sb.from(table).upsert(chunk, { onConflict: "id" });
      if (error) throw new Error(`${table}: ${error.message}`);
    }
    console.log(`  ✓ ${table}: ${rows.length} records`);
  }

  console.log("Migrating coordinators...");
  const coordRecs = await fetchAll(TABLES.COORDINATORS);
  await upsert("coordinators", coordRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    name: str(r.fields["שם רכז"]) ?? "",
    phone: str(r.fields["טלפון"]),
    city: str(r.fields["עיר copy"]),
    bank: str(r.fields["בנק"]),
    branch_number: num(r.fields["סניף"]),
    account_number: num(r.fields["חשבון"]),
    id_number: num(r.fields["ת.ז."]),
    email: str(r.fields["מייל"]),
    notes: str(r.fields["הערות"]),
    monthly_salary: num(r.fields["סכום משכורת חודשי"]) ?? 0,
  })));

  console.log("Migrating groups...");
  const groupRecs = await fetchAll(TABLES.GROUPS);
  await upsert("groups", groupRecs.map((r) => ({
    id: r.id,
    name: str(r.fields["Name"]) ?? "",
    group_number: num(r.fields["ID"]),
  })));

  console.log("Migrating zmanim...");
  const zmanRecs = await fetchAll(TABLES.ZMANIM);
  await upsert("zmanim", zmanRecs.map((r) => ({
    id: r.id,
    name: str(r.fields["זמן"]) ?? "",
    season: str(r.fields["שם זמן"]),
  })));

  console.log("Migrating students...");
  const studentRecs = await fetchAll(TABLES.STUDENTS);
  await upsert("students", studentRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    first_name: str(r.fields["שם"]) ?? "",
    last_name: str(r.fields["משפחה"]) ?? "",
    city: str(r.fields["עיר"]),
    street: str(r.fields["רחוב"]),
    birth_date: str(r.fields["תאריך לידה"]),
    id_number: num(r.fields["מספר מזהה"]),
    phone: str(r.fields["Phone Number"]),
    father_name: str(r.fields["שם האב"]),
    yeshiva: str(r.fields["ישיבה"]),
    track: str(r.fields["מסלול"]),
    enrollment_date: str(r.fields["Enrollment Date"]),
    coordinator_id: linkedId(r.fields["רכז"]),
    nedarim_id: num(r.fields["מזהה נדרים"]),
    group_id: linkedId(r.fields["קבוצה/ישיבה"]),
    notes: str(r.fields["הערות"]),
    nedarim_amount: num(r.fields["כסף להטענה"]),
    nedarim_charged: num(r.fields["הוטען"]),
    summer_points: num(r.fields["נקודות זמן קיץ תשפו"]),
    summer_points_over_500: num(r.fields["נקודות זמן קיץ תשפו (מעל 500)"]),
  })));

  console.log("Migrating exams...");
  const examRecs = await fetchAll(TABLES.EXAMS);
  await upsert("exams", examRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    parasha: str(r.fields["פרשה"]) ?? "",
    exam_date: str(r.fields["תאריך"]),
    results: str(r.fields["Results"]),
    participation_rate: num(r.fields["Participation Rate (%)"]),
    zman_id: linkedId(r.fields["זמן ושנה"]),
  })));

  console.log("Migrating scores...");
  const scoreRecs = await fetchAll(TABLES.SCORES);
  const validStudentIds = new Set(studentRecs.map((r) => r.id));
  const validExamIds = new Set(examRecs.map((r) => r.id));
  const validScores = scoreRecs.filter((r) => {
    const sid = linkedId(r.fields["בחור"]);
    const eid = linkedId(r.fields["מבחן"]);
    return sid && eid && validStudentIds.has(sid) && validExamIds.has(eid);
  });
  await upsert("scores", validScores.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    student_id: linkedId(r.fields["בחור"])!,
    exam_id: linkedId(r.fields["מבחן"])!,
    chassidut_score: num(r.fields["מבחן חסידות"]),
    halacha_score: num(r.fields["מבחן הלכה"]),
    tefila_score: num(r.fields["מבחן שערי תפילה"]),
    beinoni_score: num(r.fields["מבחן הבינני"]),
    shleimut_score: num(r.fields["מבחן שלימות התפילה"]),
    attended_seder: bool(r.fields["השתתף בסדר"]),
    arrived_on_time: bool(r.fields["הגעה 5 דקות ראשונות"]),
    attended_class: bool(r.fields["השתתף בשיעור"]),
    weekly_summary: bool(r.fields["סיכום שבועי"]),
    attended_seder_old: bool(r.fields["השתתף בסדר {ישן}"]),
    arrived_on_time_old: bool(r.fields["הגעה ב-5 דקות ראשונות {ישן}"]),
    paid: bool(r.fields["שולם"]),
    payment_amount: num(r.fields["סכום לתשלום"]) ?? 0,
    points: num(r.fields["נקודות"]),
    points_kaitz: num(r.fields["נקודות זמן קיץ תשפו"]),
    personal_note: str(r.fields['פניה אישית (לכה"פ ל-2 בחורים בשבוע)']),
    rabbi_note: str(r.fields["שמתי לב.... (הערות להרב חיים מרדכי ישיר)"]),
  })));

  console.log("Migrating inquiries...");
  const inquiryRecs = await fetchAll(TABLES.INQUIRIES);
  await upsert("inquiries", inquiryRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    title: str(r.fields["שם"]) ?? "",
    coordinator_id: linkedId(r.fields["רכז"]),
    student_id: linkedId(r.fields["בחור"]),
    status: str(r.fields["סטטוס"]) ?? "חדש",
    inquiry_date: str(r.fields["תאריך"]),
    description: str(r.fields["תיאור"]),
    target_date: str(r.fields["תאריך יעד"]),
    close_date: str(r.fields["תאריך סיום"]),
    cancel_reminder: bool(r.fields["ביטול תזכורת"]),
  })));

  console.log("Migrating finances...");
  const financeRecs = await fetchAll(TABLES.FINANCES);
  await upsert("finances", financeRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    name: str(r.fields["שם"]),
    payment_date: str(r.fields["תאריך"]),
    amount: num(r.fields["סכום"]),
    coordinator_id: linkedId(r.fields["רכז"]),
  })));

  console.log("Migrating coordinator instructions...");
  const instrRecs = await fetchAll(TABLES.INSTRUCTIONS);
  await upsert("coordinator_instructions", instrRecs.map((r) => ({
    id: r.id,
    created_at: r.createdTime,
    title: str(r.fields["כותרת"]) ?? "",
    content: str(r.fields["טקסט"]),
    coordinator_id: linkedId(r.fields["רכז"]),
    viewed: bool(r.fields["נצפה"]),
    coordinator_response: str(r.fields["תגובת רכז"]),
    sent_date: str(r.fields["תאריך"]) ?? "",
    office_status: str(r.fields["סטטוס משרד"]),
    bank_notice: bool(r.fields["הודעת בנק"]),
  })));

  console.log("Migrating exam notes...");
  const noteRecs = await fetchAll(TABLES.EXAM_NOTES);
  const validCoordIds = new Set(coordRecs.map((r) => r.id));
  const validNotes = noteRecs.filter((r) => {
    const cid = linkedId(r.fields["משפיע"]);
    const eid = linkedId(r.fields["פרשה"]);
    return cid && eid && validCoordIds.has(cid) && validExamIds.has(eid);
  });
  await upsert("exam_notes", validNotes.map((r) => ({
    id: r.id,
    coordinator_id: linkedId(r.fields["משפיע"]),
    exam_id: linkedId(r.fields["פרשה"]),
    sicha_beinyan: str(r.fields["שיחה בעניין"]),
    maskana: str(r.fields["מסקנה"]),
    hemshech_tipul: str(r.fields["המשך טיפול ומעקב"]),
  })));

  console.log("\nMigration complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
