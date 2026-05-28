import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import CoordinatorsTable from "@/components/tables/CoordinatorsTable";

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
          משפיעים
        </h1>
        <p className="text-gray-500 mt-1">
          {coordinators?.length ?? 0} משפיעים במערכת
        </p>
      </div>

      <CoordinatorsTable
        coordinators={coordinators ?? []}
        studentCountMap={studentCountMap}
        inquiryCountMap={inquiryCountMap}
      />
    </div>
  );
}
