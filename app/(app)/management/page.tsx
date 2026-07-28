import { Suspense } from "react";
import { connection } from "next/server";
import ManagementClient from "./ManagementClient";
import { Settings } from "lucide-react";
import { BlockSkeleton } from "@/components/Skeletons";
import { getExams, getCoordinators, getScoresByExam, getExamNotesByExam } from "@/lib/airtable/db";

export default function ManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; tab?: string }>;
}) {
  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 print:hidden">
        <Settings size={22} className="text-[#1e3a5f]" />
        <h1 className="text-xl font-bold text-[#1e3a5f]">ניהול</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-6"><BlockSkeleton className="h-96" /></div>}>
          <ManagementContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function ManagementContent({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; tab?: string }>;
}) {
  // Nothing here is user-specific, but it still belongs to the request rather
  // than the build — the Airtable reads behind it are cached and shared.
  await connection();
  const params = await searchParams;

  const [exams, coordinators] = await Promise.all([getExams(), getCoordinators()]);

  const selectedExamId = params.exam ?? exams[0]?.id ?? null;
  const activeTab = params.tab ?? "sichot";

  const [scores, examNotes] = await Promise.all([
    selectedExamId ? getScoresByExam(selectedExamId) : Promise.resolve([]),
    selectedExamId ? getExamNotesByExam(selectedExamId) : Promise.resolve([]),
  ]);

  // Flat rows + one entry per bochur, rather than the bochur nested in each row.
  const rows = scores.map((s) => ({
    id: s.id,
    student_id: s.student_id,
    chassidut_score: s.chassidut_score,
    halacha_score: s.halacha_score,
    tefila_score: s.tefila_score,
    beinoni_score: s.beinoni_score,
    shleimut_score: s.shleimut_score,
    attended_seder: s.attended_seder,
    arrived_on_time: s.arrived_on_time,
    attended_class: s.attended_class,
    weekly_summary: s.weekly_summary,
    paid: s.paid,
    payment_amount: s.payment_amount,
    personal_note: s.personal_note,
    rabbi_note: s.rabbi_note,
  }));

  const students: Record<
    string,
    { id: string; first_name: string; last_name: string; coordinator: { id: string; name: string } | null }
  > = {};
  for (const score of scores) {
    const student = score.student;
    if (!student || students[student.id]) continue;
    students[student.id] = {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      coordinator: student.coordinator
        ? { id: student.coordinator.id, name: student.coordinator.name }
        : null,
    };
  }

  // Notes are keyed by coordinator, so a note without one has nothing to attach to.
  const coordinatorNotes = examNotes
    .filter((n): n is typeof n & { coordinator_id: string } => n.coordinator_id !== null)
    .map((n) => ({
      id: n.id,
      coordinator_id: n.coordinator_id,
      sicha_beinyan: n.sicha_beinyan,
      maskana: n.maskana,
      hemshech_tipul: n.hemshech_tipul,
    }));

  return (
    <ManagementClient
      exams={exams}
      coordinators={coordinators}
      scores={rows}
      students={students}
      examNotes={coordinatorNotes}
      selectedExamId={selectedExamId}
      activeTab={activeTab}
    />
  );
}
