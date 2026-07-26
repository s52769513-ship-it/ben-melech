"use server";

import { refresh, updateTag } from "next/cache";
import { updateScore as updateScoreDB } from "@/lib/airtable/db";

export async function updateScoreAction(
  id: string,
  data: Record<string, unknown>,
  _examId: string
) {
  await updateScoreDB(id, data);
  updateTag("scores");
  refresh();
}
