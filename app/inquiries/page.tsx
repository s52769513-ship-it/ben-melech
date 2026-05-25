import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare, Clock } from "lucide-react";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("inquiries")
    .select(
      "*, student:students(id, first_name, last_name), coordinator:coordinators(id, name)"
    )
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data: inquiries } = await query;

  const statusColors: Record<string, { badge: string; row: string }> = {
    פתוח: { badge: "bg-red-100 text-red-700", row: "border-r-4 border-red-400" },
    בטיפול: {
      badge: "bg-yellow-100 text-yellow-700",
      row: "border-r-4 border-yellow-400",
    },
    סגור: { badge: "bg-green-100 text-green-700", row: "" },
  };

  const counts = (inquiries ?? []).reduce(
    (acc, inq) => {
      acc[inq.status] = (acc[inq.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getDaysOpen = (createdAt: string, status: string) => {
    if (status === "סגור") return null;
    const diff =
      (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.floor(diff);
  };

  const statuses = ["פתוח", "בטיפול", "סגור"];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <MessageSquare size={28} />
          פניות
        </h1>
        <p className="text-gray-500 mt-1">
          {inquiries?.length ?? 0} פניות
        </p>
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href="/inquiries"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !filters.status
              ? "bg-[#1e3a5f] text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          הכל ({(inquiries?.length ?? 0)})
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/inquiries?status=${encodeURIComponent(s)}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === s
                ? "bg-[#1e3a5f] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">כותרת</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">בחור</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">רכז</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">קטגוריה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">תאריך פתיחה</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">ימים פתוח</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inquiries && inquiries.length > 0 ? (
              inquiries.map((inq) => {
                const student = inq.student as {
                  id: string;
                  first_name: string;
                  last_name: string;
                } | null;
                const coordinator = inq.coordinator as {
                  id: string;
                  name: string;
                } | null;
                const daysOpen = getDaysOpen(inq.created_at, inq.status);
                const colors = statusColors[inq.status] ?? {
                  badge: "bg-gray-100 text-gray-600",
                  row: "",
                };

                return (
                  <tr
                    key={inq.id}
                    className={`hover:bg-gray-50 transition-colors ${colors.row}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div>
                        {inq.title}
                        {inq.description && (
                          <p className="text-xs text-gray-400 mt-0.5 font-normal line-clamp-1">
                            {inq.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {student ? (
                        <Link
                          href={`/students/${student.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {student.first_name} {student.last_name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {coordinator ? (
                        <Link
                          href={`/coordinators/${coordinator.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {coordinator.name}
                        </Link>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {inq.category ? (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                          {inq.category}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {inq.inquiry_date
                        ? new Date(inq.inquiry_date).toLocaleDateString("he-IL")
                        : new Date(inq.created_at).toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {daysOpen !== null ? (
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            daysOpen > 14
                              ? "text-red-600"
                              : daysOpen > 7
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          <Clock size={12} />
                          {daysOpen} ימים
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors.badge}`}
                      >
                        {inq.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  אין פניות להצגה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
