import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  nedarimRequest,
  CARD_ACTIONS,
  PROTECTED_ACTIONS,
  type CardAction,
} from "@/lib/nedarim/card";

// סיסמת אישור לפעולות "בפועל" (הטענה / פריקה).
const CHARGE_PASSWORD = "2447";

export async function POST(req: NextRequest) {
  // ממשק נדרים קארד מוגן — דרושה התחברות.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ Result: "Error", Message: "לא מורשה" }, { status: 401 });
  }

  let body: { action?: string; payload?: Record<string, string | number>; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ Result: "Error", Message: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const { action, payload = {}, password } = body;

  if (!action || !CARD_ACTIONS.includes(action as CardAction)) {
    return NextResponse.json({ Result: "Error", Message: "פעולה לא מוכרת" }, { status: 400 });
  }

  // פעולות "בפועל" — דורשות סיסמת 2447.
  if (PROTECTED_ACTIONS.includes(action as (typeof PROTECTED_ACTIONS)[number]) && password !== CHARGE_PASSWORD) {
    return NextResponse.json(
      { Result: "Error", Message: "סיסמת אישור שגויה לביצוע הפעולה" },
      { status: 403 }
    );
  }

  try {
    const data = await nedarimRequest(action as CardAction, payload);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { Result: "Error", Message: "שגיאת תקשורת מול נדרים פלוס" },
      { status: 502 }
    );
  }
}
