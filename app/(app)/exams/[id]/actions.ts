"use server";

import { refresh, revalidateTag, updateTag } from "next/cache";
import { updateScore as updateScoreDB, scoreExamTag } from "@/lib/airtable/db";

export async function updateScoreAction(
  id: string,
  data: Record<string, unknown>,
  examId: string
) {
  await updateScoreDB(id, data);
  // This parasha refreshes now; the whole-table aggregates follow in the
  // background so the save doesn't wait on them.
  updateTag(scoreExamTag(examId));
  revalidateTag("scores", "max");
  refresh();
}
