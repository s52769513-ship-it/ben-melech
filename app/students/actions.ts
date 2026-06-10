"use server";

import { revalidatePath } from "next/cache";
import { updateStudent as updateStudentDB } from "@/lib/airtable/db";

export async function updateStudent(id: string, data: Record<string, unknown>) {
  await updateStudentDB(id, data);
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}
