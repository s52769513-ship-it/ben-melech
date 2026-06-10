import AttendanceClient from "./AttendanceClient";
import { ClipboardList } from "lucide-react";
import { getExams, getScoresByExam, getAllScores } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const [{ exam: examId }, coordinatorId] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const exams = await getExams();
  const selectedExamId = examId ?? exams[0]?.id ?? null;

  const [scores, allAttendance] = await Promise.all([
    selectedExamId ? getScoresByExam(selectedExamId) : Promise.resolve([]),
    getAllScores(),
  ]);

  const filteredScores = coordinatorId
    ? scores.filter((s) => s.student?.coordinator_id === coordinatorId)
    : scores;

  const attendanceMap: Record<string, { attended: number; total: number }> = {};
  const attendanceSrc = coordinatorId
    ? allAttendance.filter((s) => {
        return true;
      })
    : allAttendance;

  attendanceSrc.forEach((row) => {
    if (!row.student_id) return;
    if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = { attended: 0, total: 0 };
    attendanceMap[row.student_id].total++;
    if (row.attended_seder || row.attended_seder_old) attendanceMap[row.student_id].attended++;
  });

  const attendanceRates: Record<string, number> = {};
  Object.entries(attendanceMap).forEach(([id, { attended, total }]) => {
    attendanceRates[id] = total > 0 ? Math.round((attended / total) * 100) : 0;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <ClipboardList size={28} />
          נוכחות וציונים
        </h1>
        <p className="text-gray-500 mt-1">עדכון נוכחות לפי פרשה</p>
      </div>

      <AttendanceClient
        exams={exams}
        scores={filteredScores as any[]}
        selectedExamId={selectedExamId}
        attendanceRates={attendanceRates}
      />
    </div>
  );
}
