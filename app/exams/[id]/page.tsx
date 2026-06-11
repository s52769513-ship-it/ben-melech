import Link from "next/link";
import { ArrowRight, BookOpen, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { getExam, getScoresByExam, getScoresByExamForCoordinator, getZmanim } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";
import ExamScoresClient from "./ExamScoresClient";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const coordinatorId = await getSession();
  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;
  const [exam, scores, zmanim] = await Promise.all([
    getExam(id),
    loggedIn ? getScoresByExamForCoordinator(id, loggedIn) : getScoresByExam(id),
    getZmanim(),
  ]);
  const zman = exam?.zman_id ? zmanim.find((z) => z.id === exam.zman_id) ?? null : null;
  const season = zman?.season ?? null;

  if (!exam) notFound();
  const safeExam = exam as NonNullable<typeof exam>;

  const scoredCount = scores.filter(
    (s) => s.chassidut_score !== null || s.halacha_score !== null || s.tefila_score !== null
  );

  const overallAvg =
    scoredCount.length > 0
      ? (
          scoredCount.reduce((acc, s) => {
            const vals = [s.chassidut_score, s.halacha_score, s.tefila_score].filter(
              (v): v is number => v !== null
            );
            return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
          }, 0) / scoredCount.length
        ).toFixed(1)
      : "—";

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href={zman ? `/exams?zman=${zman.id}` : "/exams"}
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm mb-4"
        >
          <ArrowRight size={14} />
          {zman ? `חזרה ל${zman.name}` : "חזרה למבחנים"}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <BookOpen size={28} />
              {safeExam.parasha}
            </h1>
            <p className="text-gray-500 mt-1">
              {safeExam.exam_date
                ? new Date(safeExam.exam_date).toLocaleDateString("he-IL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "תאריך לא הוגדר"}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500">בחורים</p>
              <p className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-1 justify-center">
                <Users size={18} />
                {scores.length}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-500">ציון ממוצע</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{overallAvg}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">
            ציונים ({scores.length} בחורים)
          </h2>
          <p className="text-xs text-gray-400">לחץ על ציון לעריכה • לחץ על ✓/✗ לשינוי</p>
        </div>
        <ExamScoresClient scores={scores as any} examId={id} season={season} />
      </div>
    </div>
  );
}
