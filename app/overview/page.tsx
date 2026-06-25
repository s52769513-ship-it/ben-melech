import { TableProperties } from "lucide-react";
import OverviewClient from "./OverviewClient";
import { getExams, getAllScores, getStudents, getCoordinators } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Student, Coordinator } from "@/lib/types";


export default async function OverviewPage() {
  const [exams, allScores, students, coordinators, coordinatorId] = await Promise.all([
    getExams(),
    getAllScores(),
    getStudents(),
    getCoordinators(),
    getSession(),
  ]);

  const coordinatorMap = new Map<string, Coordinator>(coordinators.map((c) => [c.id, c]));
  const studentMap = new Map<string, Student>(students.map((s) => [s.id, s]));

  const scoresWithRelations = allScores
    .filter((s) => {
      if (!coordinatorId || coordinatorId === "ADMIN") return true;
      const st = studentMap.get(s.student_id);
      return st?.coordinator_id === coordinatorId;
    })
    .map((s) => {
      const student = studentMap.get(s.student_id);
      return {
        ...s,
        student: student
          ? {
              ...student,
              coordinator: student.coordinator_id
                ? coordinatorMap.get(student.coordinator_id) ?? null
                : null,
            }
          : undefined,
      };
    });

  const sortedExams = [...exams].sort((a, b) =>
    (a.exam_date ?? "").localeCompare(b.exam_date ?? "")
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <TableProperties size={28} />
          סקירת נוכחות
        </h1>
        <p className="text-gray-500 mt-1">השתתפות בסדר לפי בחור ופרשה</p>
      </div>
      <OverviewClient
        exams={sortedExams}
        scores={scoresWithRelations as any[]}
      />
    </div>
  );
}
