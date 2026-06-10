"use server";

import { revalidatePath } from "next/cache";
import { updateCoordinator as updateCoordinatorDB } from "@/lib/airtable/db";

export async function updateCoordinator(id: string, data: Record<string, unknown>) {
  await updateCoordinatorDB(id, data);
  revalidatePath("/coordinators");
  revalidatePath(`/coordinators/${id}`);
}
