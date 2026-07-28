import { Suspense } from "react";
import { TableProperties } from "lucide-react";
import OverviewClient from "./OverviewClient";
import { TableSkeleton } from "@/components/Skeletons";
import { getExams, getAllScores, getStudents } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default function OverviewPage() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <TableProperties size={28} />
          סקירת נוכחות
        </h1>
        <p className="text-gray-500 mt-1">השתתפות בסדר לפי בחור ופרשה</p>
      </div>

      <Suspense fallback={<TableSkeleton rows={12} columns={6} />}>
        <OverviewContent />
      </Suspense>
    </div>
  );
}

async function OverviewContent() {
  const coordinatorId = await getSession();
  const [exams, allScores, students] = await Promise.all([
    getExams(),
    getAllScores(),
    getStudents(),
  ]);

  const visible =
    !coordinatorId || coordinatorId === "ADMIN"
      ? students
      : students.filter((s) => s.coordinator_id === coordinatorId);

  // Collapse the scores into one row per bochur. The grid only asks "was he
  // there for this parasha", so a row per score — with the bochur repeated
  // inside each one — was moving tens of megabytes for no added detail.
  const recorded = new Map<string, string[]>();
  const attended = new Map<string, string[]>();
  for (const score of allScores) {
    if (!score.student_id || !score.exam_id) continue;
    let recordedIds = recorded.get(score.student_id);
    if (!recordedIds) recorded.set(score.student_id, (recordedIds = []));
    recordedIds.push(score.exam_id);

    if (score.attended_seder || score.attended_seder_old) {
      let attendedIds = attended.get(score.student_id);
      if (!attendedIds) attended.set(score.student_id, (attendedIds = []));
      attendedIds.push(score.exam_id);
    }
  }

  const studentRows = visible
    .filter((s) => recorded.has(s.id))
    .map((s) => ({
      id: s.id,
      first_name: s.first_name,
      last_name: s.last_name,
      group_id: s.group_id,
      coordinator: s.coordinator ? { id: s.coordinator.id, name: s.coordinator.name } : null,
      recorded_exam_ids: recorded.get(s.id) ?? [],
      attended_exam_ids: attended.get(s.id) ?? [],
    }));

  const sortedExams = [...exams].sort((a, b) =>
    (a.exam_date ?? "").localeCompare(b.exam_date ?? "")
  );

  return <OverviewClient exams={sortedExams} students={studentRows} />;
}
