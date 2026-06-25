"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateStudent as updateStudentDB, createStudent as createStudentDB } from "@/lib/airtable/db";

export async function updateStudent(id: string, data: Record<string, unknown>) {
  await updateStudentDB(id, data);
  updateTag("students");
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
}

export async function createStudent(data: Record<string, unknown>) {
  const id = await createStudentDB(data);
  updateTag("students");
  revalidatePath("/students");
  return id;
}
