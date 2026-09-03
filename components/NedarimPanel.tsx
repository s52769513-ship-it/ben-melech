"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2, CheckCircle, XCircle, Zap, FlaskConical, Lock } from "lucide-react";
import { settleHistoricAction } from "@/app/(app)/nedarim/actions";

type LedgerRow = {
  id: string;
  first_name: string;
  last_name: string;
  nedarim_id: number | null;
  total: number;
  charged: number;
  recent: number;
  historic: number;
  chargeable: number;
  settled: boolean;
};

type ChargeResult = {
  id: string;
  name: string;
  amount: number;
  success: boolean;
  dryRun?: boolean;
  reason?: string;
};

export default function NedarimPanel({
  students,
  cutoff,
}: {
  students: LedgerRow[];
  cutoff: string;
}) {
  const [loading, setLoading] = useState<"all" | "dry" | string | null>(null);
  const [results, setResults] = useState<ChargeResult[] | null>(null);
  const [isDryRun, setIsDryRun] = useState(false);
  const [localCharged, setLocalCharged] = useState<Record<string, number>>({});
  const [settling, startSettling] = useTransition();

  const studentsWithNedarim = students.filter((s) => s.nedarim_id);

  function getCharged(s: LedgerRow) {
    return localCharged[s.id] ?? s.charged;
  }

  // What may still go onto the card: never more than the money earned since the
  // cutoff, and never anything at all while the old balance is still open.
  function getRemaining(s: LedgerRow) {
    const alreadyCharged = getCharged(s) - s.charged;
    return s.settled ? Math.max(s.chargeable - alreadyCharged, 0) : 0;
  }

  const eligible = studentsWithNedarim.filter((s) => getRemaining(s) > 0);
  const totalToCharge = eligible.reduce((sum, s) => sum + getRemaining(s), 0);
  const unsettled = studentsWithNedarim.filter((s) => !s.settled);
  const unsettledTotal = unsettled.reduce((sum, s) => sum + (s.historic - s.charged), 0);

  const cutoffLabel = new Date(cutoff).toLocaleDateString("he-IL");

  function settle(studentIds?: string[]) {
    startSettling(async () => {
      await settleHistoricAction(studentIds);
    });
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
            if (s) updates[r.id] = getCharged(s) + r.amount;
          }
        }
        setLocalCharged((prev) => ({ ...prev, ...updates }));
      }
    } finally {
      setLoading(null);
    }
  }

  return (
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
            onClick={() => doCharge(undefined, true)}
            disabled={loading !== null || eligible.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-purple-400 text-purple-700 text-sm rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "dry" ? <Loader2 size={14} className="animate-spin" /> : <FlaskConical size={14} />}
            ניסוי בלבד
          </button>
          <button
            onClick={() => doCharge(undefined, false)}
            disabled={loading !== null || eligible.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "all" ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            הטען הכל ({eligible.length})
          </button>
        </div>
      </div>

      <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-800">
        <Lock size={12} />
        <span>
          כסף שנצבר עד {cutoffLabel} נחשב יתרה ישנה ואינו ניתן להטענה מהממשק — רק כסף מפרשיות
          מ־{cutoffLabel} ואילך נטען לכרטיס.
        </span>
      </div>

      {unsettled.length > 0 && (
        <div className="px-6 py-3 bg-orange-50 border-b border-orange-100 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-orange-800">
            ל־{unsettled.length} בחורים יש יתרה ישנה פתוחה (₪{Math.round(unsettledTotal).toLocaleString()}).
            סגירת היתרה מסמנת את הכסף הישן כמטופל — לא מתבצעת שום הטענה — ומאפשרת להטעין את הכסף החדש.
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  `לסמן את היתרות הישנות (עד ${cutoffLabel}) של ${unsettled.length} בחורים כמטופלות? לא תתבצע הטענה לכרטיסים.`
                )
              ) {
                settle();
              }
            }}
            disabled={settling}
            className="flex items-center gap-2 px-4 py-2 border border-orange-400 text-orange-700 text-sm rounded-lg hover:bg-orange-100 disabled:opacity-50 transition-colors"
          >
            {settling ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            סגור יתרות ישנות ({unsettled.length})
          </button>
        </div>
      )}

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
          <div className="grid grid-cols-[1fr_110px_110px_110px_110px_150px] gap-2 px-6 py-2 bg-gray-50 text-xs text-gray-400 font-medium">
            <span>בחור</span>
            <span className="text-center">סה״כ צבירה</span>
            <span className="text-center">יתרה ישנה</span>
            <span className="text-center">הוטען</span>
            <span className="text-center">לטעינה</span>
            <span />
          </div>

          {studentsWithNedarim
            .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "he"))
            .map((s) => {
              const remaining = getRemaining(s);
              const charged = getCharged(s);
              const result = results?.find((r) => r.id === s.id);
              const openHistoric = Math.max(s.historic - charged, 0);

              return (
                <div key={s.id} className="grid grid-cols-[1fr_110px_110px_110px_110px_150px] gap-2 items-center px-6 py-2.5">
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

                  <div className="text-xs text-center text-gray-700" title="מחושב באיירטייבל — כל הצבירה מאז ומעולם">
                    ₪{s.total.toLocaleString()}
                  </div>

                  <div
                    className={`text-xs text-center ${openHistoric > 0 ? "text-orange-600" : "text-gray-400"}`}
                    title={`כסף שנצבר עד ${cutoffLabel} — לא ניתן להטענה מהממשק`}
                  >
                    {openHistoric > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock size={10} />₪{Math.round(openHistoric).toLocaleString()}
                      </span>
                    ) : (
                      "סגורה ✓"
                    )}
                  </div>

                  <div className="text-xs text-center text-gray-500">₪{Math.round(charged).toLocaleString()}</div>

                  <div className={`text-xs text-center font-medium ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {remaining > 0 ? `₪${remaining.toLocaleString()}` : "הושלם ✓"}
                  </div>

                  {s.settled ? (
                    <button
                      onClick={() => doCharge([s.id], false)}
                      disabled={loading !== null || remaining <= 0}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading === s.id ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
                      {remaining > 0 ? `הטען ₪${remaining.toLocaleString()}` : "הושלם"}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `לסמן את היתרה הישנה (₪${Math.round(openHistoric).toLocaleString()}) של ${s.last_name} ${s.first_name} כמטופלת? לא תתבצע הטענה לכרטיס.`
                          )
                        ) {
                          settle([s.id]);
                        }
                      }}
                      disabled={settling}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs border border-orange-400 text-orange-700 rounded-lg hover:bg-orange-50 disabled:opacity-40 transition-colors"
                    >
                      {settling ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
                      סגור יתרה ישנה
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
