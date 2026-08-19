import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStudentStats } from "@/lib/airtable/db";

// Attendance rate and average grade per bochur. It is the one read that has to
// walk every score in the base, so no screen blocks on it — the tables that
// show these two numbers ask for them here once they are already on screen.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getStudentStats());
  } catch {
    return NextResponse.json({ error: "שגיאה בטעינת הנתונים" }, { status: 502 });
  }
}
