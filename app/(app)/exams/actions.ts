"use server";

import { refresh, updateTag } from "next/cache";
import {
  updateExam as updateExamDB,
  createZman as createZmanDB,
  getZmanFormFields,
  setExamZman as setExamZmanDB,
} from "@/lib/airtable/db";
import type { ZmanFormField } from "@/lib/types";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  refresh();
}

// The columns the zmanim table lets us fill in. "זמן" itself is a formula in
// the base, so the form has to come from the table rather than from here.
export async function zmanFormFieldsAction(): Promise<ZmanFormField[]> {
  return getZmanFormFields();
}

// Opening a new zman. From here on the parshiyot that get created hang off it,
// because it becomes the newest zman (see attachNewExamsToCurrentZman).
export async function createZmanAction(
  values: Record<string, unknown>
): Promise<{ id?: string; dropped?: string[]; error?: string }> {
  const filled = Object.fromEntries(
    Object.entries(values).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  if (Object.keys(filled).length === 0) return { error: "יש למלא לפחות שדה אחד" };

  try {
    const { id, dropped } = await createZmanDB(filled);
    updateTag("zmanim");
    // A column Airtable turned down is one the form should stop offering.
    if (dropped.length > 0) updateTag("zmanim-schema");
    refresh();
    return { id, dropped };
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
