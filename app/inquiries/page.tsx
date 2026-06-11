import { MessageSquare, Plus } from "lucide-react";
import Link from "next/link";
import InquiriesTable from "@/components/tables/InquiriesTable";
import { getInquiries, getInquiriesByCoordinator, getCoordinators, getStudents } from "@/lib/airtable/db";
import { getSession } from "@/lib/auth";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ status }, coordinatorId] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const isAdmin = coordinatorId === "ADMIN";
  const loggedIn = isAdmin ? null : coordinatorId;

  const [allInquiries, coordinators, students] = await Promise.all([
    !coordinatorId || isAdmin ? getInquiries() : getInquiriesByCoordinator(coordinatorId),
    getCoordinators(),
    // Students filtered to coordinator so the "new inquiry" dropdown shows relevant students only
    getStudents(loggedIn ? { coordinator: loggedIn } : undefined),
  ]);

  const inquiries = status ? allInquiries.filter((i) => i.status === status) : allInquiries;

  const counts = allInquiries.reduce(
    (acc, inq) => {
      acc[inq.status] = (acc[inq.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statuses = ["חדש", "בטיפול", "סגור"];

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <MessageSquare size={28} />
            פניות
          </h1>
          <p className="text-gray-500 mt-1">{allInquiries.length} פניות</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <Link
          href="/inquiries"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !status
              ? "bg-[#1e3a5f] text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          הכל ({allInquiries.length})
        </Link>
        {statuses.map((s) => (counts[s] ?? 0) > 0 ? (
          <Link
            key={s}
            href={`/inquiries?status=${encodeURIComponent(s)}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              status === s
                ? "bg-[#1e3a5f] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} ({counts[s] ?? 0})
          </Link>
        ) : null)}
      </div>

      <InquiriesTable
        inquiries={inquiries}
        coordinators={coordinators}
        students={students}
        isAdmin={isAdmin}
      />
    </div>
  );
}
