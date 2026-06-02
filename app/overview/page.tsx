import { createClient } from "@/lib/supabase/server";
import { TableProperties } from "lucide-react";
import OverviewClient from "./OverviewClient";

export default async function OverviewPage() {
  const supabase = await createClient();

  const [{ data: exams }, { data: scores }] = await Promise.all([
    supabase
      .from("exams")
      .select("id, parasha, exam_date")
      .order("exam_date", { ascending: true }),
    supabase
      .from("scores")
      .select(
        "student_id, exam_id, attended_seder, student:students(id, first_name, last_name, coordinator:coordinators(id, name))"
      ),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#1e3a5f] flex items-center gap-2">
          <TableProperties size={28} />
          סקירת נוכחות
        </h1>
        <p className="text-gray-500 mt-1">השתתפות בסדר לפי בחור ופרשה</p>
      </div>
      <OverviewClient exams={exams ?? []} scores={(scores ?? []) as any[]} />
    </div>
  );
}
