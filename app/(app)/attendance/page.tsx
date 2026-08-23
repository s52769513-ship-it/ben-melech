import { Suspense } from "react";
import AttendanceClient from "./AttendanceClient";
import { ClipboardList } from "lucide-react";
import { TableSkeleton } from "@/components/Skeletons";
import {
  getExams,
  getScoresByExam,
  getScoresByExamForCoordinator,
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

  // One parasha at a time reads only that parasha's rows.
  const scores = isAll
    ? loggedIn
      ? await getScoresWithRelationsForCoordinator(loggedIn)
      : await getScoresWithRelations()
    : selectedExamId
      ? loggedIn
        ? await getScoresByExamForCoordinator(selectedExamId, loggedIn)
        : await getScoresByExam(selectedExamId)
      : [];

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
    manual_points: s.manual_points,
  }));

  const students: Record<string, {
    id: string;
    first_name: string;
    last_name: string;
    city: string | null;
    coordinator_id: string | null;
    group_id: string | null;
    coordinator: { id: string; name: string } | null;
    attendance_rate: number | null;
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
      attendance_rate: student.total_exams
        ? Math.round(((student.total_sedarim ?? 0) / student.total_exams) * 100)
        : null,
    };
  }

  return (
    <AttendanceClient
      exams={exams}
      scores={rows}
      students={students}
      selectedExamId={selectedExamId}
    />
  );
}
