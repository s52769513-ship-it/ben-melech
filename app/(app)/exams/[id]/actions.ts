"use server";

import { refresh, revalidateTag } from "next/cache";
import { updateScore as updateScoreDB } from "@/lib/airtable/db";

export async function updateScoreAction(
  id: string,
  data: Record<string, unknown>,
  _examId: string
) {
  await updateScoreDB(id, data);
  // Background refresh — a score edit shouldn't wait on a full table re-read.
  revalidateTag("scores", "max");
  refresh();
}
