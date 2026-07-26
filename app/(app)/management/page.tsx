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

  return (
    <ManagementClient
      exams={exams}
      coordinators={coordinators}
      scores={scores as any}
      examNotes={examNotes as any}
      selectedExamId={selectedExamId}
      activeTab={activeTab}
    />
  );
}
