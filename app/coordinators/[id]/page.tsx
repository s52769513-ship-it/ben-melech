import Link from "next/link";
import {
  ArrowRight, Phone, MapPin, Mail, CreditCard,
  User, GraduationCap, MessageSquare, Wallet,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  getCoordinator,
  getStudents,
  getFinancesByCoordinator,
  getInquiriesByCoordinator,
} from "@/lib/db";

export default async function CoordinatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [coordinator, students, finances, inquiries] = await Promise.all([
    getCoordinator(id),
    getStudents({ coordinator: id }),
    getFinancesByCoordinator(id),
    getInquiriesByCoordinator(id),
  ]);

  if (!coordinator) notFound();

  const totalPaid = finances.reduce((acc, f) => acc + (f.amount ?? 0), 0);

  const statusColors: Record<string, string> = {
    פתוח: "bg-red-100 text-red-700",
    בטיפול: "bg-yellow-100 text-yellow-700",
    סגור: "bg-green-100 text-green-700",
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/coordinators"
          className="flex items-center gap-1 text-blue-600 hover:underline text-sm mb-4"
        >
          <ArrowRight size={14} />
          חזרה למשפיעים
        </Link>
        <h1 className="text-3xl font-bold text-[#1e3a5f]">{coordinator.name}</h1>
        <p className="text-gray-500 mt-1">פרופיל משפיע</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <User size={18} />
            פרטים אישיים
          </h2>
          <dl className="space-y-3 text-sm">
            {coordinator.city && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span>{coordinator.city}</span>
              </div>
            )}
            {coordinator.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                <span>{coordinator.phone}</span>
              </div>
            )}
            {coordinator.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span>{coordinator.email}</span>
              </div>
            )}
            {coordinator.id_number && (
              <div className="flex items-center gap-2 text-gray-600">
                <CreditCard size={14} className="text-gray-400 shrink-0" />
                <span>ת.ז: {coordinator.id_number}</span>
              </div>
            )}
          </dl>

          {(coordinator.bank || coordinator.branch_number || coordinator.account_number) && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">פרטי בנק</h3>
              <dl className="space-y-1.5 text-xs text-gray-600">
                {coordinator.bank && <div>בנק: {coordinator.bank}</div>}
                {coordinator.branch_number && <div>סניף: {coordinator.branch_number}</div>}
                {coordinator.account_number && <div>חשבון: {coordinator.account_number}</div>}
                <div className="font-semibold text-[#1e3a5f] mt-2">
                  משכורת חודשית: ₪{coordinator.monthly_salary?.toLocaleString() ?? 0}
                </div>
              </dl>
            </div>
          )}

          {coordinator.notes && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">הערות</h3>
              <p className="text-sm text-gray-600">{coordinator.notes}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
              <GraduationCap size={18} />
              בחורים ({students.length})
            </h2>
            {students.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">שם</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">עיר</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">ישיבה</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">מסלול</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 font-medium text-gray-800">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{student.city ?? "—"}</td>
                      <td className="px-3 py-2.5 text-gray-500">{student.yeshiva ?? "—"}</td>
                      <td className="px-3 py-2.5 text-gray-500">{student.track ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/students/${student.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          פרופיל
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">
                אין בחורים משויכים למשפיע זה
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <Wallet size={18} />
                תשלומים
              </h2>
              <div className="mb-4 text-sm text-gray-600">
                סה״כ שולם:{" "}
                <span className="font-bold text-[#1e3a5f] text-base">
                  ₪{totalPaid.toLocaleString()}
                </span>
              </div>
              {finances.length > 0 ? (
                <ul className="divide-y divide-gray-100 text-sm max-h-52 overflow-auto">
                  {finances.map((f) => (
                    <li key={f.id} className="py-2.5 flex justify-between">
                      <span className="text-gray-600">
                        {f.payment_date
                          ? new Date(f.payment_date).toLocaleDateString("he-IL")
                          : "—"}
                      </span>
                      <span className="font-semibold text-gray-800">
                        ₪{f.amount?.toLocaleString() ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">אין תשלומים</p>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-[#1e3a5f] mb-4 flex items-center gap-2">
                <MessageSquare size={18} />
                פניות
              </h2>
              {inquiries.length > 0 ? (
                <ul className="divide-y divide-gray-100 text-sm max-h-52 overflow-auto">
                  {inquiries.map((inq) => (
                    <li
                      key={inq.id}
                      className="py-2.5 flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-xs leading-snug">
                          {inq.title}
                        </p>
                        {inq.student && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {inq.student.first_name} {inq.student.last_name}
                          </p>
                        )}
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
                <p className="text-gray-400 text-sm text-center py-4">אין פניות</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
