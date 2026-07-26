"use server";

import { refresh, updateTag } from "next/cache";
import { updateStudent as updateStudentDB } from "@/lib/airtable/db";

export async function updateStudent(id: string, data: Record<string, unknown>) {
  await updateStudentDB(id, data);
  // Expire the students cache and re-render right away, so the edit is on
  // screen the moment the save returns — no manual refresh.
  updateTag("students");
  refresh();
}
