import { createClient } from "@/lib/supabase/server";
import ManagementClient from "./ManagementClient";
import { Settings } from "lucide-react";

export default async function ManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ exam?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("id, parasha, exam_date")
    .order("exam_date", { ascending: false });

  const { data: coordinators } = await supabase
    .from("coordinators")
    .select("id, name")
    .order("name");

  const sortedExams = exams ?? [];
  const selectedExamId = params.exam ?? sortedExams[0]?.id ?? null;
  const activeTab = params.tab ?? "sichot";

  const [scoresResult, notesResult] = await Promise.all([
    selectedExamId
      ? supabase
          .from("scores")
          .select(
            "id, student_id, chassidut_score, halacha_score, tefila_score, beinoni_score, shleimut_score, attended_seder, arrived_on_time, attended_class, weekly_summary, attended_seder_old, arrived_on_time_old, paid, payment_amount, personal_note, rabbi_note, student:students(id, first_name, last_name, coordinator:coordinators(id, name))"
          )
          .eq("exam_id", selectedExamId)
          .order("created_at")
      : Promise.resolve({ data: [] }),
    selectedExamId
      ? supabase
          .from("coordinator_exam_notes")
          .select("id, coordinator_id, sicha_beinyan, maskana, hemshech_tipul")
          .eq("exam_id", selectedExamId)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 print:hidden">
        <Settings size={22} className="text-[#1e3a5f]" />
        <h1 className="text-xl font-bold text-[#1e3a5f]">ניהול</h1>
      </div>

      <div className="flex-1 overflow-hidden">
        <ManagementClient
          exams={sortedExams}
          coordinators={coordinators ?? []}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          scores={(scoresResult.data ?? []) as any}
          examNotes={notesResult.data ?? []}
          selectedExamId={selectedExamId}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
}
