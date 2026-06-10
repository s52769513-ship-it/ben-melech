"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { updateExam as updateExamDB } from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  revalidateTag("exams");
  revalidatePath("/exams");
  revalidatePath(`/exams/${id}`);
}
