"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateInquiry(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  await supabase.from("inquiries").update(data).eq("id", id);
  revalidatePath("/inquiries");
}
