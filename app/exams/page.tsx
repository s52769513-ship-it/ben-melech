import Link from "next/link";
import { BookOpen, ArrowRight, Calendar, Sun, Snowflake } from "lucide-react";
import ExamsTable from "@/components/tables/ExamsTable";
import { getExams, getZmanim, getAllScores, getAllScoresForCoordinator } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default async function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ zman?: string }>;
}) {
  const [{ zman: selectedZmanId }, coordinatorId] = await Promise.all([
    searchParams,
    getSession().catch(() => null),
  ]);

  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;

  const [exams, zmanim, scores] = await Promise.all([
    getExams(),
    getZmanim(),
    loggedIn ? getAllScoresForCoordinator(loggedIn) : getAllScores(),
  ]);

  const examStatsMap: Record<string, { total: number; count: number; participants: number }> = {};
  scores.forEach((s) => {
    if (!examStatsMap[s.exam_id]) {
      examStatsMap[s.exam_id] = { total: 0, count: 0, participants: 0 };
    }
    const vals = [s.chassidut_score, s.halacha_score, s.tefila_score, s.beinoni_score, s.shleimut_score].filter(
      (v): v is number => v !== null
    );
    if (vals.length) {
      examStatsMap[s.exam_id].total += vals.reduce((a, b) => a + b, 0) / vals.length;
      examStatsMap[s.exam_id].count++;
    }
    examStatsMap[s.exam_id].participants++;
  });

  const selectedZman = zmanim.find((z) => z.id === selectedZmanId);
  const zmanExams = selectedZman
    ? exams.filter((e) => selectedZman.exam_ids.includes(e.id))
    : [];

  // ── Parshiyot view (zman selected) ───────────────────────────────────────
  if (selectedZman) {
    const isSummer = selectedZman.season === "קיץ";
    return (
      <div className="p-8">
        <div className="mb-8">
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm mb-5 transition-colors"
          >
            <ArrowRight size={14} />
            חזרה לזמנים
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isSummer ? "bg-orange-100" : "bg-blue-100"
              }`}
            >
              {isSummer ? (
                <Sun size={20} className="text-orange-500" />
              ) : (
                <Snowflake size={20} className="text-blue-500" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1e3a5f]">{selectedZman.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">{zmanExams.length} פרשות</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {zmanExams.map((exam) => {
            const stats = examStatsMap[exam.id];
            const avgScore =
              stats && stats.count > 0
                ? (stats.total / stats.count).toFixed(1)
                : null;
            return (
              <Link
                key={exam.id}
                href={`/exams/${exam.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#1e3a5f] transition-colors leading-tight">
                    {exam.parasha}
                  </h3>
                  {avgScore && (
                    <span className="bg-blue-50 text-blue-700 font-bold text-sm px-2.5 py-0.5 rounded-full shrink-0 mr-2">
                      {avgScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {exam.exam_date
                      ? new Date(exam.exam_date).toLocaleDateString("he-IL")
                      : "תאריך לא הוגדר"}
                  </span>
                  {stats && (
                    <span>{stats.participants} בחורים</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Zman buttons view (no zman selected) ─────────────────────────────────
  return (
    <div className="p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <BookOpen size={28} />
          מבחנים
        </h1>
        <p className="text-gray-500 mt-1">בחר זמן לצפייה בפרשות</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        {zmanim.map((zman) => {
          const isSummer = zman.season === "קיץ";
          return (
            <Link
              key={zman.id}
              href={`/exams?zman=${zman.id}`}
              className={`relative group rounded-2xl p-8 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl border-2 ${
                isSummer
                  ? "bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:border-orange-400"
                  : "bg-gradient-to-br from-blue-50 to-sky-100 border-blue-200 hover:border-blue-400"
              }`}
            >
              <div
                className={`absolute top-4 left-4 w-14 h-14 rounded-full flex items-center justify-center opacity-20 ${
                  isSummer ? "bg-orange-400" : "bg-blue-400"
                }`}
              />
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                    isSummer ? "bg-orange-100" : "bg-blue-100"
                  }`}
                >
                  {isSummer ? (
                    <Sun size={30} className="text-orange-500" />
                  ) : (
                    <Snowflake size={30} className="text-blue-500" />
                  )}
                </div>
                <div>
                  <div
                    className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
                      isSummer ? "text-orange-400" : "text-blue-400"
                    }`}
                  >
                    {zman.season ?? ""}
                  </div>
                  <h2
                    className={`text-2xl font-bold ${
                      isSummer ? "text-orange-900" : "text-blue-900"
                    }`}
                  >
                    {zman.name}
                  </h2>
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  isSummer ? "text-orange-700" : "text-blue-700"
                }`}
              >
                <BookOpen size={14} />
                <span>{zman.exam_ids.length} פרשות</span>
                <ArrowRight size={14} className="mr-auto group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
