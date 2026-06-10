"use server";

import { revalidatePath } from "next/cache";
import { updateScore } from "@/lib/airtable/db";

type BooleanField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

export async function updateScoreBoolean(scoreId: string, field: BooleanField, value: boolean) {
  await updateScore(scoreId, { [field]: value });
  revalidatePath("/attendance");
}
