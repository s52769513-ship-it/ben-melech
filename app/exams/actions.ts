"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateExam as updateExamDB } from "@/lib/db";

export async function updateExam(id: string, data: Record<string, unknown>) {
  await updateExamDB(id, data);
  updateTag("exams");
  revalidatePath("/exams");
  revalidatePath(`/exams/${id}`);
}
