"use client";

import { useSettings } from "@/lib/settings-context";

type Student = { group_id?: string | null; coordinator_id?: string | null };

export default function StudentCount({
  students,
  suffix = "בחורים",
}: {
  students: Student[];
  suffix?: string;
}) {
  const { isStudentVisible } = useSettings();
  const count = students.filter(isStudentVisible).length;
  return <>{count} {suffix}</>;
}
