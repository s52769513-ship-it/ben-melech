"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, useCallback, useState } from "react";
import { ChevronRight, ChevronLeft, Download, Printer } from "lucide-react";
import { updateExamNote, upsertCoordinatorNote } from "./actions";
import { useSettings } from "@/lib/settings-context";

type Exam = { id: string; parasha: string; exam_date: string | null };

type Coordinator = { id: string; name: string };

type ScoreRow = {
  id: string;
  student_id: string;
  chassidut_score: number | null;
  halacha_score: number | null;
  tefila_score: number | null;
  beinoni_score: number | null;
  shleimut_score: number | null;
  attended_seder: boolean;
  arrived_on_time: boolean;
  attended_class: boolean;
  weekly_summary: boolean;
  attended_seder_old: boolean;
  arrived_on_time_old: boolean;
  paid: boolean;
  payment_amount: number | null;
  personal_note: string | null;
  rabbi_note: string | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    coordinator: { id: string; name: string } | null;
  } | null;
};

type CoordNote = {
  id: string | null;
  coordinator_id: string;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
};

interface Props {
  exams: Exam[];
  coordinators: Coordinator[];
  scores: ScoreRow[];
  examNotes: { id: string; coordinator_id: string; sicha_beinyan: string | null; maskana: string | null; hemshech_tipul: string | null }[];
  selectedExamId: string | null;
  activeTab: string;
}

const TABS = [
  { key: "mishpayim", label: "שיחות עם משפיעים" },
  { key: "sichot", label: "ניהול שיחות" },
];

const SICHA_OPTIONS = ["מיוזמתי", "יוזמת המשפיע"];

