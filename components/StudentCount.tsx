"use client";

import { useSettings } from "@/lib/settings-context";

type Student = { group_id?: string | null };

export default function StudentCount({
  students,
  kibbutzGroupId,
  suffix = "בחורים",
}: {
  students: Student[];
  kibbutzGroupId?: string | null;
  suffix?: string;
}) {
  const { settings } = useSettings();

  const count =
    settings.hideKibbutz && kibbutzGroupId
      ? students.filter((s) => s.group_id !== kibbutzGroupId).length
      : students.length;

  return <>{count} {suffix}</>;
}
