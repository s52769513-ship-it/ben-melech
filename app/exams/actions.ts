"use server";

import { revalidatePath } from "next/cache";
import { updateExam as updateExamDB } from "@/lib/airtable/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  revalidatePath("/exams");
  revalidatePath(`/exams/${id}`);
}
