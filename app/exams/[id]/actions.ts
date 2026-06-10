"use server";

import { revalidatePath } from "next/cache";
import { updateScore as updateScoreDB } from "@/lib/airtable/db";

export async function updateScoreAction(
  id: string,
  data: Record<string, unknown>,
  examId: string
) {
  await updateScoreDB(id, data);
  revalidatePath(`/exams/${examId}`);
}
