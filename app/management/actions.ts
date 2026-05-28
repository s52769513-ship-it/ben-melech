"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateExamNote(
  scoreId: string,
  field: "personal_note" | "rabbi_note",
  value: string | null
) {
  const supabase = await createClient();
  await supabase.from("scores").update({ [field]: value }).eq("id", scoreId);
  revalidatePath("/management");
}

export async function upsertCoordinatorNote({
  coordinatorId,
  examId,
  sicha_beinyan,
  maskana,
  hemshech_tipul,
}: {
  coordinatorId: string;
  examId: string;
  sicha_beinyan: string | null;
  maskana: string | null;
  hemshech_tipul: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("coordinator_exam_notes").upsert(
    { coordinator_id: coordinatorId, exam_id: examId, sicha_beinyan, maskana, hemshech_tipul },
    { onConflict: "coordinator_id,exam_id" }
  );
  revalidatePath("/management");
}
