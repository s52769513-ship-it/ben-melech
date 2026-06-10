const BASE_ID = "appFwuERdEigGl4Ko";

export type AirtableRecord = {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
};

function getToken(): string {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new Error("AIRTABLE_TOKEN לא מוגדר בסביבה");
  return token;
}

async function request(path: string, options?: RequestInit): Promise<unknown> {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchAll(
  tableId: string,
  params?: Record<string, string>
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const sp = new URLSearchParams({ pageSize: "100", ...params });
    if (offset) sp.set("offset", offset);
    const data = (await request(`${tableId}?${sp}`)) as {
      records: AirtableRecord[];
      offset?: string;
    };
    records.push(...data.records);
    offset = data.offset;
  } while (offset);
  return records;
}

export async function fetchOne(
  tableId: string,
  recordId: string
): Promise<AirtableRecord | null> {
  try {
    return (await request(`${tableId}/${recordId}`)) as AirtableRecord;
  } catch {
    return null;
  }
}

export async function patchRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await request(`${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  })) as AirtableRecord;
}

export async function createRecord(
  tableId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await request(tableId, {
    method: "POST",
    body: JSON.stringify({ fields }),
  })) as AirtableRecord;
}

export const TABLES = {
  COORDINATORS: "tbl9qvdwAmwA8TIhr",
  STUDENTS: "tblWmWBpyEEcxVWIU",
  FINANCES: "tblyu8tJ4melhX6cD",
  INQUIRIES: "tbl2h0uddAfcW524w",
  EXAMS: "tbl2pigfbScOzjse3",
  SCORES: "tblP8DKZzh3yOtxOi",
  INSTRUCTIONS: "tblDIiuNxgFqMTXQ0",
  GROUPS: "tblHoD5ExTHeeR7EM",
  EXAM_NOTES: "tbl2w1Xbzpi2FXEtR",
} as const;

export function linkedId(field: unknown): string | null {
  const arr = field as string[] | undefined;
  return arr?.[0] ?? null;
}

export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v) || null;
}

export function bool(v: unknown): boolean {
  return v === true;
}
