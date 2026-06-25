import Link from "next/link";
import { Star } from "lucide-react";
import { getScoresWithRelations, getScoresWithRelationsForCoordinator, getExams, getCoordinators } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ScoresTable from "./ScoresTable";
import CoordinatorSelect from "@/components/CoordinatorSelect";

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; coordinator?: string }>;
}) {
  const [filters, coordinatorId] = await Promise.all([searchParams, getSession()]);
  const isAdmin = coordinatorId === "ADMIN";
  const loggedInCoordinator = isAdmin ? null : coordinatorId;

  const [allScores, exams, coordinators] = await Promise.all([
    loggedInCoordinator
      ? getScoresWithRelationsForCoordinator(loggedInCoordinator)
      : getScoresWithRelations(),
    getExams(),
    getCoordinators(),
  ]);

  // Filter by exam in memory
  const examFiltered = filters.exam
    ? allScores.filter((s) => s.exam_id === filters.exam)
    : allScores;

  // Admin can filter by coordinator via query param
  const coordFilter = isAdmin ? filters.coordinator : null;
  const filteredScores = coordFilter
    ? examFiltered.filter((s) => s.student?.coordinator_id === coordFilter)
    : examFiltered;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Star size={28} />
          ציונים
        </h1>
      </div>

      <form className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">סינון לפי מבחן</label>
          <select
            name="exam"
            defaultValue={filters.exam ?? ""}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">כל הפרשות</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.parasha}
                {e.exam_date ? ` — ${new Date(e.exam_date).toLocaleDateString("he-IL")}` : ""}
              </option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">סינון לפי משפיע</label>
            <CoordinatorSelect coordinators={coordinators} defaultValue={filters.coordinator} />
          </div>
        )}
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

      <ScoresTable scores={filteredScores as any[]} />
    </div>
  );
}
