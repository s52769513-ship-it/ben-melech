"use server";

import { refresh, revalidateTag } from "next/cache";
import { updateScore } from "@/lib/airtable/db";

type BooleanField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

export async function updateScoreBoolean(scoreId: string, field: BooleanField, value: boolean) {
  await updateScore(scoreId, { [field]: value });
  // The scores table is the big one — re-reading it inline would stall every
  // tick, so it refreshes in the background while the row stays on screen.
  revalidateTag("scores", "max");
  refresh();
}

export async function updateScoreNumber(scoreId: string, field: "points_kaitz", value: number | null) {
  await updateScore(scoreId, { [field]: value });
  revalidateTag("scores", "max");
  refresh();
}
