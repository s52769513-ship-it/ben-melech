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

export function asList<T>(res: CardResult | T[]): T[] | null {
  if (Array.isArray(res)) return res as T[];
  const data = (res as CardResult).data;
  if (Array.isArray(data)) return data as T[];
  return null;
}

export function parseAmount(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return 0;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}
