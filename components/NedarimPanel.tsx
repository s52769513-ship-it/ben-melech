"use client";

import { useState, useRef } from "react";
import { CreditCard, Loader2, CheckCircle, XCircle, Zap, FlaskConical, Save, Lock } from "lucide-react";

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
  nedarim_id: number | null;
  nedarim_amount: number | null;
  nedarim_charged: number | null;
};

type ChargeResult = {
  id: string;
  name: string;
  amount: number;
  success: boolean;
  dryRun?: boolean;
  reason?: string;
};

export default function NedarimPanel({ students }: { students: StudentRow[] }) {
  const [loading, setLoading] = useState<"all" | "dry" | string | null>(null);
  const [results, setResults] = useState<ChargeResult[] | null>(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [localCharged, setLocalCharged] = useState<Record<string, number>>({});
  const [editingAmount, setEditingAmount] = useState<Record<string, string>>({});
  const [savingAmount, setSavingAmount] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ pendingIds?: string[]; dryRun: boolean } | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  const studentsWithNedarim = students.filter((s) => s.nedarim_id);

  function getCharged(s: StudentRow) {
    return localCharged[s.id] ?? s.nedarim_charged ?? 0;
  }

  function getAmount(s: StudentRow) {
    return s.nedarim_amount ?? 0;
  }

  function getRemaining(s: StudentRow) {
    return getAmount(s) - getCharged(s);
  }

  const eligible = studentsWithNedarim.filter((s) => getRemaining(s) > 0);
  const totalToCharge = eligible.reduce((sum, s) => sum + getRemaining(s), 0);

  async function saveAmount(studentId: string, value: string) {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    setSavingAmount(studentId);
    try {
      await fetch(`/api/students/${studentId}/nedarim-amount`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nedarim_amount: amount }),
      });
      setEditingAmount((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      // update local UI (optimistic)
      const s = students.find((st) => st.id === studentId);
      if (s) s.nedarim_amount = amount;
    } finally {
      setSavingAmount(null);
    }
  }

  function requestCharge(studentIds?: string[], dryRun = false) {
    setPasswordInput("");
    setPasswordError(false);
    setPasswordModal({ pendingIds: studentIds, dryRun });
    setTimeout(() => passwordRef.current?.focus(), 50);
  }

  function confirmPassword() {
    if (passwordInput === "2447") {
      const { pendingIds, dryRun } = passwordModal!;
      setPasswordModal(null);
      doCharge(pendingIds, dryRun);
    } else {
      setPasswordError(true);
      setPasswordInput("");
      passwordRef.current?.focus();
    }
  }

  async function doCharge(studentIds?: string[], dryRun = false) {
    const key = dryRun ? "dry" : studentIds?.length === 1 ? studentIds[0] : "all";
    setLoading(key);
    setIsDryRun(dryRun);
    setResults(null);

    try {
      const res = await fetch("/api/nedarim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds, dryRun }),
      });
      const data = await res.json();
      setResults(data.results ?? []);

      if (!dryRun) {
        const updates: Record<string, number> = {};
        for (const r of (data.results ?? []) as ChargeResult[]) {
          if (r.success) {
            const s = students.find((st) => st.id === r.id);
            if (s) updates[r.id] = (s.nedarim_charged ?? 0) + r.amount;
          }
        }
        setLocalCharged((prev) => ({ ...prev, ...updates }));
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-700">הטענת כרטיסי נדרים פלוס</h2>
          {eligible.length > 0 && (
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              {eligible.length} ממתינים • ₪{totalToCharge.toLocaleString()} סה״כ
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => requestCharge(undefined, true)}
            disabled={loading !== null || eligible.length === 0}
            className="flex flex-col items-center gap-0 px-4 py-1.5 border border-purple-400 text-purple-700 text-sm rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2">
              {loading === "dry" ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
              ניסוי בלבד
            </span>
            <span className="text-[10px] text-purple-400 leading-tight">דרישת אימות</span>
          </button>
          <button
            onClick={() => requestCharge(undefined, false)}
            disabled={loading !== null || eligible.length === 0}
            className="flex flex-col items-center gap-0 px-4 py-1.5 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2">
              {loading === "all" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
              הטען הכל ({eligible.length})
            </span>
            <span className="text-[10px] text-blue-300 leading-tight">דרישת אימות</span>
          </button>
        </div>
      </div>

      {results && (
        <div className={`px-6 py-3 border-b ${isDryRun ? "bg-purple-50 border-purple-100" : "bg-blue-50 border-blue-100"}`}>
          <p className={`text-sm font-medium ${isDryRun ? "text-purple-800" : "text-blue-800"}`}>
            {isDryRun ? "🔬 ניסוי בלבד — לא בוצעה הטענה אמיתית | " : ""}
            {results.filter((r) => r.success).length} יוטענו בהצלחה,{" "}
            {results.filter((r) => !r.success).length} לא יוטענו
            {!isDryRun && ` • סה״כ ₪${results.filter((r) => r.success).reduce((s, r) => s + r.amount, 0).toLocaleString()}`}
          </p>
        </div>
      )}

      {studentsWithNedarim.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          אין בחורים עם מזהה נדרים — הוסף מזהה נדרים בעריכת בחור
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_120px_120px_120px_140px] gap-2 px-6 py-2 bg-gray-50 text-xs text-gray-400 font-medium">
            <span>בחור</span>
            <span className="text-center">כסף להטענה</span>
            <span className="text-center">הוטען</span>
            <span className="text-center">נשאר</span>
            <span />
          </div>

          {studentsWithNedarim
            .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "he"))
            .map((s) => {
              const remaining = getRemaining(s);
              const charged = getCharged(s);
              const total = getAmount(s);
              const result = results?.find((r) => r.id === s.id);
              const editVal = editingAmount[s.id];
              const isEditingThis = editVal !== undefined;

              return (
                <div key={s.id} className="grid grid-cols-[1fr_120px_120px_120px_140px] gap-2 items-center px-6 py-2.5">
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {s.last_name} {s.first_name}
                    </span>
                    <span className="text-xs text-gray-400 mr-2">#{s.nedarim_id}</span>
                    {result && (
                      result.success
                        ? <CheckCircle size={13} className={`inline mr-1 ${result.dryRun ? "text-purple-500" : "text-green-500"}`} />
                        : <span className="inline-flex items-center gap-1 mr-1">
                            <XCircle size={13} className="text-red-400" />
                            {result.reason && <span className="text-xs text-red-400">{result.reason}</span>}
                          </span>
                    )}
                  </div>

                  {/* Editable amount */}
                  <div className="flex items-center justify-center gap-1">
                    {isEditingThis ? (
                      <>
                        <input
                          type="number"
                          value={editVal}
                          onChange={(e) => setEditingAmount((prev) => ({ ...prev, [s.id]: e.target.value }))}
                          className="w-16 text-xs border border-blue-300 rounded px-1.5 py-1 text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveAmount(s.id, editVal);
                            if (e.key === "Escape") setEditingAmount((prev) => { const n = {...prev}; delete n[s.id]; return n; });
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveAmount(s.id, editVal)}
                          disabled={savingAmount === s.id}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {savingAmount === s.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditingAmount((prev) => ({ ...prev, [s.id]: String(total) }))}
                        className="text-xs text-gray-700 hover:text-blue-600 hover:underline"
                      >
                        ₪{total.toLocaleString() || "—"}
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-center text-gray-500">₪{charged.toLocaleString()}</div>

                  <div className={`text-xs text-center font-medium ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {remaining > 0 ? `₪${remaining.toLocaleString()}` : "הושלם ✓"}
                  </div>

                  <button
                    onClick={() => requestCharge([s.id], false)}
                    disabled={loading !== null || remaining <= 0}
                    className="flex flex-col items-center gap-0 px-3 py-1 text-xs border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      {loading === s.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                      {remaining > 0 ? `הטען ₪${remaining.toLocaleString()}` : "הושלם"}
                    </span>
                    {remaining > 0 && <span className="text-[9px] opacity-60 leading-tight">לאחר אימות</span>}
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-80 flex flex-col gap-4" dir="rtl">
            <div className="flex items-center gap-2 text-[#1e3a5f]">
              <Lock size={18} />
              <h3 className="font-semibold text-base">אימות נדרש</h3>
            </div>
            <p className="text-sm text-gray-500">הזן סיסמה כדי להמשיך עם הטעינה</p>
            <input
              ref={passwordRef}
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") confirmPassword(); if (e.key === "Escape") setPasswordModal(null); }}
              placeholder="סיסמה"
              className={`border rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 ${passwordError ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-blue-300"}`}
            />
            {passwordError && <p className="text-xs text-red-500 text-center -mt-2">סיסמה שגויה, נסה שנית</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setPasswordModal(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={confirmPassword}
                className="flex-1 px-4 py-2 text-sm bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2d4f7f] transition-colors"
              >
                אישור
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
