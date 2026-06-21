import Link from "next/link";
import { ArrowRight, Star, CreditCard } from "lucide-react";
import { notFound } from "next/navigation";
import StudentDetailsCard from "@/components/StudentDetailsCard";
import BochurPanel from "@/components/NedarimCard/BochurPanel";
import { getStudent, getScoresByStudent, getInquiriesByStudent, getCoordinators } from "@/lib/airtable/db";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [student, scores, inquiries, coordinators] = await Promise.all([
    getStudent(id),
    getScoresByStudent(id),
    getInquiriesByStudent(id),
    getCoordinators(),
  ]);

  if (!student) notFound();

  const totalPoints = scores.reduce((acc, s) => {
    let pts = 0;
    if (s.attended_seder) pts += 5;
    if (s.arrived_on_time) pts += 3;
    if (s.attended_class) pts += 5;
    if (s.weekly_summary) pts += 2;
    return acc + pts;
  }, 0);

  const statusColors: Record<string, string> = {
    פתוח: "bg-red-100 text-red-700",
    בטיפול: "bg-yellow-100 text-yellow-700",
    סגור: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/students"
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm mb-4"
        >
          <ArrowRight size={14} />
          חזרה לבחורים
        </Link>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">
          {student.first_name} {student.last_name}
        </h1>
        <p className="text-gray-500 mt-1">פרופיל בחור</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <StudentDetailsCard
            student={student}
            coordinator={student.coordinator ?? null}
            coordinators={coordinators}
          />

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <Star size={18} />
              נקודות סה״כ
            </h2>
            <p className="text-4xl font-bold text-[#1e3a5f]">{totalPoints}</p>
            <p className="text-gray-400 text-xs mt-1">נקודות שנצברו</p>
          </div>

          {student.nedarim_id && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <CreditCard size={18} />
                נדרים קארד
              </h2>
              <BochurPanel
                clientId={student.nedarim_id}
                name={`${student.first_name} ${student.last_name}`}
              />
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <Star size={18} />
              נקודות והטענה
            </h2>
            <dl className="divide-y divide-gray-100 text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-500">נקודות זמן קיץ תשפו</dt>
                <dd className="font-semibold text-gray-800">{student.summer_points ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-500">נקודות זמן קיץ תשפו (מעל 500)</dt>
                <dd className="font-semibold text-gray-800">{student.summer_points_over_500 ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-500">כסף להטענה</dt>
                <dd className="font-semibold text-gray-800">
                  {student.nedarim_amount != null ? `₪${student.nedarim_amount}` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-500">הוטען</dt>
                <dd className="font-semibold text-gray-800">
                  {student.nedarim_charged != null ? `₪${student.nedarim_charged}` : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-gray-500">נשאר להטענה</dt>
                <dd className="font-semibold text-gray-800">
                  {student.remaining_to_load != null ? `₪${student.remaining_to_load}` : "—"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">היסטוריית ציונים</h2>
            {scores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">פרשה</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">תאריך</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">חסידות</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">הלכה</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">תפילה</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">נוכח</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-500">שילם</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {scores.map((score) => (
                      <tr key={score.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-800">
                          {score.exam?.parasha ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">
                          {score.exam?.exam_date
                            ? new Date(score.exam.exam_date).toLocaleDateString("he-IL")
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">{score.chassidut_score ?? "—"}</td>
                        <td className="px-3 py-2.5 text-gray-700">{score.halacha_score ?? "—"}</td>
                        <td className="px-3 py-2.5 text-gray-700">{score.tefila_score ?? "—"}</td>
                        <td className="px-3 py-2.5">
                          {score.attended_seder ? (
                            <span className="text-green-600 font-medium">✓</span>
                          ) : (
                            <span className="text-red-400">✗</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {score.paid ? (
                            <span className="text-green-600 font-medium">✓</span>
                          ) : (
                            <span className="text-red-400">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">אין ציונים עדיין</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">פניות</h2>
            {inquiries.length > 0 ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {inquiries.map((inq) => (
                  <li key={inq.id} className="py-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-800">{inq.title}</p>
                      {inq.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {inq.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {inq.created_at ? new Date(inq.created_at).toLocaleDateString("he-IL") : ""}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        statusColors[inq.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inq.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">אין פניות</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
