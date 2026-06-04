import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BASE_ID = "appFwuERdEigGl4Ko";
const STUDENTS_TABLE = "tblWmWBpyEEcxVWIU";

type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
};

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

async function fetchAllRecords(token: string, tableId: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${tableId}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);

    const data = await res.json() as { records: AirtableRecord[]; offset?: string };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "חסר טוקן Airtable" }, { status: 400 });

  try {
    const [records, supabase] = await Promise.all([
      fetchAllRecords(token, STUDENTS_TABLE),
      createClient(),
    ]);

    const rows = records.map(mapToSupabase);

    const { error } = await supabase
      .from("students")
      .upsert(rows, { onConflict: "airtable_id", ignoreDuplicates: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ synced: rows.length, total: records.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
