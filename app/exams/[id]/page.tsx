import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: exam }, { data: scores }] = await Promise.all([
    supabase.from("exams").select("*").eq("id", id).single(),
    supabase
      .from("scores")
      .select(
        "*, student:students(id, first_name, last_name, coordinator_id, coordinator:coordinators(name))"
      )
      .eq("exam_id", id)
      .order("created_at"),
  ]);

  if (!exam) notFound();

  const totalScores = (scores ?? []).filter(
    (s) =>
      s.chassidut_score !== null ||
      s.halacha_score !== null ||
      s.tefila_score !== null
  );

  const overallAvg =
    totalScores.length > 0
      ? (
          totalScores.reduce((acc, s) => {
            const vals = [s.chassidut_score, s.halacha_score, s.tefila_score].filter(
              (v): v is number => v !== null
            );
            return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
          }, 0) / totalScores.length
        ).toFixed(1)
      : "—";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/exams"
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm mb-4"
        >
          <ArrowRight size={14} />
          חזרה למבחנים
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <BookOpen size={28} />
              {exam.parasha}
            </h1>
            <p className="text-gray-500 mt-1">
              {exam.exam_date
                ? new Date(exam.exam_date).toLocaleDateString("he-IL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "תאריך לא הוגדר"}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-gray-500">ציון ממוצע</p>
            <p className="text-2xl font-bold text-[#1e3a5f]">{overallAvg}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            ציונים ({scores?.length ?? 0} בחורים)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">בחור</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">רכז</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">חסידות</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">הלכה</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">תפילה</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">בינוני</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">שלמות</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">נוכח בסדר</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">בזמן</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">שיעור</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">שילם</th>
                <th className="text-right px-6 py-3.5 font-semibold text-gray-600">ממוצע</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {scores && scores.length > 0 ? (
                scores.map((score) => {
                  const student = score.student as {
                    id: string;
                    first_name: string;
                    last_name: string;
                    coordinator: { name: string } | null;
                  } | null;
                  const vals = [
                    score.chassidut_score,
                    score.halacha_score,
                    score.tefila_score,
                  ].filter((v): v is number => v !== null);
                  const avg =
                    vals.length > 0
                      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                      : "—";

                  const Check = ({ val }: { val: boolean }) =>
                    val ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    );

                  return (
                    <tr key={score.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {student ? (
                          <Link
                            href={`/students/${student.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {student.first_name} {student.last_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {student?.coordinator?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{score.chassidut_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.halacha_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.tefila_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.beinoni_score ?? "—"}</td>
                      <td className="px-6 py-3 text-gray-700">{score.shleimut_score ?? "—"}</td>
                      <td className="px-6 py-3">
                        <Check val={score.attended_seder} />
                      </td>
                      <td className="px-6 py-3">
                        <Check val={score.arrived_on_time} />
                      </td>
                      <td className="px-6 py-3">
                        <Check val={score.attended_class} />
                      </td>
                      <td className="px-6 py-3">
                        <Check val={score.paid} />
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
                  <td colSpan={12} className="px-6 py-16 text-center text-gray-400">
                    אין ציונים למבחן זה
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
