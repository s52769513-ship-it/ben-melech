import { NextRequest, NextResponse } from "next/server";
import { getStudentsForNedarim, updateNedarimCharged } from "@/lib/airtable/db";

const MOSAD_ID = "7009191";
const API_PASSWORD = "kd987";
const LIMITED_ID = "352";
const NEDARIM_URL =
  "https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx";

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

export async function POST(req: NextRequest) {
  let studentIds: string[] | undefined;
  let dryRun = false;
  try {
    const body = await req.json();
    studentIds = body.studentIds;
    dryRun = body.dryRun === true;
  } catch {
    // ללא גוף = הטעינה לכולם
  }

  const allStudents = await getStudentsForNedarim();
  const students =
    studentIds && studentIds.length > 0
      ? allStudents.filter((s) => studentIds!.includes(s.id))
      : allStudents;

  const results: {
    id: string;
    name: string;
    amount: number;
    success: boolean;
    dryRun?: boolean;
    reason?: string;
  }[] = [];

  for (const student of students) {
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
      await updateNedarimCharged(student.id, (student.nedarim_charged ?? 0) + toCharge);
    }

    results.push({ id: student.id, name, amount: toCharge, success: ok });
  }

  return NextResponse.json({ results });
}
