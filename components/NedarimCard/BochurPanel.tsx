"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  RefreshCw,
  CreditCard,
  History as HistoryIcon,
  Ban,
  Repeat,
  User,
  Save,
} from "lucide-react";
import { callCard, isOk, type CardResult } from "./api";

type Tlush = {
  TlushId?: string;
  KupaName?: string;
  Date?: string;
  LimitedStores?: string;
  Amount?: string;
  FreeAmount?: string;
  Expiration?: string;
  Comments?: string;
};

type HistoryRow = {
  HistoryId?: string;
  StoreName?: string;
  Date?: string;
  Amount?: string;
  Comments?: string;
};

type MagneticCard = {
  CardId?: string;
  CardNumber?: string;
  MagneticCard?: string;
  AddedDate?: string;
  RemovedDate?: string;
};

type Siruv = {
  StoreName?: string;
  Date?: string;
  Amount?: string;
  Error?: string;
};

type AutoChargeRow = {
  ID?: string;
  Status?: string;
  Amount?: string;
  NextCharge?: string;
  HebNextCharge?: string;
  Comments?: string;
};

type LimitedGroup = { ID?: string; ListName?: string };

type CardData = CardResult & {
  FirstName?: string;
  FamilyName?: string;
  Zeout?: string;
  Address?: string;
  Phone1?: string;
  Phone2?: string;
  Email?: string;
  Groupe?: string;
  Comments?: string;
  TotalFreeAmount?: string;
  History?: HistoryRow[];
  Tlushim?: Tlush[];
  Cards?: MagneticCard[];
  Siruvim?: Siruv[];
  AutoCharge?: AutoChargeRow[];
};

const TABS = [
  { key: "tlushim", label: "טעינות", icon: CreditCard },
  { key: "history", label: "היסטוריה", icon: HistoryIcon },
  { key: "cards", label: "כרטיסים מגנטיים", icon: CreditCard },
  { key: "siruvim", label: "סירובים", icon: Ban },
  { key: "auto", label: "טעינות מחזוריות", icon: Repeat },
  { key: "details", label: "פרטי הבחור", icon: User },
];

