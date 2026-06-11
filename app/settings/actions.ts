"use server";

import { getCoordinators, getGroups } from "@/lib/airtable/db";

export async function getCoordinatorsAndGroups() {
  const [coordinators, groups] = await Promise.all([getCoordinators(), getGroups()]);
  return {
    coordinators: coordinators.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })),
    groups: groups.map((g: { id: string; name: string }) => ({ id: g.id, name: g.name })),
  };
}
