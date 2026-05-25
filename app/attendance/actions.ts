"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type BooleanField = "arrived_on_time" | "attended_seder" | "attended_class" | "weekly_summary";

export async function updateScoreBoolean(scoreId: string, field: BooleanField, value: boolean) {
  const supabase = await createClient();
  await supabase.from("scores").update({ [field]: value }).eq("id", scoreId);
  revalidatePath("/attendance");
}
