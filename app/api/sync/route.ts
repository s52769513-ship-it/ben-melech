import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE_ID = process.env.AIRTABLE_BASE_ID!;
const TABLE_ID = process.env.AIRTABLE_STUDENTS_TABLE!;
const TOKEN = process.env.AIRTABLE_TOKEN!;

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

// Formula/computed fields in Airtable — do NOT sync these directly
const FORMULA_FIELDS = new Set([
  "שם בחור", "גיל", "נשאר להטעין", "נקודות זמן קיץ תשפו (מעל 500)",
  "סך מבחנים", "סך סדרים", "סך פניות", "סך שקיבל",
  "תאריך סדר אחרון", "תאריך עברי מסדר אחרון", "תאריך מבחן אחרון",
  "פניות פתוחות", "ממוצע ציונים", "Average Lesson Attendance Rate (%)",
  "מייל של הרכז", "טלפון של הרכז", "סיכום AI", "עדיפות לטיפול",
  "סכום לתשלום שעדיין לא שולם", "סכום לתשלום ששולם",
  "תאריך אחרון מבחן", "מספר ימים מתאריך ממבחן",
  "תאריך אחרון נוכחות", "מספר ימים מסדר אחרון",
  "Calculation", "Calculation 2", "מספר סידורי",
  "ID (from קבוצה/ישיבה)", "שם רכז (from רכז)", "מייל (from רכז)",
  "טלפון רכז", "ID רכז", "עיר (from רכז)",
]);

function mapToSupabase(rec: AirtableRecord) {
  const f = rec.fields;
  return {
    airtable_id: rec.id,
    first_name: (f["שם"] as string) ?? null,
    last_name: (f["משפחה"] as string) ?? null,
    city: (f["עיר"] as string) ?? null,
    street: (f["רחוב"] as string) ?? null,
    birth_date: (f["תאריך לידה"] as string) ?? null,
    id_number: (f["מספר מזהה"] as number) ?? null,
    phone: (f["Phone Number"] as string) ?? null,
    father_name: (f["שם האב"] as string) ?? null,
    yeshiva: (f["ישיבה"] as string) ?? null,
    track: (f["מסלול"] as string) ?? null,
    nedarim_id: (f["מזהה נדרים"] as number) ?? null,
    nedarim_amount: parseFloat(String(f["כסף להטענה"] ?? "0")) || 0,
    nedarim_charged: (f["הוטען"] as number) ?? 0,
  };
}

async function fetchAllRecords(): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${TOKEN}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable error: ${res.status} ${body} | URL: ${url.toString().replace(TOKEN, "***")}`);
    }

    const data = await res.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function POST() {
  try {
    const [records, supabase] = await Promise.all([
      fetchAllRecords(),
      createClient(),
    ]);

    const rows = records.map(mapToSupabase);

    // Upsert by airtable_id
    const { error } = await supabase
      .from("students")
      .upsert(rows, { onConflict: "airtable_id", ignoreDuplicates: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      synced: rows.length,
      total: records.length,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
