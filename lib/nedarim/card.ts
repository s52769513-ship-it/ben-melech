// ─── Nedarim Card (נדרים קארד) API helper ────────────────────────────────────
// כל הפעולות מול נדרים פלוס עוברות דרך נקודת קצה אחת.
// פרטי המוסד נשמרים בצד השרת בלבד ולעולם לא מגיעים מהדפדפן.

const NEDARIM_URL =
  "https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx";

const MOSAD_ID = process.env.NEDARIM_MOSAD_ID ?? "7009191";
const API_PASSWORD = process.env.NEDARIM_API_PASSWORD ?? "kd987";

// פעולות "בפועל" (הטענה / פריקה של כסף) — דורשות סיסמת אישור 2447.
export const PROTECTED_ACTIONS = ["AddTlush", "PrikatTlush"] as const;

// כל הפעולות הנתמכות בממשק נדרים קארד.
export const CARD_ACTIONS = [
  "GetClient_Table", // רשימת בחורים
  "GetClientCard", // נתוני בחור לפי מזהה
  "SaveClientCard", // הוספה / עריכה / מחיקה של בחור
  "SetClientMagneticCard", // שיוך / מחיקת כרטיס מגנטי
  "AddTlush", // הוספת טעינה
  "PrikatTlush", // פריקת טעינה
  "GetStoresList", // רשימת חנויות
  "GetLimitedStoresList", // קבוצות חנויות
  "SaveLimitedStores", // הוספה / עריכה / מחיקה של קבוצת חנויות
] as const;

export type CardAction = (typeof CARD_ACTIONS)[number];

export type CardResponse = {
  Result?: string;
  Message?: string;
  [key: string]: unknown;
};

// שולח פעולה לנדרים פלוס ומחזיר את התגובה כ-JSON.
// MosadId ו-ApiPassword מוזרקים כאן בלבד.
export async function nedarimRequest(
  action: CardAction,
  payload: Record<string, string | number | undefined> = {}
): Promise<CardResponse> {
  const params = new URLSearchParams({
    Action: action,
    MosadId: MOSAD_ID,
    ApiPassword: API_PASSWORD,
  });

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const res = await fetch(`${NEDARIM_URL}?${params}`, { cache: "no-store" });
  const text = await res.text();

  try {
    return JSON.parse(text) as CardResponse;
  } catch {
    // לעיתים נדרים מחזיר טקסט שאינו JSON תקין — נחזיר אותו כהודעה.
    return { Result: "Error", Message: text || "תגובה לא תקינה מנדרים פלוס" };
  }
}
