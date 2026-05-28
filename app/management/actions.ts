"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateScoreNote(
  scoreId: string,
  field: "personal_note" | "rabbi_note",
  value: string | null
) {
  const supabase = await createClient();
  await supabase.from("scores").update({ [field]: value }).eq("id", scoreId);
  revalidatePath("/management");
}
