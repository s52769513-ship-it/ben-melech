"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateScore, upsertExamNote } from "@/lib/db";

export async function updateExamNote(
  scoreId: string,
  field: "personal_note" | "rabbi_note",
  value: string | null
) {
  await updateScore(scoreId, { [field]: value });
  updateTag("scores");
  revalidatePath("/management");
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
  revalidatePath("/management");
}
