"use server";

import { redirect } from "next/navigation";
import { getCoordinators } from "@/lib/db";
import { createSession, clearSession } from "@/lib/auth";

type LoginResult =
  | { success: true; name: string }
  | { success: false; error: string };

export async function adminLoginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const password = (formData.get("password") as string | null) ?? "";
  if (password !== "2447") {
    return { success: false, error: "סיסמה שגויה" };
  }
  await createSession("ADMIN");
  return { success: true, name: "מנהל" };
}

export async function loginAction(
  _prev: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const rawPhone = (formData.get("phone") as string | null) ?? "";
  const rawId = (formData.get("id_number") as string | null) ?? "";

  const phone = rawPhone.replace(/\D/g, "");
  const idTrimmed = rawId.trim();

  if (!phone || !idTrimmed) {
    return { success: false, error: "יש למלא טלפון ות.ז." };
  }

  const coordinators = await getCoordinators();

  const match = coordinators.find((c) => {
    const storedPhone = (c.phone ?? "").replace(/\D/g, "");
    const storedId = String(c.id_number ?? "");
    return storedPhone === phone && storedId === idTrimmed;
  });

  if (!match) {
    return { success: false, error: "פרטי הכניסה שגויים, נא לנסות שנית" };
  }

  await createSession(match.id);
  return { success: true, name: match.name };
}

export async function logout() {
  await clearSession();
  redirect("/login");
}
