import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BookOpen, ChevronLeft, Calendar, BarChart2 } from "lucide-react";

export default async function ExamsPage() {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: false });

  const examIds = (exams ?? []).map((e) => e.id);

  const { data: scores } = await supabase
    .from("scores")
    .select("exam_id, chassidut_score, halacha_score, tefila_score, beinoni_score, shleimut_score")
    .in("exam_id", examIds.length ? examIds : [""]);

  const examStatsMap: Record<
    string,
    { total: number; count: number; participants: number }
  > = {};

  (scores ?? []).forEach((s) => {
    if (!examStatsMap[s.exam_id]) {
      examStatsMap[s.exam_id] = { total: 0, count: 0, participants: 0 };
    }
    const vals = [
      s.chassidut_score,
      s.halacha_score,
      s.tefila_score,
      s.beinoni_score,
      s.shleimut_score,
    ].filter((v): v is number => v !== null);
    if (vals.length) {
      examStatsMap[s.exam_id].total += vals.reduce((a, b) => a + b, 0) / vals.length;
      examStatsMap[s.exam_id].count++;
    }
    examStatsMap[s.exam_id].participants++;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <BookOpen size={28} />
          מבחנים
        </h1>
        <p className="text-gray-500 mt-1">{exams?.length ?? 0} מבחנים</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">פרשה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">תאריך</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">משתתפים</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שיעור השתתפות</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ציון ממוצע</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams && exams.length > 0 ? (
              exams.map((exam) => {
                const stats = examStatsMap[exam.id];
                const avgScore =
                  stats && stats.count > 0
                    ? (stats.total / stats.count).toFixed(1)
                    : "—";
                const participationRate =
                  exam.participation_rate != null
                    ? `${exam.participation_rate}%`
                    : stats?.participants
                    ? `${stats.participants} בחורים`
                    : "—";

                return (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{exam.parasha}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {exam.exam_date ? (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400" />
                          {new Date(exam.exam_date).toLocaleDateString("he-IL")}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {stats?.participants ?? 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <BarChart2 size={13} className="text-gray-400" />
                        {participationRate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {avgScore !== "—" ? (
                        <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                          {avgScore}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/exams/${exam.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        פרטים
                        <ChevronLeft size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  אין מבחנים במערכת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
