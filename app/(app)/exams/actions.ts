"use server";

import { refresh, updateTag } from "next/cache";
import { updateExam as updateExamDB } from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  refresh();
}
