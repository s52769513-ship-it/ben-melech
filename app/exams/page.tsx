import { createClient } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";
import ExamsTable from "@/components/tables/ExamsTable";

export default async function ExamsPage() {
  const supabase = await createClient();

  const { data: exams } = await supabase
    .from("exams")
    .select("*")
    .order("exam_date", { ascending: false });

  const examIds = (exams ?? []).map((e) => e.id);

  const { data: scores } = await supabase
    .from("scores")
    .select("exam_id, chassidut_score, halacha_score, tefila_score, beinoni_score, shleimut_score")
    .in("exam_id", examIds.length ? examIds : [""]);

  const examStatsMap: Record<
    string,
    { total: number; count: number; participants: number }
  > = {};

  (scores ?? []).forEach((s) => {
    if (!examStatsMap[s.exam_id]) {
      examStatsMap[s.exam_id] = { total: 0, count: 0, participants: 0 };
    }
    const vals = [
      s.chassidut_score,
      s.halacha_score,
      s.tefila_score,
      s.beinoni_score,
      s.shleimut_score,
    ].filter((v): v is number => v !== null);
    if (vals.length) {
      examStatsMap[s.exam_id].total += vals.reduce((a, b) => a + b, 0) / vals.length;
      examStatsMap[s.exam_id].count++;
    }
    examStatsMap[s.exam_id].participants++;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <BookOpen size={28} />
          מבחנים
        </h1>
        <p className="text-gray-500 mt-1">{exams?.length ?? 0} מבחנים</p>
      </div>

      <ExamsTable exams={exams ?? []} examStatsMap={examStatsMap} />
    </div>
  );
}
