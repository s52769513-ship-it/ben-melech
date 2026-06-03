import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import InquiriesTable from "@/components/tables/InquiriesTable";

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

  const [{ data: coordinators }, { data: students }] = await Promise.all([
    supabase.from("coordinators").select("id, name").order("name"),
    supabase.from("students").select("id, first_name, last_name").order("last_name").order("first_name"),
  ]);

  const counts = (inquiries ?? []).reduce(
    (acc, inq) => {
      acc[inq.status] = (acc[inq.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statuses = ["פתוח", "בטיפול", "סגור"];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <MessageSquare size={28} />
          פניות
        </h1>
        <p className="text-gray-500 mt-1">{inquiries?.length ?? 0} פניות</p>
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
          הכל ({inquiries?.length ?? 0})
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

      <InquiriesTable
        inquiries={inquiries ?? []}
        coordinators={coordinators ?? []}
        students={students ?? []}
      />
    </div>
  );
}
