"use server";

import { revalidatePath } from "next/cache";
import { updateInquiry as updateInquiryDB } from "@/lib/airtable/db";

export async function updateInquiry(id: string, data: Record<string, unknown>) {
  await updateInquiryDB(id, data);
  revalidatePath("/inquiries");
}
