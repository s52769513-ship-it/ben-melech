"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateScore } from "@/lib/db";

type BooleanField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

export async function updateScoreBoolean(scoreId: string, field: BooleanField, value: boolean) {
  await updateScore(scoreId, { [field]: value });
  updateTag("scores");
  revalidatePath("/attendance");
}

export async function updateScoreNumber(scoreId: string, field: "points_kaitz", value: number | null) {
  await updateScore(scoreId, { [field]: value });
  updateTag("scores");
  revalidatePath("/attendance");
}
