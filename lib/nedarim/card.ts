const NEDARIM_URL =
  "https://www.matara.pro/nedarimplus/Mechubad/Reports/ManageReports.aspx";

const MOSAD_ID = process.env.NEDARIM_MOSAD_ID ?? "7009191";
const API_PASSWORD = process.env.NEDARIM_API_PASSWORD ?? "kd987";

export const PROTECTED_ACTIONS = ["AddTlush", "PrikatTlush"] as const;

export const CARD_ACTIONS = [
  "GetClient_Table",
  "GetClientCard",
  "SaveClientCard",
  "SetClientMagneticCard",
  "AddTlush",
  "PrikatTlush",
  "GetStoresList",
  "GetLimitedStoresList",
  "SaveLimitedStores",
] as const;

export type CardAction = (typeof CARD_ACTIONS)[number];

export type CardResponse = {
  Result?: string;
  Message?: string;
  [key: string]: unknown;
};

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
    return { Result: "Error", Message: text || "תגובה לא תקינה מנדרים פלוס" };
  }
}
