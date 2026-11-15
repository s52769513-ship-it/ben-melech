"use server";

import { refresh, revalidateTag, updateTag } from "next/cache";
import { createScore, updateScore, scoreExamTag } from "@/lib/airtable/db";

type BooleanField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

// Refresh the parasha that changed — a handful of rows — and let the
// whole-table aggregates catch up in the background rather than making the
// click wait on a read of every score in the base.
function afterScoreWrite(examId: string | null) {
  if (examId && examId !== "all") updateTag(scoreExamTag(examId));
  revalidateTag("scores", "max");
  refresh();
}

export async function createScoreWithValue(
  studentId: string,
  examId: string,
  field: BooleanField | "manual_points",
  value: boolean | number | null
) {
  await createScore(studentId, examId, { [field]: value });
  updateTag("students");
  afterScoreWrite(examId);
}

export async function updateScoreBoolean(
  scoreId: string,
  field: BooleanField,
  value: boolean,
  examId: string | null = null
) {
  await updateScore(scoreId, { [field]: value });
  afterScoreWrite(examId);
}

export async function updateScoreNumber(
  scoreId: string,
  field: "manual_points",
  value: number | null,
  examId: string | null = null
) {
  await updateScore(scoreId, { [field]: value });
  afterScoreWrite(examId);
}
