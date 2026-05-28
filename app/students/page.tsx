import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import StudentsTable from "@/components/tables/StudentsTable";

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
    const avg = [s.chassidut_score, s.halacha_score, s.tefila_score].filter(
      (v): v is number => v !== null
    );
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
          <label className="text-xs font-medium text-gray-500">סינון לפי משפיע</label>
          <select
            name="coordinator"
            defaultValue={filters.coordinator ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל המשפיעים</option>
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
          <Link href="/students" className="text-sm text-gray-500 hover:text-gray-700 py-2">
            נקה סינון
          </Link>
        )}
      </form>

      <StudentsTable
        students={students ?? []}
        coordinators={coordinators ?? []}
        scoreMap={scoreMap}
      />
    </div>
  );
}
