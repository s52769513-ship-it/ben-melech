"use server";

import { revalidatePath } from "next/cache";
import { updateFinance as updateFinanceDB } from "@/lib/airtable/db";

export async function updateFinance(id: string, data: Record<string, unknown>) {
  await updateFinanceDB(id, data);
  revalidatePath("/finances");
}
