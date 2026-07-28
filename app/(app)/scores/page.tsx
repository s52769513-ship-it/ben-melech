import Link from "next/link";
import { Suspense } from "react";
import { Star } from "lucide-react";
import { getScoresWithRelations, getScoresWithRelationsForCoordinator, getExams, getCoordinators } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";
import ScoresTable from "./ScoresTable";
import CoordinatorSelect from "@/components/CoordinatorSelect";
import { FiltersSkeleton, TableSkeleton } from "@/components/Skeletons";

type Filters = { exam?: string; coordinator?: string };

export default function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Star size={28} />
          ציונים
        </h1>
      </div>

      <Suspense
        fallback={
          <>
            <FiltersSkeleton />
            <TableSkeleton rows={10} columns={6} />
          </>
        }
      >
        <ScoresContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ScoresContent({ searchParams }: { searchParams: Promise<Filters> }) {
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

  // Send flat rows plus one entry per bochur/parasha instead of repeating the
  // whole bochur inside every score.
  const rows = filteredScores.map((s) => ({
    id: s.id,
    student_id: s.student_id,
    exam_id: s.exam_id,
    chassidut_score: s.chassidut_score,
    halacha_score: s.halacha_score,
    tefila_score: s.tefila_score,
    beinoni_score: s.beinoni_score,
    shleimut_score: s.shleimut_score,
    attended_seder: s.attended_seder,
    paid: s.paid,
  }));

  const studentInfo: Record<
    string,
    { name: string; coordinator_id: string | null; coordinator_name: string | null; group_id: string | null }
  > = {};
  for (const score of filteredScores) {
    const student = score.student;
    if (!student || studentInfo[student.id]) continue;
    studentInfo[student.id] = {
      name: `${student.first_name} ${student.last_name}`,
      coordinator_id: student.coordinator_id,
      coordinator_name: student.coordinator?.name ?? null,
      group_id: student.group_id,
    };
  }

  const parashot: Record<string, string> = {};
  for (const exam of exams) parashot[exam.id] = exam.parasha;

  return (
    <>
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

      <ScoresTable rows={rows} students={studentInfo} parashot={parashot} />
    </>
  );
}
