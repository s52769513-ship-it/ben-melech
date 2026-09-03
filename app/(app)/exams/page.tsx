import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, ArrowRight, Calendar, Sun, Snowflake } from "lucide-react";
import { CardsSkeleton } from "@/components/Skeletons";
import { attachNewExamsToCurrentZman, examsOfZman } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";
import NewZmanButton from "./NewZmanButton";

export default function ExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ zman?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
              <BookOpen size={28} />
              מבחנים
            </h1>
            <p className="text-gray-500 mt-1">טוען…</p>
          </div>
          <CardsSkeleton count={3} />
        </div>
      }
    >
      <ExamsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ExamsContent({
  searchParams,
}: {
  searchParams: Promise<{ zman?: string }>;
}) {
  const { zman: selectedZmanId } = await searchParams;
  await getSession().catch(() => null);

  // Only the exams table. Participation comes from the parasha's own field in
  // Airtable; the grades for a parasha live on its own screen, which reads just
  // that parasha's rows. Parshiyot created since the current zman was opened
  // are attached to it on the way in.
  const { exams, zmanim } = await attachNewExamsToCurrentZman();

  const isAll = selectedZmanId === "all";
  const selectedZman = zmanim.find((z) => z.id === selectedZmanId);
  const zmanExams = isAll ? exams : selectedZman ? examsOfZman(exams, selectedZman) : [];

  // ── All parshiyot view ────────────────────────────────────────────────────
  if (isAll) {
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
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
              <BookOpen size={20} className="text-gray-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1e3a5f]">כל הפרשות</h1>
              <p className="text-gray-500 text-sm mt-0.5">{exams.length} פרשות</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {exams.map((exam) => {
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
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString("he-IL") : "תאריך לא הוגדר"}
                  </span>
                  {exam.participation_rate != null && (
                    <span>{exam.participation_rate}% השתתפות</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

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
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    {exam.exam_date
                      ? new Date(exam.exam_date).toLocaleDateString("he-IL")
                      : "תאריך לא הוגדר"}
                  </span>
                  {exam.participation_rate != null && (
                    <span>{exam.participation_rate}% השתתפות</span>
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
      <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <BookOpen size={28} />
            מבחנים
          </h1>
          <p className="text-gray-500 mt-1">בחר זמן לצפייה בפרשות</p>
        </div>
        <NewZmanButton />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
        <Link
          href="/exams?zman=all"
          className="relative group rounded-2xl p-8 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl border-2 bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 hover:border-gray-400"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm bg-gray-100">
              <BookOpen size={30} className="text-gray-500" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1 text-gray-400">הכל</div>
              <h2 className="text-2xl font-bold text-gray-800">כל הפרשות</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
            <BookOpen size={14} />
            <span>{exams.length} פרשות</span>
            <ArrowRight size={14} className="mr-auto group-hover:translate-x-[-4px] transition-transform" />
          </div>
        </Link>
        {zmanim.map((zman) => {
          const isSummer = zman.season === "קיץ";
          const parashaCount = examsOfZman(exams, zman).length;
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
                <span>{parashaCount} פרשות</span>
                <ArrowRight size={14} className="mr-auto group-hover:translate-x-[-4px] transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
