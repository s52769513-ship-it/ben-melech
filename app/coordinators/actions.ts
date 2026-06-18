"use server";

import { revalidatePath, updateTag } from "next/cache";
import { updateCoordinator as updateCoordinatorDB } from "@/lib/airtable/db";

export async function updateCoordinator(id: string, data: Record<string, unknown>) {
  await updateCoordinatorDB(id, data);
  updateTag("coordinators");
  revalidatePath("/coordinators");
  revalidatePath(`/coordinators/${id}`);
}
