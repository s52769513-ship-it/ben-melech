import { Suspense } from "react";
import { connection } from "next/server";
import { Users } from "lucide-react";
import CoordinatorsTable from "@/components/tables/CoordinatorsTable";
import { TableSkeleton } from "@/components/Skeletons";
import { getCoordinators, getStudents, getInquiries } from "@/lib/airtable/db";

export default function CoordinatorsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <Users size={28} />
          משפיעים
        </h1>
        <Suspense fallback={<p className="text-gray-500 mt-1">טוען…</p>}>
          <CoordinatorsCount />
        </Suspense>
      </div>

      <Suspense fallback={<TableSkeleton rows={8} columns={5} />}>
        <CoordinatorsContent />
      </Suspense>
    </div>
  );
}

async function CoordinatorsCount() {
  await connection();
  const coordinators = await getCoordinators();
  return <p className="text-gray-500 mt-1">{coordinators.length} משפיעים במערכת</p>;
}

async function CoordinatorsContent() {
  await connection();

  const [coordinators, students, openInquiries] = await Promise.all([
    getCoordinators(),
    getStudents(),
    getInquiries("פתוח"),
  ]);

  const studentCountMap: Record<string, number> = {};
  students.forEach((s) => {
    if (s.coordinator_id) {
      studentCountMap[s.coordinator_id] = (studentCountMap[s.coordinator_id] ?? 0) + 1;
    }
  });

  const inquiryCountMap: Record<string, number> = {};
  openInquiries.forEach((i) => {
    if (i.coordinator_id) {
      inquiryCountMap[i.coordinator_id] = (inquiryCountMap[i.coordinator_id] ?? 0) + 1;
    }
  });

  return (
    <CoordinatorsTable
      coordinators={coordinators}
      studentCountMap={studentCountMap}
      inquiryCountMap={inquiryCountMap}
    />
  );
}
