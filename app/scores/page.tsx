import Link from "next/link";
import { Star } from "lucide-react";
import { getScoresWithRelations, getExams, getCoordinators } from "@/lib/airtable/db";

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; coordinator?: string }>;
}) {
  const filters = await searchParams;

  const [scores, exams, coordinators] = await Promise.all([
    getScoresWithRelations(filters.exam),
    getExams(),
    getCoordinators(),
  ]);

  const filteredScores = filters.coordinator
    ? scores.filter((s) => s.student?.coordinator_id === filters.coordinator)
    : scores;

  const overallAvg =
    filteredScores.length > 0
      ? (
          filteredScores.reduce((acc, s) => {
            const vals = [s.chassidut_score, s.halacha_score, s.tefila_score].filter(
              (v): v is number => v !== null
            );
            return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
          }, 0) / filteredScores.length
        ).toFixed(1)
      : "—";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Star size={28} />
          ציונים
        </h1>
        <p className="text-gray-500 mt-1">
          {filteredScores.length} ציונים | ממוצע: {overallAvg}
        </p>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">סינון לפי מבחן</label>
          <select
            name="exam"
            defaultValue={filters.exam ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל המבחנים</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.parasha}
                {e.exam_date ? ` — ${new Date(e.exam_date).toLocaleDateString("he-IL")}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">סינון לפי משפיע</label>
          <select
            name="coordinator"
            defaultValue={filters.coordinator ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל המשפיעים</option>
            {coordinators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-[#1e3a5f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#2d4f7f] transition-colors"
        >
          סנן
        </button>
        {(filters.exam || filters.coordinator) && (
          <Link href="/scores" className="text-sm text-gray-500 hover:text-gray-700 py-2">
            נקה סינון
          </Link>
        )}
      </form>

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
              {filteredScores.length > 0 ? (
                filteredScores.map((score) => {
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
                          <Link
                            href={`/students/${score.student.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {score.student.first_name} {score.student.last_name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {score.student?.coordinator?.name ?? "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {score.exam ? (
                          <Link
                            href={`/exams/${score.exam.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {score.exam.parasha}
                          </Link>
                        ) : (
                          "—"
                        )}
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
    </div>
  );
}
