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

// The metadata API lives outside the base path — it describes the tables
// themselves, which is how a screen can tell a field it may write from one
// Airtable computes.
export type FieldSchema = {
  id: string;
  name: string;
  type: string;
  options?: { choices?: { name: string }[] };
};

export async function fetchTableFields(tableId: string): Promise<FieldSchema[]> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${BASE_ID}/tables`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable meta ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    tables: { id: string; fields: FieldSchema[] }[];
  };
  return data.tables.find((t) => t.id === tableId)?.fields ?? [];
}

// Airtable names the offending column in a 422, which is the only way to learn
// that a field is computed when the metadata API is out of reach.
export function computedFieldFromError(err: unknown): string | null {
  const message = err instanceof Error ? err.message : String(err);
  if (!message.includes("computed") && !message.includes("INVALID_VALUE_FOR_COLUMN")) return null;
  return /Field \\?"(.+?)\\?" cannot accept a value/.exec(message)?.[1] ?? null;
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

// typecast lets Airtable match a single-select by its name (and add the option
// if it is genuinely new) instead of rejecting the whole write — עיר, ישיבה and
// מסלול are all single-selects on בחורים.
export async function patchRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await request(`${tableId}/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify({ fields, typecast: true }),
  })) as AirtableRecord;
}

// Airtable takes at most ten records per write, so a bulk change goes out in
// batches rather than one request per record.
export async function patchRecords(
  tableId: string,
  records: { id: string; fields: Record<string, unknown> }[]
): Promise<void> {
  for (let i = 0; i < records.length; i += 10) {
    await request(tableId, {
      method: "PATCH",
      body: JSON.stringify({ records: records.slice(i, i + 10), typecast: true }),
    });
  }
}

export async function createRecord(
  tableId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await request(tableId, {
    method: "POST",
    body: JSON.stringify({ fields, typecast: true }),
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
  ZMANIM: "tblrLUJBm4PqYt8rg",
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
