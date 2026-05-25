import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowRight, User, Phone, MapPin, Calendar, BookOpen, Star } from "lucide-react";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: student },
    { data: scores },
    { data: inquiries },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("*, coordinator:coordinators(id, name)")
      .eq("id", id)
      .single(),
    supabase
      .from("scores")
      .select(
        "*, exam:exams(id, parasha, exam_date)"
      )
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inquiries")
      .select("*")
      .eq("student_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!student) notFound();

  const coordinator = student.coordinator as { id: string; name: string } | null;

  const totalPoints = (scores ?? []).reduce((acc, s) => {
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
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <User size={18} />
              פרטים אישיים
            </h2>
            <dl className="space-y-3 text-sm">
              {student.city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span>{student.city}</span>
                  {student.street && <span className="text-gray-400">, {student.street}</span>}
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span>{student.phone}</span>
                </div>
              )}
              {student.birth_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} className="text-gray-400 shrink-0" />
                  <span>
                    {new Date(student.birth_date).toLocaleDateString("he-IL")}
                  </span>
                </div>
              )}
              {student.father_name && (
                <div className="text-gray-600">
                  <span className="text-gray-400 text-xs">שם האב: </span>
                  {student.father_name}
                </div>
              )}
              {student.id_number && (
                <div className="text-gray-600">
                  <span className="text-gray-400 text-xs">ת.ז: </span>
                  {student.id_number}
                </div>
              )}
              {student.enrollment_date && (
                <div className="text-gray-600">
                  <span className="text-gray-400 text-xs">תאריך הצטרפות: </span>
                  {new Date(student.enrollment_date).toLocaleDateString("he-IL")}
                </div>
              )}
            </dl>

            {(student.yeshiva || student.track) && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen size={14} />
                  לימודים
                </h3>
                <dl className="space-y-2 text-sm text-gray-600">
                  {student.yeshiva && (
                    <div>
                      <span className="text-gray-400 text-xs">ישיבה: </span>
                      {student.yeshiva}
                    </div>
                  )}
                  {student.track && (
                    <div>
                      <span className="text-gray-400 text-xs">מסלול: </span>
                      {student.track}
                    </div>
                  )}
                </dl>
              </div>
            )}

            {coordinator && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">רכז</h3>
                <Link
                  href={`/coordinators/${coordinator.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {coordinator.name}
                </Link>
              </div>
            )}

            {student.notes && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">הערות</h3>
                <p className="text-sm text-gray-600">{student.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <Star size={18} />
              נקודות סה״כ
            </h2>
            <p className="text-4xl font-bold text-[#1e3a5f]">{totalPoints}</p>
            <p className="text-gray-400 text-xs mt-1">נקודות שנצברו</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">היסטוריית ציונים</h2>
            {scores && scores.length > 0 ? (
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
                    {scores.map((score) => {
                      const exam = score.exam as { parasha: string; exam_date: string | null } | null;
                      return (
                        <tr key={score.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-medium text-gray-800">
                            {exam?.parasha ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500">
                            {exam?.exam_date
                              ? new Date(exam.exam_date).toLocaleDateString("he-IL")
                              : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">
                            {score.chassidut_score ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">
                            {score.halacha_score ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-gray-700">
                            {score.tefila_score ?? "—"}
                          </td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">אין ציונים עדיין</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4">פניות</h2>
            {inquiries && inquiries.length > 0 ? (
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
                        {inq.created_at
                          ? new Date(inq.created_at).toLocaleDateString("he-IL")
                          : ""}
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
