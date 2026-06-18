"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, useState, useMemo, Fragment } from "react";
import { updateScoreBoolean, updateScoreNumber } from "./actions";
import { AlertTriangle, Download, FileText, X, Search, Filter } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

type Exam = { id: string; parasha: string; exam_date: string | null };

type Score = {
  id: string;
  student_id: string;
  exam_id: string;
  arrived_on_time: boolean;
  attended_seder: boolean;
  attended_class: boolean;
  weekly_summary: boolean;
  paid: boolean;
  chassidut_score: number | null;
  halacha_score: number | null;
  tefila_score: number | null;
  points_kaitz: number | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    city: string | null;
    coordinator_id?: string | null;
    group_id?: string | null;
    coordinator: { id: string; name: string } | null;
  } | null;
};

function getAttendanceBg(rate: number) {
  if (rate >= 80) return "bg-green-100 text-green-800";
  if (rate >= 60) return "bg-green-50 text-green-700";
  if (rate >= 40) return "bg-yellow-50 text-yellow-700";
  if (rate >= 20) return "bg-orange-50 text-orange-700";
  return "bg-red-50 text-red-700";
}

type BoolField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

function CheckboxCell({
  scoreId,
  field,
  value,
  onToggle,
}: {
  scoreId: string;
  field: BoolField;
  value: boolean;
  onToggle: (scoreId: string, field: BoolField, value: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(scoreId, field, !value)}
      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-lg transition-all ${
        value
          ? "bg-[#1e3a5f] border-[#1e3a5f] text-white"
          : "border-gray-300 text-transparent hover:border-gray-400"
      }`}
    >
      ✓
    </button>
  );
}

// Editable manual points cell (נקודות ידני) — same field as summer-exam points (points_kaitz)
function ManualPointsCell({
  scoreId,
  value,
  onSave,
}: {
  scoreId: string;
  value: number | null;
  onSave: (scoreId: string, value: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        type="number"
        min="0"
        defaultValue={value ?? ""}
        autoFocus
        className="w-16 text-center text-sm border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
        onBlur={(e) => {
          setEditing(false);
          const v = e.target.value === "" ? null : Number(e.target.value);
          if (v !== value) onSave(scoreId, v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }
  return (
    <span
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-blue-50 rounded px-2 py-0.5 min-w-[2.5rem] inline-block text-center transition-colors"
      title="לחץ לעריכה"
    >
      {value ?? <span className="text-gray-300">—</span>}
    </span>
  );
}

export default function AttendanceClient({
  exams,
  scores: initialScores,
  selectedExamId,
  attendanceRates,
}: {
  exams: Exam[];
  scores: Score[];
  selectedExamId: string | null;
  attendanceRates: Record<string, number>;
}) {
  const router = useRouter();
  const { isStudentVisible, settings } = useSettings();
  const [, startTransition] = useTransition();
  const [optimisticScores, updateOptimistic] = useOptimistic(
    initialScores,
    (state, { id, field, value }: { id: string; field: string; value: boolean | number | null }) =>
      state.map((s) => (s.id === id ? { ...s, [field]: value } : s))
  );

  const isAll = selectedExamId === "all";

  const [coordinatorFilter, setCoordinatorFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [nameSearch, setNameSearch] = useState("");
  const [showZeroOnly, setShowZeroOnly] = useState(false);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  function handleExamChange(examId: string) {
    router.push(`/attendance?exam=${examId}`);
  }

  function handleToggle(scoreId: string, field: BoolField, value: boolean) {
    startTransition(async () => {
      updateOptimistic({ id: scoreId, field, value });
      await updateScoreBoolean(scoreId, field, value);
    });
  }

  function handleManualPoints(scoreId: string, value: number | null) {
    startTransition(async () => {
      updateOptimistic({ id: scoreId, field: "points_kaitz", value });
      await updateScoreNumber(scoreId, "points_kaitz", value);
    });
  }

  // Scores visible per control-panel settings (hidden coordinators / groups)
  const visibleScores = useMemo(() => {
    return optimisticScores.filter((s) =>
      isStudentVisible({ coordinator_id: s.student?.coordinator_id, group_id: s.student?.group_id })
    );
  }, [optimisticScores, isStudentVisible, settings.hiddenCoordinators, settings.hiddenGroups]);

  // Unique coordinators and cities for filters — only from visible students
  const coordinators = useMemo(() => {
    const set = new Set<string>();
    visibleScores.forEach((s) => {
      if (s.student?.coordinator?.name) set.add(s.student.coordinator.name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
  }, [visibleScores]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    visibleScores.forEach((s) => {
      if (s.student?.city) set.add(s.student.city);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "he"));
  }, [visibleScores]);

  // Filtered scores
  const filteredScores = useMemo(() => {
    return visibleScores.filter((s) => {
      const coord = s.student?.coordinator?.name ?? "";
      const city = s.student?.city ?? "";
      const name = `${s.student?.first_name ?? ""} ${s.student?.last_name ?? ""}`;
      const points =
        (s.arrived_on_time ? 1 : 0) +
        (s.attended_seder ? 1 : 0) +
        (s.attended_class ? 1 : 0) +
        (s.weekly_summary ? 1 : 0);

      if (coordinatorFilter && coord !== coordinatorFilter) return false;
      if (cityFilter && city !== cityFilter) return false;
      if (nameSearch && !name.includes(nameSearch)) return false;
      if (showZeroOnly && points !== 0) return false;
      return true;
    });
  }, [visibleScores, coordinatorFilter, cityFilter, nameSearch, showZeroOnly]);

  // Grouped by coordinator, students sorted alphabetically within each group
  const grouped = useMemo(() => {
    const map = new Map<string, Score[]>();
    filteredScores.forEach((s) => {
      const key = s.student?.coordinator?.name ?? "ללא משפיע";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0], "he"))
      .map(([coord, records]) => [
        coord,
        [...records].sort(
          (a, b) =>
            (a.student?.last_name ?? "").localeCompare(b.student?.last_name ?? "", "he") ||
            (a.student?.first_name ?? "").localeCompare(b.student?.first_name ?? "", "he")
        ),
      ] as [string, Score[]]);
  }, [filteredScores]);

  // "כל הפרשיות" aggregate — total points per student across all parshiyot, grouped by coordinator
  const aggregateGroups = useMemo(() => {
    if (!isAll) return [];
    type Agg = { id: string; name: string; coordName: string; totalPoints: number; count: number };
    const byStudent = new Map<string, Agg>();
    filteredScores.forEach((s) => {
      if (!s.student) return;
      const id = s.student_id;
      if (!byStudent.has(id)) {
        byStudent.set(id, {
          id,
          name: `${s.student.first_name ?? ""} ${s.student.last_name ?? ""}`.trim(),
          coordName: s.student.coordinator?.name ?? "ללא משפיע",
          totalPoints: 0,
          count: 0,
        });
      }
      const agg = byStudent.get(id)!;
      agg.totalPoints +=
        (s.arrived_on_time ? 1 : 0) +
        (s.attended_seder ? 1 : 0) +
        (s.attended_class ? 1 : 0) +
        (s.weekly_summary ? 1 : 0);
      agg.count += 1;
    });
    const byCoord = new Map<string, Agg[]>();
    byStudent.forEach((agg) => {
      if (!byCoord.has(agg.coordName)) byCoord.set(agg.coordName, []);
      byCoord.get(agg.coordName)!.push(agg);
    });
    return Array.from(byCoord.entries())
      .map(([coord, list]) =>
        [coord, list.sort((a, b) => a.name.localeCompare(b.name, "he"))] as const
      )
      .sort((a, b) => a[0].localeCompare(b[0], "he"));
  }, [isAll, filteredScores]);

  // Progress stats
  const progressStats = useMemo(() => {
    const total = filteredScores.length;
    const participated = filteredScores.filter((s) => s.attended_seder).length;
    return { total, participated, pct: total > 0 ? Math.round((participated / total) * 100) : 0 };
  }, [filteredScores]);

  // Coordinators with no data this exam
  const missingCoordinators = useMemo(() => {
    const withActivity = new Set<string>();
    optimisticScores.forEach((s) => {
      if (
        s.arrived_on_time || s.attended_seder || s.attended_class || s.weekly_summary
      ) {
        if (s.student?.coordinator?.name) withActivity.add(s.student.coordinator.name);
      }
    });
    return coordinators.filter((c) => !withActivity.has(c));
  }, [optimisticScores, coordinators]);

  // Export CSV
  function downloadCSV() {
    if (!selectedExam) return;
    const headers = ["שם", "הגעה 5 דקות", "השתתף בסדר", "השתתף בשיעור", "סיכום שבועי", "נקודות"];
    let csv = "﻿" + headers.join(",") + "\n";
    grouped.forEach(([coordName, records]) => {
      csv += `\n"${coordName} (${records.length} בחורים)"\n`;
      records.forEach((s) => {
        const name = `${s.student?.first_name ?? ""} ${s.student?.last_name ?? ""}`.trim();
        const points =
          (s.arrived_on_time ? 1 : 0) +
          (s.attended_seder ? 1 : 0) +
          (s.attended_class ? 1 : 0) +
          (s.weekly_summary ? 1 : 0);
        csv += `"${name}",${s.arrived_on_time ? "כן" : "לא"},${s.attended_seder ? "כן" : "לא"},${s.attended_class ? "כן" : "לא"},${s.weekly_summary ? "כן" : "לא"},${points}\n`;
      });
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedExam.parasha}_נוכחות.csv`;
    a.click();
  }

  // Export PDF
  function downloadPDF() {
    if (!selectedExam) return;
    let html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8">
    <title>${selectedExam.parasha}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;direction:rtl}
      h1{text-align:center;color:#1e3a5f;margin-bottom:4px}
      .subtitle{text-align:center;color:#666;font-size:14px;margin-bottom:24px}
      h2{background:#e8f0fe;padding:8px 12px;border-radius:6px;color:#1e3a5f;font-size:15px;margin:20px 0 8px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px;font-size:13px}
      th,td{border:1px solid #e0e0e0;padding:7px 10px;text-align:center}
      th{background:#f5f7fa;font-weight:600}
      td.name{text-align:right}
      .yes{color:#16a34a;font-weight:700}
      .no{color:#d1d5db}
      .pts{background:#fefce8;font-weight:700;color:#854d0e}
      @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <h1>${selectedExam.parasha}</h1>
    <div class="subtitle">סה"כ ${filteredScores.length} בחורים | ${grouped.length} משפיעים | ${progressStats.participated} השתתפו בסדר (${progressStats.pct}%)</div>`;

    grouped.forEach(([coordName, records]) => {
      html += `<h2>${coordName} — ${records.length} בחורים</h2>
      <table><thead><tr><th>שם</th><th>הגעה 5 דקות</th><th>השתתף בסדר</th><th>השתתף בשיעור</th><th>סיכום שבועי</th><th>נקודות</th></tr></thead><tbody>`;
      records.forEach((s) => {
        const name = `${s.student?.first_name ?? ""} ${s.student?.last_name ?? ""}`.trim();
        const pts =
          (s.arrived_on_time ? 1 : 0) +
          (s.attended_seder ? 1 : 0) +
          (s.attended_class ? 1 : 0) +
          (s.weekly_summary ? 1 : 0);
        const c = (v: boolean) => `<span class="${v ? "yes" : "no"}">${v ? "✓" : "✗"}</span>`;
        html += `<tr><td class="name">${name}</td><td>${c(s.arrived_on_time)}</td><td>${c(s.attended_seder)}</td><td>${c(s.attended_class)}</td><td>${c(s.weekly_summary)}</td><td class="pts">${pts}</td></tr>`;
      });
      html += `</tbody></table>`;
    });

    html += `</body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.onload = () => w.print(); }
  }

  return (
    <div>
      {/* Filters bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex flex-wrap gap-3 items-end">
        {/* Exam selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">פרשה / מבחן</label>
          <select
            value={selectedExamId ?? ""}
            onChange={(e) => handleExamChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[160px]"
          >
            <option value="all">כל הפרשיות</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.parasha}
                {e.exam_date ? ` — ${new Date(e.exam_date).toLocaleDateString("he-IL")}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Coordinator filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Filter size={11} /> משפיע
          </label>
          <select
            value={coordinatorFilter}
            onChange={(e) => setCoordinatorFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">הכל</option>
            {coordinators.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* City filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">עיר</label>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">הכל</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Name search */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Search size={11} /> חיפוש שם
          </label>
          <input
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="הקלד שם..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-36"
          />
        </div>

        {/* Zero points toggle */}
        <button
          onClick={() => setShowZeroOnly(!showZeroOnly)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors self-end ${
            showZeroOnly ? "bg-[#1e3a5f] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          רק 0 נקודות
        </button>

        <div className="flex gap-2 self-end mr-auto">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
          >
            <Download size={15} /> Excel
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Exam header + progress */}
      {selectedExam && (
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-[#1e3a5f]">{selectedExam.parasha}</h2>
            {selectedExam.exam_date && (
              <span className="text-sm text-gray-500">
                {new Date(selectedExam.exam_date).toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            )}
            <button
              onClick={() => setShowMissingModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                missingCoordinators.length > 0
                  ? "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <AlertTriangle size={14} />
              {missingCoordinators.length} משפיעים ללא נתונים
            </button>
          </div>

          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">השתתפות בסדר</span>
              <span className="text-sm text-gray-500">
                {progressStats.participated} / {progressStats.total} ({progressStats.pct}%)
              </span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-green-500 to-green-400 rounded-full transition-all duration-500"
                style={{ width: `${progressStats.pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Missing coordinators modal */}
      {showMissingModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowMissingModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">משפיעים ללא נתונים השבוע</h3>
              <button
                onClick={() => setShowMissingModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            {missingCoordinators.length === 0 ? (
              <p className="text-green-600 text-center py-4 font-medium">כל המשפיעים הזינו נתונים ✓</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {missingCoordinators.map((name) => (
                  <li key={name} className="px-3 py-2 bg-orange-50 rounded-lg text-sm text-gray-800 border border-orange-100">
                    {name}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-gray-400 text-center">סה"כ: {missingCoordinators.length} משפיעים</p>
          </div>
        </div>
      )}

      {/* Aggregate table — "כל הפרשיות" */}
      {isAll ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right px-5 py-3.5 font-semibold text-gray-600">שם</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap">מס׳ פרשיות</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">סה"כ נקודות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {aggregateGroups.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-16 text-center text-gray-400">
                      אין רשומות להצגה
                    </td>
                  </tr>
                ) : (
                  aggregateGroups.map(([coordName, rows]) => (
                    <Fragment key={`agg-${coordName}`}>
                      <tr className="bg-blue-50 border-y border-blue-100">
                        <td colSpan={3} className="px-5 py-2 text-sm font-semibold text-[#1e3a5f]">
                          {coordName}
                          <span className="font-normal text-gray-500 mr-2">({rows.length} בחורים)</span>
                        </td>
                      </tr>
                      {rows.map((row, idx) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                        >
                          <td className="px-5 py-3 font-medium text-gray-900">{row.name || "—"}</td>
                          <td className="px-4 py-3 text-center text-gray-600">{row.count}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-full text-sm font-bold bg-blue-100 text-blue-700">
                              {row.totalPoints}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
            <span>סה"כ: {aggregateGroups.reduce((acc, [, rows]) => acc + rows.length, 0)} בחורים</span>
            <span>{aggregateGroups.length} משפיעים</span>
            <span className="text-gray-400">סיכום נקודות על פני כל הפרשיות</span>
          </div>
        </div>
      ) : (
      /* Table */
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">שם</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap">הגעה 5 דקות</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap">השתתף בסדר</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap">השתתף בשיעור</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 whitespace-nowrap">סיכום שבועי</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600">נקודות</th>
                <th className="text-center px-4 py-3.5 font-semibold text-orange-600 whitespace-nowrap">נקודות ידני</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredScores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    אין רשומות להצגה
                  </td>
                </tr>
              ) : (
                grouped.map(([coordName, records]) => (
                  <Fragment key={`header-${coordName}`}>
                    {/* Coordinator group header */}
                    <tr className="bg-blue-50 border-y border-blue-100">
                      <td colSpan={7} className="px-5 py-2 text-sm font-semibold text-[#1e3a5f]">
                        {coordName}
                        <span className="font-normal text-gray-500 mr-2">({records.length} בחורים)</span>
                      </td>
                    </tr>

                    {/* Student rows */}
                    {records.map((score, idx) => {
                      const rate = attendanceRates[score.student_id] ?? 0;
                      const nameBg = getAttendanceBg(rate);
                      const name = `${score.student?.first_name ?? ""} ${score.student?.last_name ?? ""}`.trim();
                      const points =
                        (score.arrived_on_time ? 1 : 0) +
                        (score.attended_seder ? 1 : 0) +
                        (score.attended_class ? 1 : 0) +
                        (score.weekly_summary ? 1 : 0);

                      return (
                        <tr
                          key={score.id}
                          className={`hover:bg-gray-50 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                        >
                          <td className="px-5 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${nameBg}`}
                              title={`נוכחות כללית: ${rate}%`}
                            >
                              {name || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckboxCell scoreId={score.id} field="arrived_on_time" value={score.arrived_on_time} onToggle={handleToggle} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckboxCell scoreId={score.id} field="attended_seder" value={score.attended_seder} onToggle={handleToggle} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckboxCell scoreId={score.id} field="attended_class" value={score.attended_class} onToggle={handleToggle} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <CheckboxCell scoreId={score.id} field="weekly_summary" value={score.weekly_summary} onToggle={handleToggle} />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              points === 4 ? "bg-green-100 text-green-700" :
                              points >= 2 ? "bg-yellow-50 text-yellow-700" :
                              points === 0 ? "bg-red-50 text-red-500" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {points}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <ManualPointsCell scoreId={score.id} value={score.points_kaitz} onSave={handleManualPoints} />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
          <span>סה"כ: {filteredScores.length} בחורים</span>
          <span>{grouped.length} משפיעים</span>
          <span className="flex items-center gap-1.5 mr-2 text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> 80%+ נוכחות
            <span className="w-3 h-3 rounded-sm bg-yellow-50 inline-block mr-1" /> 40-79%
            <span className="w-3 h-3 rounded-sm bg-red-50 inline-block mr-1" /> מתחת 40%
          </span>
        </div>
      </div>
      )}
    </div>
  );
}
