"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFinance(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("finances").update(data).eq("id", id);
  revalidatePath("/finances");
}
