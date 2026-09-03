"use server";

import { refresh, updateTag } from "next/cache";
import { settleHistoricNedarim } from "@/lib/airtable/db";

// Writes off the balances a bochur earned before the cutoff, so only money
// from the current period is left for the cards. No card is charged here.
export async function settleHistoricAction(studentIds?: string[]): Promise<number> {
  const settled = await settleHistoricNedarim(studentIds);
  if (settled > 0) {
    updateTag("students");
    refresh();
  }
  return settled;
}
