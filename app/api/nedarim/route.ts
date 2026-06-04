import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MOSAD_ID = "7009191";
const API_PASSWORD = "kd987";
const LIMITED_ID = "352";
const NEDARIM_URL = "https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx";

async function chargeStudent(nedarimId: number, amount: number): Promise<boolean> {
  const params = new URLSearchParams({
    Action: "AddTlush",
    MosadId: MOSAD_ID,
    ApiPassword: API_PASSWORD,
    ClientId: String(nedarimId),
    Amount: String(amount),
    LimitedId: LIMITED_ID,
  });

  const res = await fetch(`${NEDARIM_URL}?${params}`, { cache: "no-store" });
  const text = await res.text();
  return text.includes("Result") && text.includes("OK");
}

// POST /api/nedarim
// body: { studentIds?: string[], dryRun?: boolean }
export async function POST(req: NextRequest) {
  const supabase = await createClient();

  let studentIds: string[] | undefined;
  let dryRun = false;
  try {
    const body = await req.json();
    studentIds = body.studentIds;
    dryRun = body.dryRun === true;
  } catch {
    // no body = charge all
  }

  let query = supabase
    .from("students")
    .select("id, first_name, last_name, nedarim_id, nedarim_amount, nedarim_charged");

  if (studentIds && studentIds.length > 0) {
    query = query.in("id", studentIds);
  }

  const { data: students, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { id: string; name: string; amount: number; success: boolean; dryRun?: boolean; reason?: string }[] = [];

  for (const student of students ?? []) {
    const name = `${student.last_name} ${student.first_name}`;

    if (!student.nedarim_id) {
      results.push({ id: student.id, name, amount: 0, success: false, reason: "אין מזהה נדרים" });
      continue;
    }

    const toCharge = (student.nedarim_amount ?? 0) - (student.nedarim_charged ?? 0);

    if (toCharge <= 0) {
      results.push({ id: student.id, name, amount: 0, success: false, reason: "אין סכום להטעין" });
      continue;
    }

    if (dryRun) {
      results.push({ id: student.id, name, amount: toCharge, success: true, dryRun: true });
      continue;
    }

    let ok = false;
    try {
      ok = await chargeStudent(student.nedarim_id, toCharge);
    } catch {
      ok = false;
    }

    if (ok) {
      await supabase
        .from("students")
        .update({ nedarim_charged: (student.nedarim_charged ?? 0) + toCharge })
        .eq("id", student.id);
    }

    results.push({ id: student.id, name, amount: toCharge, success: ok });
  }

  return NextResponse.json({ results });
}
