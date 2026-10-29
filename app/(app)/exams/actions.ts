"use server";

import { refresh, updateTag } from "next/cache";
import { createZman as createZmanDB, updateExam as updateExamDB } from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  refresh();
}

export async function addZman(season: string, year: { id?: string; name?: string }) {
  if (!season.trim() || !(year.id || year.name?.trim())) throw new Error("חסר שם זמן או שנה");
  await createZmanDB(season.trim(), { id: year.id, name: year.name?.trim() });
  updateTag("zmanim");
  refresh();
}
