"use server";

import { refresh, updateTag } from "next/cache";
import {
  updateStudent as updateStudentDB,
  createStudent as createStudentDB,
  reassignCoordinator,
} from "@/lib/airtable/db";

export async function updateStudent(
  id: string,
  data: Record<string, unknown>
): Promise<{ error?: string }> {
  try {
    await updateStudentDB(id, data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "עדכון הבחור נכשל" };
  }
  // Expire the students cache and re-render right away, so the edit is on
  // screen the moment the save returns — no manual refresh.
  updateTag("students");
  refresh();
  return {};
}

// Returns the failure instead of throwing, so the form can show what Airtable
// actually objected to rather than a blank "something went wrong".
export async function createStudentAction(
  data: Record<string, unknown>
): Promise<{ error: string } | null> {
  try {
    await createStudentDB(data);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "יצירת הבחור נכשלה" };
  }
  updateTag("students");
  refresh();
  return null;
}

// Start-of-year reshuffle: move a whole set of bochurim to another משפיע at once.
export async function reassignCoordinatorAction(
  studentIds: string[],
  coordinatorId: string | null
) {
  await reassignCoordinator(studentIds, coordinatorId);
  updateTag("students");
  refresh();
}
