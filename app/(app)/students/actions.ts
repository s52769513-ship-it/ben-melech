"use server";

import { refresh, updateTag } from "next/cache";
import {
  updateStudent as updateStudentDB,
  createStudent as createStudentDB,
  reassignCoordinator,
} from "@/lib/airtable/db";

export async function updateStudent(id: string, data: Record<string, unknown>) {
  await updateStudentDB(id, data);
  // Expire the students cache and re-render right away, so the edit is on
  // screen the moment the save returns — no manual refresh.
  updateTag("students");
  refresh();
}

export async function createStudentAction(data: Record<string, unknown>) {
  await createStudentDB(data);
  updateTag("students");
  refresh();
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
