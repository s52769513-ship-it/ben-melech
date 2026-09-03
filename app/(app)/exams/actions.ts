"use server";

import { refresh, updateTag } from "next/cache";
import {
  updateExam as updateExamDB,
  createZman as createZmanDB,
  setExamZman as setExamZmanDB,
} from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  refresh();
}

// Opening a new zman. From here on the parshiyot that get created hang off it,
// because it becomes the newest zman (see attachNewExamsToCurrentZman).
export async function createZmanAction(
  name: string,
  season: string | null
): Promise<{ id?: string; error?: string }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "יש להזין שם זמן" };
  try {
    const id = await createZmanDB(trimmed, season);
    updateTag("zmanim");
    refresh();
    return { id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "יצירת הזמן נכשלה" };
  }
}

// Moving one parasha to another zman by hand.
export async function setExamZmanAction(examId: string, zmanId: string | null) {
  await setExamZmanDB(examId, zmanId);
  updateTag("exams");
  updateTag("zmanim");
  refresh();
}
