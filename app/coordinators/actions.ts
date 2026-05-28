"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateCoordinator(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("coordinators").update(data).eq("id", id);
  revalidatePath("/coordinators");
  revalidatePath(`/coordinators/${id}`);
}
