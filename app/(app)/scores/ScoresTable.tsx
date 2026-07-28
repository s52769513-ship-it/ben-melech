"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSettings } from "@/lib/settings-context";

// Flat rows plus a lookup per bochur/parasha. Nesting the bochur inside every
// score meant his name, coordinator and exam were re-serialized once per row —
// on a full-year view that alone was tens of megabytes.
type ScoreRow = {
  id: string;
  student_id: string;
  exam_id: string;
  chassidut_score: number | null;
  halacha_score: number | null;
  tefila_score: number | null;
  beinoni_score: number | null;
  shleimut_score: number | null;
  attended_seder: boolean;
  paid: boolean;
};

type StudentInfo = {
  name: string;
  coordinator_id: string | null;
  coordinator_name: string | null;
  group_id: string | null;
};

const PAGE_SIZE = 100;

export default function ScoresTable({
  rows,
  students,
  parashot,
}: {
  rows: ScoreRow[];
  students: Record<string, StudentInfo>;
  parashot: Record<string, string>;
}) {
  const { isStudentVisible } = useSettings();
  const [page, setPage] = useState(0);

  const visibleScores = useMemo(
    () =>
      rows.filter((s) => {
        const student = students[s.student_id];
        return isStudentVisible({
          coordinator_id: student?.coordinator_id,
          group_id: student?.group_id,
        });
      }),
    [rows, students, isStudentVisible]
  );

  const overallAvg =
    visibleScores.length > 0
      ? (
          visibleScores.reduce((acc, s) => {
            const vals = [s.chassidut_score, s.halacha_score, s.tefila_score].filter(
              (v): v is number => v !== null
            );
            return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
          }, 0) / visibleScores.length
        ).toFixed(1)
      : "—";

  const pageCount = Math.ceil(visibleScores.length / PAGE_SIZE);
  const current = Math.min(page, Math.max(pageCount - 1, 0));
  const pageRows = visibleScores.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <p className="text-gray-500 mb-6 text-sm">
        {visibleScores.length} ציונים | ממוצע: {overallAvg}
      </p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">בחור</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">משפיע</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">פרשה</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">חסידות</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">הלכה</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">תפילה</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">בינוני</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">שלמות</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">נוכח</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">שילם</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">ממוצע</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.length > 0 ? (
                pageRows.map((score) => {
                  const student = students[score.student_id];
                  const parasha = parashot[score.exam_id];
                  const vals = [score.chassidut_score, score.halacha_score, score.tefila_score].filter(
                    (v): v is number => v !== null
                  );
                  const avg =
                    vals.length > 0
                      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                      : "—";
                  return (
                    <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {student ? (
                          <Link href={`/students/${score.student_id}`} className="text-blue-600 hover:underline">
                            {student.name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {student?.coordinator_name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {parasha ? (
                          <Link href={`/exams/${score.exam_id}`} className="text-blue-600 hover:underline">
                            {parasha}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{score.chassidut_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.halacha_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.tefila_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.beinoni_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.shleimut_score ?? "—"}</td>
                      <td className="px-6 py-3">
                        {score.attended_seder ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {score.paid ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {avg !== "—" ? (
                          <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                            {avg}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-16 text-center text-gray-400">
                    אין ציונים להצגה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm">
            <span className="text-gray-500">
              מציג {current * PAGE_SIZE + 1}–
              {Math.min((current + 1) * PAGE_SIZE, visibleScores.length)} מתוך{" "}
              {visibleScores.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={14} />
                הקודם
              </button>
              <span className="text-gray-400 text-xs">
                {current + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount - 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              >
                הבא
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
