"use server";

import { revalidatePath } from "next/cache";
import {
  updateInquiry as updateInquiryDB,
  createInquiry as createInquiryDB,
} from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function updateInquiry(id: string, data: Record<string, unknown>) {
  await updateInquiryDB(id, data);
  revalidatePath("/inquiries");
}

export async function createInquiryAction(data: {
  title: string;
  student_id: string | null;
  inquiry_date: string | null;
  target_date: string | null;
  description: string | null;
}): Promise<void> {
  const coordinatorId = await getSession();
  const realCoordinatorId = coordinatorId === "ADMIN" ? null : coordinatorId;
  await createInquiryDB({ ...data, coordinator_id: realCoordinatorId });
  revalidatePath("/inquiries");
}
