"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateExam(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("exams").update(data).eq("id", id);
  revalidatePath("/exams");
  revalidatePath(`/exams/${id}`);
}
