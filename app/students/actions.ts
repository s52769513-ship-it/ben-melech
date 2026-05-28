"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudent(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("students").update(data).eq("id", id);
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}
