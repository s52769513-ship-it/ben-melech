import StatCard from "@/components/StatCard";
import StudentCount from "@/components/StudentCount";
import Link from "next/link";
import { Users, GraduationCap, MessageSquare, Star, Clock, AlertCircle } from "lucide-react";
import { getCoordinators, getStudents, getInquiries, getScoresWithRelations, getGroups } from "@/lib/airtable/db";

export default async function DashboardPage() {
  const [coordinators, students, inquiries, recentScores, groups] = await Promise.all([
    getCoordinators(),
    getStudents(),
    getInquiries(),
    getScoresWithRelations(),
    getGroups(),
  ]);

  const openInquiries = inquiries.filter((i) => i.status === "פתוח");
  const last5Inquiries = [...inquiries].slice(0, 5);
  const last5Scores = [...recentScores].slice(0, 5);

  const kibbutzGroupId = groups.find((g) => g.name === "קיבוץ")?.id ?? null;

  const avgScore =
    last5Scores.length > 0
      ? (
          last5Scores.reduce((acc, s) => {
            const vals = [s.chassidut_score, s.halacha_score].filter(
              (v): v is number => v !== null
            );
            return acc + (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
          }, 0) / last5Scores.length
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
          title="משפיעים"
          value={coordinators.length}
          icon={Users}
          description="סה״כ משפיעים פעילים"
          color="blue"
        />
        <StatCard
          title="בחורים"
          customValue={
            <StudentCount students={students} kibbutzGroupId={kibbutzGroupId} />
          }
          icon={GraduationCap}
          description="סה״כ בחורים רשומים"
          color="purple"
        />
        <StatCard
          title="פניות פתוחות"
          value={openInquiries.length}
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
            <Link href="/inquiries" className="text-sm text-blue-600 hover:underline">
              כל הפניות
            </Link>
          </div>
          {last5Inquiries.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {last5Inquiries.map((inq) => (
                <li key={inq.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      href="/inquiries"
                      className="font-medium text-gray-800 hover:text-blue-600 text-sm"
                    >
                      {inq.title}
                    </Link>
                    {inq.student && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inq.student.first_name} {inq.student.last_name}
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
              ))}
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
          {last5Scores.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {last5Scores.map((score) => {
                const avg = [score.chassidut_score, score.halacha_score]
                  .filter((v): v is number => v !== null)
                  .reduce((a, b, _, arr) => a + b / arr.length, 0)
                  .toFixed(1);
                return (
                  <li key={score.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {score.student
                          ? `${score.student.first_name} ${score.student.last_name}`
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {score.exam?.parasha ?? "—"}
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
