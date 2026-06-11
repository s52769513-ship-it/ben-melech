"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSettings } from "@/lib/settings-context";

type Score = {
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
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    coordinator_id?: string | null;
    group_id?: string | null;
    coordinator?: { id: string; name: string } | null;
  } | null;
  exam?: { id: string; parasha: string } | null;
};

export default function ScoresTable({ scores }: { scores: Score[] }) {
  const { isStudentVisible } = useSettings();

  const visibleScores = useMemo(
    () => scores.filter((s) => isStudentVisible({ coordinator_id: s.student?.coordinator_id, group_id: s.student?.group_id })),
    [scores, isStudentVisible]
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
              {visibleScores.length > 0 ? (
                visibleScores.map((score) => {
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
                        {score.student ? (
                          <Link href={`/students/${score.student.id}`} className="text-blue-600 hover:underline">
                            {score.student.first_name} {score.student.last_name}
                          </Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {score.student?.coordinator?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {score.exam ? (
                          <Link href={`/exams/${score.exam.id}`} className="text-blue-600 hover:underline">
                            {score.exam.parasha}
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
      </div>
    </>
  );
}
