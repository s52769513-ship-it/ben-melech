"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UserPlus,
  Store,
  Users,
} from "lucide-react";
import { callCard, isOk } from "@/components/NedarimCard/api";
import BochurPanel from "@/components/NedarimCard/BochurPanel";
import StoreGroups from "@/components/NedarimCard/StoreGroups";

type Bochur = {
  ClientId?: string;
  Zeout?: string;
  FamilyName?: string;
  FirstName?: string;
  Address?: string;
  Phone?: string;
  Groupe?: string;
  Ytra?: string;
  Tsad3Id?: string;
};

export default function NedarimCardClient() {
  const [view, setView] = useState<"bochurim" | "stores">("bochurim");
  const [list, setList] = useState<Bochur[]>([]);
  const [total, setTotal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await callCard("GetClient_Table");
    if (isOk(res)) {
      setList((res.data as Bochur[]) ?? []);
      setTotal((res.Total as string) ?? null);
    } else {
      setError(res.Message || "שגיאה בטעינת רשימת הבחורים");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = list.filter((b) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      `${b.FirstName ?? ""} ${b.FamilyName ?? ""}`.toLowerCase().includes(q) ||
      (b.Phone ?? "").includes(q) ||
      (b.Zeout ?? "").includes(q) ||
      (b.ClientId ?? "").includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* מתגי תצוגה */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("bochurim")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
            view === "bochurim" ? "bg-[#1e3a5f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Users size={15} /> בחורים
        </button>
        <button
          onClick={() => setView("stores")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors ${
            view === "stores" ? "bg-[#1e3a5f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Store size={15} /> קבוצות חנויות
        </button>
      </div>

      {view === "stores" ? (
        <StoreGroups />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* כותרת + חיפוש */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-700">רשימת בחורים</h2>
              {total != null && (
                <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                  סה״כ טעון בכרטיסים: ₪{Number(total).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute right-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש בחור..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-gray-300 rounded-lg pr-8 pl-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <button
                onClick={load}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                title="רענן"
              >
                <RefreshCw size={15} />
              </button>
              <button
                onClick={() => setAdding((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f]"
              >
                <UserPlus size={14} /> בחור חדש
              </button>
            </div>
          </div>

          {adding && <AddBochur onDone={() => { setAdding(false); load(); }} />}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
              <Loader2 size={18} className="animate-spin" /> טוען...
            </div>
          ) : error ? (
            <div className="py-10 text-center">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <button onClick={load} className="text-sm text-blue-600 hover:underline">
                נסה שוב
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              <div className="grid grid-cols-[1fr_140px_120px_40px] gap-2 px-6 py-2 bg-gray-50 text-xs text-gray-400 font-medium">
                <span>בחור</span>
                <span>קטגוריה</span>
                <span className="text-center">יתרה</span>
                <span />
              </div>
              {filtered.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">לא נמצאו בחורים</p>
              ) : (
                filtered.map((b) => {
                  const isOpen = expanded === b.ClientId;
                  return (
                    <div key={b.ClientId}>
                      <button
                        onClick={() => setExpanded(isOpen ? null : b.ClientId ?? null)}
                        className="w-full grid grid-cols-[1fr_140px_120px_40px] gap-2 items-center px-6 py-3 text-right hover:bg-gray-50"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {b.FirstName} {b.FamilyName}
                          </span>
                          <span className="text-xs text-gray-400 mr-2">#{b.ClientId}</span>
                        </div>
                        <span className="text-xs text-gray-500">{b.Groupe || "—"}</span>
                        <span className="text-sm text-center font-medium text-green-600">
                          ₪{Number(b.Ytra ?? 0).toLocaleString()}
                        </span>
                        <span className="flex justify-center text-gray-400">
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                      </button>
                      {isOpen && b.ClientId && (
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                          <BochurPanel
                            clientId={b.ClientId}
                            name={`${b.FirstName ?? ""} ${b.FamilyName ?? ""}`.trim()}
                            onBalanceChange={(bal) =>
                              setList((prev) =>
                                prev.map((x) =>
                                  x.ClientId === b.ClientId ? { ...x, Ytra: String(bal) } : x
                                )
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── הוספת בחור חדש ──────────────────────────────────────────────────────────
function AddBochur({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    FamilyName: "",
    FirstName: "",
    Zeout: "",
    Phone1: "",
    Address: "",
    Groupe: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    if (!form.FamilyName.trim()) {
      setErr("יש להזין שם בחור");
      return;
    }
    setSaving(true);
    setErr(null);
    const res = await callCard("SaveClientCard", form);
    setSaving(false);
    if (isOk(res)) {
      onDone();
    } else {
      setErr(res.Message || "ההוספה נכשלה");
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "FamilyName", label: "שם הבחור (משפחה)" },
    { key: "FirstName", label: "שם פרטי" },
    { key: "Zeout", label: "תעודת זהות" },
    { key: "Phone1", label: "טלפון" },
    { key: "Address", label: "כתובת" },
    { key: "Groupe", label: "קטגוריה" },
  ];

  return (
    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 space-y-3">
      <p className="text-sm font-medium text-[#1e3a5f]">הוספת בחור חדש</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
      {err && <p className="text-red-500 text-sm">{err}</p>}
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
          הוסף
        </button>
        <button onClick={onDone} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
          ביטול
        </button>
      </div>
    </div>
  );
}
