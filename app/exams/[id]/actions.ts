"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateScore as updateScoreDB } from "@/lib/db";

export async function updateScoreAction(
  id: string,
  data: Record<string, unknown>,
  examId: string
) {
  await updateScoreDB(id, data);
  updateTag("scores");
  revalidatePath(`/exams/${examId}`);
}
