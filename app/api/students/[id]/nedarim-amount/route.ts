import { NextResponse } from "next/server";

// שדה "כסף להטענה" בבחורים הוא נוסחה מחושבת אוטומטית באיירטייבל לפי הנקודות.
// לא ניתן לעדכן אותו ידנית — הוא מתעדכן אוטומטית.
export async function PATCH() {
  return NextResponse.json(
    { error: "שדה זה מחושב אוטומטית באיירטייבל ולא ניתן לעדכונו ידנית" },
    { status: 405 }
  );
}
