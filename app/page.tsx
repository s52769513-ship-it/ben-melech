import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/StatCard";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  MessageSquare,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: coordinatorsCount },
    { count: studentsCount },
    { count: openInquiriesCount },
    { data: recentInquiries },
    { data: recentScores },
  ] = await Promise.all([
    supabase.from("coordinators").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("status", "פתוח"),
    supabase
      .from("inquiries")
      .select("id, title, status, created_at, student:students(first_name, last_name)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("scores")
      .select(
        "id, created_at, chassidut_score, halacha_score, student:students(first_name, last_name), exam:exams(parasha)"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const avgScore =
    recentScores && recentScores.length > 0
      ? (
          recentScores.reduce((acc, s) => {
            const scores = [
              s.chassidut_score,
              s.halacha_score,
            ].filter((v): v is number => v !== null);
            return acc + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
          }, 0) / recentScores.length
        ).toFixed(1)
      : "—";

  const statusColors: Record<string, string> = {
    פתוח: "bg-red-100 text-red-700",
    בטיפול: "bg-yellow-100 text-yellow-700",
    סגור: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f]">לוח בקרה</h1>
        <p className="text-gray-500 mt-1">סקירה כללית של מערכת בן מלך</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          title="רכזים"
          value={coordinatorsCount ?? 0}
          icon={Users}
          description="סה״כ רכזים פעילים"
          color="blue"
        />
        <StatCard
          title="בחורים"
          value={studentsCount ?? 0}
          icon={GraduationCap}
          description="סה״כ בחורים רשומים"
          color="purple"
        />
        <StatCard
          title="פניות פתוחות"
          value={openInquiriesCount ?? 0}
          icon={MessageSquare}
          description="ממתינות לטיפול"
          color="orange"
        />
        <StatCard
          title="ציון ממוצע"
          value={avgScore}
          icon={Star}
          description="על פני ציונים אחרונים"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <AlertCircle size={18} />
              פניות אחרונות
            </h2>
            <Link
              href="/inquiries"
              className="text-sm text-blue-600 hover:underline"
            >
              כל הפניות
            </Link>
          </div>
          {recentInquiries && recentInquiries.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentInquiries.map((inq) => {
                const student = (Array.isArray(inq.student) ? inq.student[0] : inq.student) as { first_name: string; last_name: string } | null;
                return (
                  <li key={inq.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link
                        href={`/inquiries`}
                        className="font-medium text-gray-800 hover:text-blue-600 text-sm"
                      >
                        {inq.title}
                      </Link>
                      {student && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {student.first_name} {student.last_name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        statusColors[inq.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">אין פניות להצגה</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#1e3a5f] flex items-center gap-2">
              <Clock size={18} />
              ציונים אחרונים
            </h2>
            <Link href="/exams" className="text-sm text-blue-600 hover:underline">
              כל המבחנים
            </Link>
          </div>
          {recentScores && recentScores.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentScores.map((score) => {
                const student = (Array.isArray(score.student) ? score.student[0] : score.student) as { first_name: string; last_name: string } | null;
                const exam = (Array.isArray(score.exam) ? score.exam[0] : score.exam) as { parasha: string } | null;
                const avg =
                  [score.chassidut_score, score.halacha_score]
                    .filter((v): v is number => v !== null)
                    .reduce((a, b, _, arr) => a + b / arr.length, 0)
                    .toFixed(1);
                return (
                  <li key={score.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {student
                          ? `${student.first_name} ${student.last_name}`
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {exam?.parasha ?? "—"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#1e3a5f] bg-blue-50 px-3 py-1 rounded-full">
                      {avg !== "0.0" ? avg : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">אין ציונים להצגה</p>
          )}
        </div>
      </div>
    </div>
  );
}
