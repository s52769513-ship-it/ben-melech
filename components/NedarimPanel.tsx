"use client";

import { useState } from "react";
import { CreditCard, Loader2, CheckCircle, XCircle, Zap, FlaskConical } from "lucide-react";

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

  const eligible = students.filter(
    (s) => s.nedarim_id && (s.nedarim_amount ?? 0) - getCharged(s) > 0
  );

  function getCharged(s: StudentRow) {
    return localCharged[s.id] ?? s.nedarim_charged ?? 0;
  }

  function getRemaining(s: StudentRow) {
    return (s.nedarim_amount ?? 0) - getCharged(s);
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

  const totalToCharge = eligible.reduce((sum, s) => sum + getRemaining(s), 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-gray-500" />
          <h2 className="font-semibold text-gray-700">הטענת כרטיסי נדרים פלוס</h2>
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {eligible.length} ממתינים • ₪{totalToCharge.toLocaleString()} סה״כ
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => doCharge(undefined, true)}
            disabled={loading !== null || eligible.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-purple-400 text-purple-700 text-sm rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "dry" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <FlaskConical size={14} />
            )}
            ניסוי בלבד
          </button>
          <button
            onClick={() => doCharge(undefined, false)}
            disabled={loading !== null || eligible.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white text-sm rounded-lg hover:bg-[#2d4f7f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading === "all" ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            הטען הכל ({eligible.length})
          </button>
        </div>
      </div>

      {results && (
        <div className={`px-6 py-3 border-b ${isDryRun ? "bg-purple-50 border-purple-100" : "bg-blue-50 border-blue-100"}`}>
          <p className={`text-sm font-medium ${isDryRun ? "text-purple-800" : "text-blue-800"}`}>
            {isDryRun ? "🔬 ניסוי בלבד — לא בוצעה הטענה אמיתית | " : ""}
            {results.filter((r) => r.success).length} יוטענו בהצלחה,{" "}
            {results.filter((r) => !r.success).length} לא יוטענו
            {!isDryRun && ` (סה״כ ₪${results.filter(r => r.success).reduce((s, r) => s + r.amount, 0).toLocaleString()})`}
          </p>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {students.filter((s) => s.nedarim_id).length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">אין בחורים עם מזהה נדרים</p>
        ) : (
          students
            .filter((s) => s.nedarim_id)
            .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`, "he"))
            .map((s) => {
              const remaining = getRemaining(s);
              const charged = getCharged(s);
              const total = s.nedarim_amount ?? 0;
              const result = results?.find((r) => r.id === s.id);

              return (
                <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        {s.last_name} {s.first_name}
                      </span>
                      <span className="text-xs text-gray-400">#{s.nedarim_id}</span>
                      {result && (
                        result.success ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} className={result.dryRun ? "text-purple-500" : "text-green-500"} />
                            {result.dryRun && <span className="text-xs text-purple-500">ניסוי</span>}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle size={14} className="text-red-400" />
                            {result.reason && (
                              <span className="text-xs text-red-400">{result.reason}</span>
                            )}
                          </span>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        הוטען: ₪{charged.toLocaleString()} / ₪{total.toLocaleString()}
                      </span>
                      {remaining > 0 && (
                        <span className="text-xs font-medium text-orange-600">
                          נשאר: ₪{remaining.toLocaleString()}
                        </span>
                      )}
                      {remaining <= 0 && total > 0 && (
                        <span className="text-xs font-medium text-green-600">הושלם ✓</span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => doCharge([s.id], false)}
                    disabled={loading !== null || remaining <= 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#1e3a5f] text-[#1e3a5f] rounded-lg hover:bg-[#1e3a5f] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    {loading === s.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <CreditCard size={12} />
                    )}
                    הטען {remaining > 0 ? `₪${remaining.toLocaleString()}` : "✓"}
                  </button>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
