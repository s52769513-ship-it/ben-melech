"use client";

import { useRouter } from "next/navigation";
import { useOptimistic, useTransition, useCallback } from "react";
import { ChevronRight, ChevronLeft, Download, Printer } from "lucide-react";
import { updateScoreNote } from "./actions";

type Exam = { id: string; parasha: string; exam_date: string | null };

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
  paid: boolean;
  personal_note: string | null;
  rabbi_note: string | null;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    coordinator: { id: string; name: string } | null;
  } | null;
};

interface Props {
  exams: Exam[];
  scores: ScoreRow[];
  selectedExamId: string | null;
  activeTab: string;
}

const TABS = [{ key: "sichot", label: "ניהול שיחות" }];

export default function ManagementClient({ exams, scores: initialScores, selectedExamId, activeTab }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [scores, updateOptimistic] = useOptimistic(
    initialScores,
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

  function handleNote(
    scoreId: string,
    field: "personal_note" | "rabbi_note",
    value: string
  ) {
    startTransition(async () => {
      updateOptimistic({ id: scoreId, field, value: value || null });
      await updateScoreNote(scoreId, field, value || null);
    });
  }

  const handleExportCSV = useCallback(() => {
    if (!scores.length) return;
    const headers = ["שם בחור", "רכז", "חסידות", "הלכה", "תפילה", "בינוני", "שלמות", "נוכח בסדר", "שילם", "הערה אישית", "הערת רב"];
    const rows = scores.map((s) => {
      const name = `${s.student?.first_name ?? ""} ${s.student?.last_name ?? ""}`.trim();
      const coord = s.student?.coordinator?.name ?? "";
      return [
        name, coord,
        s.chassidut_score ?? "", s.halacha_score ?? "", s.tefila_score ?? "",
        s.beinoni_score ?? "", s.shleimut_score ?? "",
        s.attended_seder ? "כן" : "לא",
        s.paid ? "כן" : "לא",
        s.personal_note ?? "",
        s.rabbi_note ?? "",
      ];
    });

    const escape = (c: unknown) => {
      const str = String(c ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csv = "﻿" + [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${currentExam?.parasha ?? "ניהול"}_שיחות.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [scores, currentExam]);

  const handlePrint = useCallback(() => window.print(), []);

  // Group by coordinator
  const grouped: Map<string, ScoreRow[]> = new Map();
  scores.forEach((s) => {
    const key = s.student?.coordinator?.name ?? "ללא רכז";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  });
  const groupedArr = Array.from(grouped.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "he")
  );

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Top tabs */}
      <div className="bg-white border-b border-gray-200 px-6 print:hidden">
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
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Exam navigation bar */}
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
              <p className="text-lg font-bold text-[#1e3a5f]">
                {currentExam?.parasha ?? "בחר פרשה"}
              </p>
              {currentExam?.exam_date && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(currentExam.exam_date).toLocaleDateString("he-IL")}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {currentIndex + 1} מתוך {exams.length}
              </p>
            </div>

            <button
              onClick={() =>
                currentIndex < exams.length - 1 && navigate(exams[currentIndex + 1].id)
              }
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
            <p className="text-gray-500 mt-1">
              {new Date(currentExam.exam_date).toLocaleDateString("he-IL")}
            </p>
          )}
        </div>

        {/* Table */}
        {scores.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            אין רשומות לפרשה זו
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-[#1e3a5f]/5 to-blue-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f]">שם בחור</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f]">רכז</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">חסידות</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">הלכה</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">תפילה</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">בינוני</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">שלמות</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">נוכח</th>
                    <th className="text-center px-3 py-3 font-semibold text-[#1e3a5f]">שילם</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f] min-w-[180px]">מסקנה</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#1e3a5f] min-w-[180px]">המשך טיפול</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedArr.map(([coordName, rows]) => (
                    <>
                      <tr key={`g-${coordName}`} className="bg-blue-50 border-y border-blue-100">
                        <td
                          colSpan={11}
                          className="px-4 py-2 text-sm font-semibold text-[#1e3a5f]"
                        >
                          {coordName}
                          <span className="font-normal text-gray-500 mr-2">
                            ({rows.length} בחורים)
                          </span>
                        </td>
                      </tr>
                      {rows.map((score) => {
                        const name = `${score.student?.first_name ?? ""} ${score.student?.last_name ?? ""}`.trim();
                        return (
                          <tr
                            key={score.id}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-2.5 font-medium text-gray-900">{name || "—"}</td>
                            <td className="px-4 py-2.5 text-gray-500 text-xs">
                              {score.student?.coordinator?.name ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{score.chassidut_score ?? "—"}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{score.halacha_score ?? "—"}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{score.tefila_score ?? "—"}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{score.beinoni_score ?? "—"}</td>
                            <td className="px-3 py-2.5 text-center text-gray-700">{score.shleimut_score ?? "—"}</td>
                            <td className="px-3 py-2.5 text-center">
                              {score.attended_seder ? (
                                <span className="text-green-600 font-bold">✓</span>
                              ) : (
                                <span className="text-red-400">✗</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {score.paid ? (
                                <span className="text-green-600 font-bold">✓</span>
                              ) : (
                                <span className="text-red-400">✗</span>
                              )}
                            </td>
                            <td className="px-3 py-2 print:px-2">
                              <textarea
                                value={score.personal_note ?? ""}
                                onChange={(e) =>
                                  handleNote(score.id, "personal_note", e.target.value)
                                }
                                rows={2}
                                placeholder="הערה..."
                                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white print:border-0 print:p-0"
                              />
                            </td>
                            <td className="px-3 py-2 print:px-2">
                              <textarea
                                value={score.rabbi_note ?? ""}
                                onChange={(e) =>
                                  handleNote(score.id, "rabbi_note", e.target.value)
                                }
                                rows={2}
                                placeholder="המשך טיפול..."
                                className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white print:border-0 print:p-0"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              סה"כ {scores.length} בחורים | {groupedArr.length} רכזים
            </div>
          </div>
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
