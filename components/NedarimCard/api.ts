// קריאה לממשק נדרים קארד מהצד של הדפדפן.
export type CardResult = {
  Result?: string;
  Message?: string;
  [key: string]: unknown;
};

export async function callCard(
  action: string,
  payload: Record<string, string | number | undefined> = {},
  password?: string
): Promise<CardResult> {
  const res = await fetch("/api/nedarim-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload, password }),
  });
  try {
    return (await res.json()) as CardResult;
  } catch {
    return { Result: "Error", Message: "שגיאת תקשורת" };
  }
}

export function isOk(r: CardResult): boolean {
  return r.Result === "OK";
}
