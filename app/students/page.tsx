import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GraduationCap, ChevronLeft } from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ coordinator?: string; city?: string; yeshiva?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("*, coordinator:coordinators(id, name)")
    .order("first_name");

  if (filters.coordinator) query = query.eq("coordinator_id", filters.coordinator);
  if (filters.city) query = query.eq("city", filters.city);
  if (filters.yeshiva) query = query.ilike("yeshiva", `%${filters.yeshiva}%`);

  const { data: students } = await query;

  const [{ data: coordinators }, { data: allScores }] = await Promise.all([
    supabase.from("coordinators").select("id, name").order("name"),
    supabase
      .from("scores")
      .select("student_id, chassidut_score, halacha_score, tefila_score, attended_seder"),
  ]);

  const scoreMap: Record<
    string,
    { total: number; count: number; attended: number; sessions: number }
  > = {};
  (allScores ?? []).forEach((s) => {
    if (!scoreMap[s.student_id]) {
      scoreMap[s.student_id] = { total: 0, count: 0, attended: 0, sessions: 0 };
    }
    const avg = [s.chassidut_score, s.halacha_score, s.tefila_score]
      .filter((v): v is number => v !== null);
    if (avg.length) {
      scoreMap[s.student_id].total += avg.reduce((a, b) => a + b, 0) / avg.length;
      scoreMap[s.student_id].count++;
    }
    scoreMap[s.student_id].sessions++;
    if (s.attended_seder) scoreMap[s.student_id].attended++;
  });

  const cities = [...new Set((students ?? []).map((s) => s.city).filter(Boolean))].sort();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <GraduationCap size={28} />
          בחורים
        </h1>
        <p className="text-gray-500 mt-1">{students?.length ?? 0} בחורים</p>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">סינון לפי רכז</label>
          <select
            name="coordinator"
            defaultValue={filters.coordinator ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל הרכזים</option>
            {(coordinators ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">סינון לפי עיר</label>
          <select
            name="city"
            defaultValue={filters.city ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל הערים</option>
            {cities.map((city) => (
              <option key={city} value={city!}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">חיפוש לפי ישיבה</label>
          <input
            name="yeshiva"
            defaultValue={filters.yeshiva ?? ""}
            placeholder="שם ישיבה..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <button
          type="submit"
          className="bg-[#1e3a5f] text-white text-sm px-5 py-2 rounded-lg hover:bg-[#2d4f7f] transition-colors"
        >
          סנן
        </button>
        {(filters.coordinator || filters.city || filters.yeshiva) && (
          <Link
            href="/students"
            className="text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            נקה סינון
          </Link>
        )}
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שם</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">רכז</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">עיר</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ישיבה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">מסלול</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">נוכחות</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ציון ממוצע</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students && students.length > 0 ? (
              students.map((student) => {
                const stats = scoreMap[student.id];
                const avgScore = stats && stats.count > 0
                  ? (stats.total / stats.count).toFixed(1)
                  : "—";
                const attendance =
                  stats && stats.sessions > 0
                    ? Math.round((stats.attended / stats.sessions) * 100) + "%"
                    : "—";
                const coordinator = student.coordinator as { name: string } | null;
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coordinator ? (
                        <Link
                          href={`/coordinators/${student.coordinator_id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {coordinator.name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.city ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{student.yeshiva ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{student.track ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{attendance}</td>
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
                        href={`/students/${student.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        פרופיל
                        <ChevronLeft size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-400">
                  אין בחורים להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
