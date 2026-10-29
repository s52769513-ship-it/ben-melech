"use server";

import { refresh, updateTag } from "next/cache";
import { createZman as createZmanDB, updateExam as updateExamDB } from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  refresh();
}

export async function addZman(season: string, year: string) {
  if (!season.trim() || !year.trim()) throw new Error("חסר שם זמן או שנה");
  await createZmanDB(season.trim(), year.trim());
  updateTag("zmanim");
  refresh();
}
