import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, Phone, MapPin, ChevronLeft } from "lucide-react";

export default async function CoordinatorsPage() {
  const supabase = await createClient();

  const { data: coordinators } = await supabase
    .from("coordinators")
    .select("*")
    .order("name");

  const coordinatorIds = (coordinators ?? []).map((c) => c.id);

  const [{ data: studentCounts }, { data: openInquiries }] = await Promise.all([
    supabase
      .from("students")
      .select("coordinator_id")
      .in("coordinator_id", coordinatorIds.length ? coordinatorIds : [""]),
    supabase
      .from("inquiries")
      .select("coordinator_id")
      .eq("status", "פתוח")
      .in("coordinator_id", coordinatorIds.length ? coordinatorIds : [""]),
  ]);

  const studentCountMap: Record<string, number> = {};
  (studentCounts ?? []).forEach((s) => {
    if (s.coordinator_id) {
      studentCountMap[s.coordinator_id] = (studentCountMap[s.coordinator_id] ?? 0) + 1;
    }
  });

  const inquiryCountMap: Record<string, number> = {};
  (openInquiries ?? []).forEach((i) => {
    if (i.coordinator_id) {
      inquiryCountMap[i.coordinator_id] = (inquiryCountMap[i.coordinator_id] ?? 0) + 1;
    }
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Users size={28} />
          רכזים
        </h1>
        <p className="text-gray-500 mt-1">
          {coordinators?.length ?? 0} רכזים במערכת
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">שם</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">עיר</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">טלפון</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">אימייל</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">בחורים</th>
              <th className="text-right px-6 py-4 font-semibold text-gray-600">פניות פתוחות</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coordinators && coordinators.length > 0 ? (
              coordinators.map((coordinator) => (
                <tr key={coordinator.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{coordinator.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.city ? (
                      <span className="flex items-center gap-1">
                        <MapPin size={13} className="text-gray-400" />
                        {coordinator.city}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-gray-400" />
                        {coordinator.phone}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {coordinator.email ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                      {studentCountMap[coordinator.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(inquiryCountMap[coordinator.id] ?? 0) > 0 ? (
                      <span className="bg-orange-50 text-orange-700 font-semibold text-xs px-2.5 py-1 rounded-full">
                        {inquiryCountMap[coordinator.id]}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/coordinators/${coordinator.id}`}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-xs"
                    >
                      פרופיל
                      <ChevronLeft size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  אין רכזים במערכת
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
