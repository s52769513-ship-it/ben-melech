"use server";

import { refresh, revalidateTag, updateTag } from "next/cache";
import { updateScore, upsertExamNote } from "@/lib/airtable/db";

export async function updateExamNote(
  scoreId: string,
  field: "personal_note" | "rabbi_note",
  value: string | null
) {
  await updateScore(scoreId, { [field]: value });
  // Background refresh — see attendance/actions.ts.
  revalidateTag("scores", "max");
  refresh();
}

export async function upsertCoordinatorNote({
  coordinatorId,
  examId,
  sicha_beinyan,
  maskana,
  hemshech_tipul,
}: {
  coordinatorId: string;
  examId: string;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
}) {
  await upsertExamNote({ coordinatorId, examId, sicha_beinyan, maskana, hemshech_tipul });
  updateTag("exam-notes");
  refresh();
}
