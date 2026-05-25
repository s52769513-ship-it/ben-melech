import { createClient } from "@/lib/supabase/server";
import AttendanceClient from "./AttendanceClient";
import { ClipboardList } from "lucide-react";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string }>;
}) {
  const { exam: examId } = await searchParams;
  const supabase = await createClient();

  // Fetch exams sorted newest first
  const { data: exams } = await supabase
    .from("exams")
    .select("id, parasha, exam_date")
    .order("exam_date", { ascending: false });

  const selectedExamId = examId ?? exams?.[0]?.id ?? null;

  // Fetch scores for the selected exam with full student + coordinator info
  const { data: scores } = selectedExamId
    ? await supabase
        .from("scores")
        .select(
          "id, student_id, exam_id, arrived_on_time, attended_seder, attended_class, weekly_summary, paid, chassidut_score, halacha_score, tefila_score, student:students(id, first_name, last_name, city, coordinator:coordinators(id, name))"
        )
        .eq("exam_id", selectedExamId)
    : { data: [] };

  // Fetch all-time attendance for color coding (only student_id + attended_seder)
  const { data: allAttendance } = await supabase
    .from("scores")
    .select("student_id, attended_seder");

  // Aggregate per student
  const attendanceMap: Record<string, { attended: number; total: number }> = {};
  (allAttendance ?? []).forEach((row) => {
    if (!row.student_id) return;
    if (!attendanceMap[row.student_id]) attendanceMap[row.student_id] = { attended: 0, total: 0 };
    attendanceMap[row.student_id].total++;
    if (row.attended_seder) attendanceMap[row.student_id].attended++;
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
        exams={exams ?? []}
        scores={(scores ?? []) as any[]}
        selectedExamId={selectedExamId}
        attendanceRates={attendanceRates}
      />
    </div>
  );
}