export default function ManagementClient({
  exams,
  coordinators,
  scores,
  examNotes: initialExamNotes,
  selectedExamId,
  activeTab,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const { settings, toggle } = useSettings();

  // Build initial coord notes map (one per coordinator)
  const buildNotesMap = (notes: Props["examNotes"]): Map<string, CoordNote> => {
    const map = new Map<string, CoordNote>();
    coordinators.forEach((c) => {
      const existing = notes.find((n) => n.coordinator_id === c.id);
      map.set(c.id, {
        id: existing?.id ?? null,
        coordinator_id: c.id,
        sicha_beinyan: existing?.sicha_beinyan ?? null,
        maskana: existing?.maskana ?? null,
        hemshech_tipul: existing?.hemshech_tipul ?? null,
      });
    });
    return map;
  };

  const [coordNotes, setCoordNotes] = useState<Map<string, CoordNote>>(() =>
    buildNotesMap(initialExamNotes)
  );

  // Per-student note optimistic state (tab 2)
  const [scores2, updateOptimistic] = useOptimistic(
    scores,
    (
      state,
      { id, field, value }: { id: string; field: "personal_note" | "rabbi_note"; value: string | null }
    ) => state.map((s) => (s.id === id ? { ...s, [field]: value } : s))
  );

  const currentIndex = exams.findIndex((e) => e.id === selectedExamId);
  const currentExam = exams[currentIndex] ?? exams[0];

  function navigate(examId: string) {
    router.push(`/management?exam=${examId}&tab=${activeTab}`);
  }

  function setTab(tab: string) {
    router.push(`/management?${selectedExamId ? `exam=${selectedExamId}&` : ""}tab=${tab}`);
  }

  function handleStudentNote(scoreId: string, field: "personal_note" | "rabbi_note", value: string) {
    startTransition(async () => {
      updateOptimistic({ id: scoreId, field, value: value || null });
      await updateExamNote(scoreId, field, value || null);
    });
  }

  function handleCoordNoteField(coordId: string, field: keyof Omit<CoordNote, "id" | "coordinator_id">, value: string) {
    setCoordNotes((prev) => {
      const updated = new Map(prev);
      const note = { ...updated.get(coordId)! };
      (note as Record<string, unknown>)[field] = value || null;
      updated.set(coordId, note);
      return updated;
    });
  }

  function handleCoordNoteBlur(coordId: string) {
    if (!selectedExamId) return;
    const note = coordNotes.get(coordId);
    if (!note) return;
    startTransition(async () => {
      await upsertCoordinatorNote({
        coordinatorId: coordId,
        examId: selectedExamId,
        sicha_beinyan: note.sicha_beinyan,
        maskana: note.maskana,
        hemshech_tipul: note.hemshech_tipul,
      });
    });
  }

  // Group scores by coordinator for tab "sichot"
  const groupedByCoord: Map<string, { coord: Coordinator; rows: ScoreRow[] }> = new Map();
  coordinators.forEach((c) => groupedByCoord.set(c.id, { coord: c, rows: [] }));
  scores2.forEach((s) => {
    const coordId = s.student?.coordinator?.id;
    if (coordId && groupedByCoord.has(coordId)) {
      groupedByCoord.get(coordId)!.rows.push(s);
    } else {
      const noKey = "__none__";
      if (!groupedByCoord.has(noKey)) groupedByCoord.set(noKey, { coord: { id: noKey, name: "ללא משפיע" }, rows: [] });
      groupedByCoord.get(noKey)!.rows.push(s);
    }
  });
  const groupedArr = Array.from(groupedByCoord.values())
    .filter((g) => g.rows.length > 0)
    .sort((a, b) => a.coord.name.localeCompare(b.coord.name, "he"));

  const handleExportCSV = useCallback(() => {
    if (activeTab === "mishpayim") {
      const headers = ["משפיע", "שיחה בעניין", "מסקנה", "המשך טיפול ומעקב"];
      const rows = coordinators.map((c) => {
        const note = coordNotes.get(c.id);
        return [c.name, note?.sicha_beinyan ?? "", note?.maskana ?? "", note?.hemshech_tipul ?? ""];
      });
      downloadCSV(headers, rows, `${currentExam?.parasha ?? "ניהול"}_שיחות_משפיעים.csv`);
    } else {
      const headers = ["משפיע", "בחור", "השתתף", "הגעה ב-5 דקות", "מבחן הלכה", "סכום לתשלום", "פניה אישית", "שמתי לב..."];
      const rows = scores2.map((s) => {
        const name = `${s.student?.first_name ?? ""} ${s.student?.last_name ?? ""}`.trim();
        const coord = s.student?.coordinator?.name ?? "";
        return [coord, name, s.attended_seder ? "כן" : "לא", s.arrived_on_time ? "כן" : "לא", s.halacha_score ?? "", s.payment_amount ?? "", s.personal_note ?? "", s.rabbi_note ?? ""];
      });
      downloadCSV(headers, rows, `${currentExam?.parasha ?? "ניהול"}_שיחות.csv`);
    }
  }, [activeTab, coordinators, coordNotes, scores2, currentExam]);

  function downloadCSV(headers: unknown[], rows: unknown[][], filename: string) {
    const escape = (c: unknown) => {
      const str = String(c ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csv = "﻿" + [headers, ...rows].map((r) => (r as unknown[]).map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const handlePrint = useCallback(() => window.print(), []);

  const inputCls = "w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white print:border-0 print:p-0";

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Top tabs */}
      <div className="bg-white border-b border-gray-200 px-6 print:hidden flex items-center justify-between">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTab(tab.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => toggle("hideKibbutz")}
          className={`text-sm px-4 py-1.5 rounded-full border font-medium transition-colors ${
            settings.hideKibbutz
              ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          {settings.hideKibbutz ? "גלה קיבוץ" : "הסתר קיבוץ"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Exam navigation */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => currentIndex > 0 && navigate(exams[currentIndex - 1].id)}
              disabled={currentIndex <= 0}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} className="text-gray-600" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-lg font-bold text-[#1e3a5f]">{currentExam?.parasha ?? "בחר פרשה"}</p>
              {currentExam?.exam_date && (
                <p className="text-xs text-gray-400 mt-0.5">{new Date(currentExam.exam_date).toLocaleDateString("he-IL")}</p>
              )}
              <p className="text-xs text-gray-400">{currentIndex + 1} מתוך {exams.length}</p>
            </div>
            <button
              onClick={() => currentIndex < exams.length - 1 && navigate(exams[currentIndex + 1].id)}
              disabled={currentIndex >= exams.length - 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors"
            >
              <Download size={16} />
              ייצוא Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} />
              הדפס
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block text-center mb-6">
          <h2 className="text-2xl font-bold">{currentExam?.parasha}</h2>
          {currentExam?.exam_date && (
            <p className="text-gray-500 mt-1">{new Date(currentExam.exam_date).toLocaleDateString("he-IL")}</p>
          )}
        </div>

        {/* TAB: שיחות עם משפיעים */}
        {activeTab === "mishpayim" && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-[#1e3a5f]/5 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f]">משפיע</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f] min-w-[180px]">שיחה בעניין</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f] min-w-[200px]">מסקנה</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f] min-w-[200px]">המשך טיפול ומעקב</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.map((coord, idx) => {
                    const note = coordNotes.get(coord.id);
                    return (
                      <tr key={coord.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{coord.name}</td>
                        <td className="px-3 py-2">
                          <select
                            value={note?.sicha_beinyan ?? ""}
                            onChange={(e) => handleCoordNoteField(coord.id, "sicha_beinyan", e.target.value)}
                            onBlur={() => handleCoordNoteBlur(coord.id)}
                            className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 print:border-0 print:p-0"
                          >
                            <option value="">בחר...</option>
                            {SICHA_OPTIONS.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 print:px-2">
                          <textarea
                            value={note?.maskana ?? ""}
                            onChange={(e) => handleCoordNoteField(coord.id, "maskana", e.target.value)}
                            onBlur={() => handleCoordNoteBlur(coord.id)}
                            rows={2}
                            placeholder="מסקנה..."
                            className={inputCls}
                          />
                        </td>
                        <td className="px-3 py-2 print:px-2">
                          <textarea
                            value={note?.hemshech_tipul ?? ""}
                            onChange={(e) => handleCoordNoteField(coord.id, "hemshech_tipul", e.target.value)}
                            onBlur={() => handleCoordNoteBlur(coord.id)}
                            rows={2}
                            placeholder="המשך טיפול..."
                            className={inputCls}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              סה"כ {coordinators.length} משפיעים
            </div>
          </div>
        )}

        {/* TAB: ניהול שיחות */}
        {activeTab === "sichot" && (
          scores2.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
              אין רשומות לפרשה זו
            </div>
          ) : (
            <div className="space-y-6">
              {groupedArr.map(({ coord, rows }) => (
                <div key={coord.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-5 py-3 bg-[#f5f8ff] border-b border-blue-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-[#1e3a5f]">{coord.name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{rows.length} בחורים</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-right px-4 py-2.5 font-semibold text-gray-600">בחור</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-gray-600">השתתף</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-gray-600">הגעה ב-5 דקות</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-amber-600 text-xs">השתתף {"{ישן}"}</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-amber-600 text-xs">הגעה ב-5 דקות {"{ישן}"}</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-gray-600">מבחן הלכה</th>
                          <th className="text-center px-3 py-2.5 font-semibold text-gray-600">סכום לתשלום</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-gray-600 min-w-[160px]">פניה אישית</th>
                          <th className="text-right px-4 py-2.5 font-semibold text-gray-600 min-w-[160px]">שמתי לב...</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((score, idx) => {
                          const name = `${score.student?.first_name ?? ""} ${score.student?.last_name ?? ""}`.trim();
                          return (
                            <tr
                              key={score.id}
                              className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
                            >
                              <td className="px-4 py-2.5 font-medium text-gray-900">{name || "—"}</td>
                              <td className="px-3 py-2.5 text-center">
                                {score.attended_seder ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {score.arrived_on_time ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-400">✗</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center bg-amber-50/40">
                                {score.attended_seder_old ? <span className="text-amber-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center bg-amber-50/40">
                                {score.arrived_on_time_old ? <span className="text-amber-600 font-bold">✓</span> : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2.5 text-center text-gray-700">{score.halacha_score ?? "—"}</td>
                              <td className="px-3 py-2.5 text-center text-gray-700">
                                {score.payment_amount ? `₪${score.payment_amount}` : "—"}
                              </td>
                              <td className="px-3 py-2 print:px-2">
                                <textarea
                                  value={score.personal_note ?? ""}
                                  onChange={(e) => handleStudentNote(score.id, "personal_note", e.target.value)}
                                  rows={2}
                                  placeholder="פניה אישית..."
                                  className={inputCls}
                                />
                              </td>
                              <td className="px-3 py-2 print:px-2">
                                <textarea
                                  value={score.rabbi_note ?? ""}
                                  onChange={(e) => handleStudentNote(score.id, "rabbi_note", e.target.value)}
                                  rows={2}
                                  placeholder="שמתי לב..."
                                  className={inputCls}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-400 text-center pb-2">
                סה"כ {scores2.length} בחורים | {groupedArr.length} משפיעים
              </div>
            </div>
          )
        )}
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          textarea { white-space: pre-wrap; word-wrap: break-word; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
