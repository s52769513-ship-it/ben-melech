import { NextResponse } from "next/server";

// הסנכרון הישן (Airtable → Supabase) הוסר.
// האפליקציה קוראת ישירות מ-Airtable — אין צורך בסנכרון.
export async function POST() {
  return NextResponse.json({ message: "הסנכרון הוסר — האפליקציה מחוברת ישירות לאיירטייבל" });
}