export default function BochurPanel({
  clientId,
  name,
  onBalanceChange,
}: {
  clientId: string | number;
  name?: string;
  onBalanceChange?: (balance: number) => void;
}) {
  const [data, setData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("tlushim");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [groups, setGroups] = useState<LimitedGroup[]>([]);

  // סיסמת אישור לפעולות בפועל (הטענה / פריקה).
  const [password, setPassword] = useState("");

  // טופס הוספת טעינה.
  const [amount, setAmount] = useState("");
  const [expiration, setExpiration] = useState("");
  const [limitedId, setLimitedId] = useState("");
  const [chargeComments, setChargeComments] = useState("");

  // טופס כרטיס מגנטי.
  const [newMagnetic, setNewMagnetic] = useState("");

  // שמירת ה-callback ב-ref כדי שלא יגרום לטעינה מחדש בכל רינדור.
  const onBalanceChangeRef = useRef(onBalanceChange);
  onBalanceChangeRef.current = onBalanceChange;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await callCard("GetClientCard", { ClientId: clientId });
    if (isOk(res)) {
      const d = res as CardData;
      setData(d);
      const bal = parseFloat(d.TotalFreeAmount ?? "0");
      if (!Number.isNaN(bal)) onBalanceChangeRef.current?.(bal);
    } else {
      setError(res.Message || "שגיאה בטעינת נתוני הבחור");
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
    callCard("GetLimitedStoresList").then((res) => {
      if (isOk(res) && Array.isArray((res as { data?: LimitedGroup[] }).data)) {
        setGroups((res as { data: LimitedGroup[] }).data);
      } else if (Array.isArray(res.data as LimitedGroup[])) {
        setGroups(res.data as LimitedGroup[]);
      }
    });
  }, [load]);

  function flash(ok: boolean, text: string) {
    setNotice({ ok, text });
    setTimeout(() => setNotice(null), 4000);
  }

  async function addTlush() {
    if (!amount || parseFloat(amount) <= 0) {
      flash(false, "יש להזין סכום תקין");
      return;
    }
    if (!password) {
      flash(false, "יש להזין סיסמת אישור להטענה");
      return;
    }
    setBusy("add");
    const res = await callCard(
      "AddTlush",
      {
        ClientId: clientId,
        Amount: amount,
        Expiration: expiration || undefined,
        LimitedId: limitedId || undefined,
        Comments: chargeComments || undefined,
      },
      password
    );
    setBusy(null);
    if (isOk(res)) {
      flash(true, `הטעינה בוצעה בהצלחה (₪${amount})`);
      setAmount("");
      setExpiration("");
      setChargeComments("");
      await load();
    } else {
      flash(false, res.Message || "ההטענה נכשלה");
    }
  }

  async function unloadTlush(tlushId?: string) {
    if (!tlushId) return;
    if (!password) {
      flash(false, "יש להזין סיסמת אישור לפריקה");
      return;
    }
    if (!confirm(`לפרוק את הטעינה ${tlushId}?`)) return;
    setBusy(`unload-${tlushId}`);
    const res = await callCard("PrikatTlush", { TlushId: tlushId }, password);
    setBusy(null);
    if (isOk(res)) {
      flash(true, "הטעינה נפרקה בהצלחה");
      await load();
    } else {
      flash(false, res.Message || "הפריקה נכשלה");
    }
  }

  async function addMagnetic() {
    if (!newMagnetic) {
      flash(false, "יש להזין מספר כרטיס מגנטי");
      return;
    }
    setBusy("magnetic-add");
    const res = await callCard("SetClientMagneticCard", {
      ClientId: clientId,
      MagneticCard: newMagnetic,
    });
    setBusy(null);
    if (isOk(res)) {
      flash(true, "הכרטיס שויך בהצלחה");
      setNewMagnetic("");
      await load();
    } else {
      flash(false, res.Message || "שיוך הכרטיס נכשל");
    }
  }

  async function removeMagnetic(card: MagneticCard) {
    if (!confirm("למחוק את הכרטיס המגנטי?")) return;
    setBusy(`magnetic-del-${card.CardId}`);
    const res = await callCard("SetClientMagneticCard", {
      ClientId: clientId,
      CardId: card.CardId,
      MagneticCard: card.MagneticCard,
      Remove: 1,
    });
    setBusy(null);
    if (isOk(res)) {
      flash(true, "הכרטיס נותק בהצלחה");
      await load();
    } else {
      flash(false, res.Message || "מחיקת הכרטיס נכשלה");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
        <Loader2 size={18} className="animate-spin" />
        טוען נתוני בחור...
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={13} /> נסה שוב
        </button>
      </div>
    );
  }

  const balance = data?.TotalFreeAmount ?? "0";
  const displayName = name || `${data?.FirstName ?? ""} ${data?.FamilyName ?? ""}`.trim();

  return (
    <div className="space-y-4">
      {/* כותרת ויתרה */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-800">{displayName || `בחור #${clientId}`}</h3>
          <p className="text-xs text-gray-400">מזהה נדרים: {clientId}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-gray-400">יתרה בכרטיס</p>
            <p className="text-lg font-bold text-green-600">₪{Number(balance).toLocaleString()}</p>
          </div>
          <button
            onClick={load}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            title="רענן"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`text-sm rounded-lg px-3 py-2 ${
            notice.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* טאבים */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === key
                ? "border-[#1e3a5f] text-[#1e3a5f] font-medium"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* טאב טעינות */}
      {tab === "tlushim" && (
        <div className="space-y-4">
          {/* טופס הוספת טעינה */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
              <Plus size={15} /> הטענה חדשה (דורש סיסמת אישור)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input
                type="number"
                placeholder="סכום ₪"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <input
                type="text"
                placeholder="תפוגה dd/mm/yyyy"
                value={expiration}
                onChange={(e) => setExpiration(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <select
                value={limitedId}
                onChange={(e) => setLimitedId(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="">ללא הגבלת חנויות</option>
                {groups.map((g) => (
                  <option key={g.ID} value={g.ID}>
                    {g.ListName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="הערה"
                value={chargeComments}
                onChange={(e) => setChargeComments(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="סיסמת אישור"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-amber-300 rounded px-2 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={addTlush}
                disabled={busy === "add"}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50"
              >
                {busy === "add" ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                הטען
              </button>
            </div>
          </div>

          {/* רשימת טעינות */}
          <Table
            head={["מזהה", "תאריך", "סכום", "נשאר", "תפוגה", "הגבלה", ""]}
            rows={(data?.Tlushim ?? []).map((t) => [
              t.TlushId ?? "—",
              t.Date ?? "—",
              t.Amount ? `₪${t.Amount}` : "—",
              t.FreeAmount ?? "—",
              t.Expiration ?? "—",
              t.LimitedStores ?? "—",
              <button
                key="x"
                onClick={() => unloadTlush(t.TlushId)}
                disabled={busy === `unload-${t.TlushId}`}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {busy === `unload-${t.TlushId}` ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                פריקה
              </button>,
            ])}
            empty="אין טעינות"
          />
        </div>
      )}

      {/* טאב היסטוריה */}
      {tab === "history" && (
        <Table
          head={["תאריך", "חנות", "סכום", "הערה"]}
          rows={(data?.History ?? []).map((h) => [
            h.Date ?? "—",
            h.StoreName ?? "—",
            h.Amount ? `₪${h.Amount}` : "—",
            h.Comments ?? "—",
          ])}
          empty="אין היסטוריית עסקאות"
        />
      )}

      {/* טאב כרטיסים מגנטיים */}
      {tab === "cards" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="מספר כרטיס / פס מגנטי"
              value={newMagnetic}
              onChange={(e) => setNewMagnetic(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm flex-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={addMagnetic}
              disabled={busy === "magnetic-add"}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50"
            >
              {busy === "magnetic-add" ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              שייך כרטיס
            </button>
          </div>
          <Table
            head={["מספר", "מגנטי", "שויך", "נותק", ""]}
            rows={(data?.Cards ?? []).map((c) => [
              c.CardNumber ?? "—",
              c.MagneticCard ?? "—",
              c.AddedDate ?? "—",
              c.RemovedDate || "—",
              c.RemovedDate ? (
                <span key="x" className="text-xs text-gray-400">
                  מנותק
                </span>
              ) : (
                <button
                  key="x"
                  onClick={() => removeMagnetic(c)}
                  disabled={busy === `magnetic-del-${c.CardId}`}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {busy === `magnetic-del-${c.CardId}` ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  נתק
                </button>
              ),
            ])}
            empty="אין כרטיסים מגנטיים"
          />
        </div>
      )}

      {/* טאב סירובים */}
      {tab === "siruvim" && (
        <Table
          head={["תאריך", "חנות", "סכום", "סיבה"]}
          rows={(data?.Siruvim ?? []).map((s) => [
            s.Date ?? "—",
            s.StoreName ?? "—",
            s.Amount ? `₪${s.Amount}` : "—",
            s.Error ?? "—",
          ])}
          empty="אין סירובים"
        />
      )}

      {/* טאב טעינות מחזוריות */}
      {tab === "auto" && (
        <Table
          head={["מזהה", "סטטוס", "סכום", "טעינה הבאה", "תאריך עברי", "הערה"]}
          rows={(data?.AutoCharge ?? []).map((a) => [
            a.ID ?? "—",
            a.Status === "1" ? "פעיל" : a.Status === "2" ? "מוקפא" : a.Status ?? "—",
            a.Amount ? `₪${a.Amount}` : "—",
            a.NextCharge ?? "—",
            a.HebNextCharge ?? "—",
            a.Comments ?? "—",
          ])}
          empty="אין טעינות מחזוריות"
        />
      )}

      {/* טאב פרטים */}
      {tab === "details" && <DetailsForm clientId={clientId} data={data} onSaved={load} flash={flash} />}
    </div>
  );
}

// ─── טבלה גנרית ──────────────────────────────────────────────────────────────
function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="text-right px-3 py-2 font-medium text-gray-500 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── טופס עריכת פרטי בחור ────────────────────────────────────────────────────
function DetailsForm({
  clientId,
  data,
  onSaved,
  flash,
}: {
  clientId: string | number;
  data: CardData | null;
  onSaved: () => void;
  flash: (ok: boolean, text: string) => void;
}) {
  const [form, setForm] = useState({
    FirstName: data?.FirstName ?? "",
    FamilyName: data?.FamilyName ?? "",
    Zeout: data?.Zeout ?? "",
    Address: data?.Address ?? "",
    Phone1: data?.Phone1 ?? "",
    Phone2: data?.Phone2 ?? "",
    Email: data?.Email ?? "",
    Groupe: data?.Groupe ?? "",
    Comments: data?.Comments ?? "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    setSaving(true);
    const res = await callCard("SaveClientCard", { ClientId: clientId, ...form });
    setSaving(false);
    if (isOk(res)) {
      flash(true, "פרטי הבחור נשמרו");
      onSaved();
    } else {
      flash(false, res.Message || "שמירת הפרטים נכשלה");
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "FamilyName", label: "שם הבחור (משפחה)" },
    { key: "FirstName", label: "שם פרטי" },
    { key: "Zeout", label: "תעודת זהות" },
    { key: "Phone1", label: "טלפון 1" },
    { key: "Phone2", label: "טלפון 2" },
    { key: "Email", label: "מייל" },
    { key: "Address", label: "כתובת" },
    { key: "Groupe", label: "קטגוריה" },
    { key: "Comments", label: "הערה" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map((f) => (
          <label key={f.key} className="text-sm">
            <span className="text-gray-500 text-xs">{f.label}</span>
            <input
              type="text"
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="mt-0.5 w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </label>
        ))}
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        שמור פרטים
      </button>
    </div>
  );
}
