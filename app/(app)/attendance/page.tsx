import { Suspense } from "react";
import AttendanceClient from "./AttendanceClient";
import { ClipboardList } from "lucide-react";
import { TableSkeleton } from "@/components/Skeletons";
import {
  getExams,
  getScoresByExam,
  getScoresByExamForCoordinator,
  getAllScores,
  getAllScoresForCoordinator,
  getScoresWithRelations,
  getScoresWithRelationsForCoordinator,
} from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <ClipboardList size={28} />
          נוכחות וציונים
        </h1>
        <p className="text-gray-500 mt-1">עדכון נוכחות לפי פרשה</p>
      </div>

      <Suspense fallback={<TableSkeleton rows={12} columns={6} />}>
        <AttendanceContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AttendanceContent({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const [{ exam: examId }, coordinatorId] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;

  const exams = await getExams();
  const isAll = examId === "all";
  const selectedExamId = isAll ? "all" : examId ?? exams[0]?.id ?? null;

  const [scores, allAttendance] = await Promise.all([
    isAll
      ? loggedIn
        ? getScoresWithRelationsForCoordinator(loggedIn)
        : getScoresWithRelations()
      : selectedExamId
        ? loggedIn
          ? getScoresByExamForCoordinator(selectedExamId, loggedIn)
          : getScoresByExam(selectedExamId)
        : Promise.resolve([]),
    loggedIn ? getAllScoresForCoordinator(loggedIn) : getAllScores(),
  ]);

  const attendanceMap: Record<string, { attended: number; total: number }> = {};

  allAttendance.forEach((row) => {
    if (!row.student_id) return;
    if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = { attended: 0, total: 0 };
    attendanceMap[row.student_id].total++;
    if (row.attended_seder || row.attended_seder_old) attendanceMap[row.student_id].attended++;
  });

  const attendanceRates: Record<string, number> = {};
  Object.entries(attendanceMap).forEach(([id, { attended, total }]) => {
    attendanceRates[id] = total > 0 ? Math.round((attended / total) * 100) : 0;
  });

  // Flat rows + one entry per bochur, instead of the bochur repeated inside
  // every score.
  const rows = scores.map((s) => ({
    id: s.id,
    student_id: s.student_id,
    exam_id: s.exam_id,
    arrived_on_time: s.arrived_on_time,
    attended_seder: s.attended_seder,
    attended_class: s.attended_class,
    weekly_summary: s.weekly_summary,
    paid: s.paid,
    chassidut_score: s.chassidut_score,
    halacha_score: s.halacha_score,
    tefila_score: s.tefila_score,
    points_kaitz: s.points_kaitz,
  }));

  const students: Record<string, {
    id: string;
    first_name: string;
    last_name: string;
    city: string | null;
    coordinator_id: string | null;
    group_id: string | null;
    coordinator: { id: string; name: string } | null;
  }> = {};
  for (const score of scores) {
    const student = score.student;
    if (!student || students[student.id]) continue;
    students[student.id] = {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      city: student.city,
      coordinator_id: student.coordinator_id,
      group_id: student.group_id,
      coordinator: student.coordinator
        ? { id: student.coordinator.id, name: student.coordinator.name }
        : null,
    };
  }

  return (
    <AttendanceClient
      exams={exams}
      scores={rows}
      students={students}
      selectedExamId={selectedExamId}
      attendanceRates={attendanceRates}
    />
  );
}
