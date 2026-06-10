import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

const COOKIE = "bm_session";

function secret() {
  return process.env.AUTH_SECRET ?? "please-set-AUTH_SECRET-in-env";
}

function sign(id: string): string {
  const sig = createHmac("sha256", secret()).update(id).digest("hex").slice(0, 32);
  return `${id}.${sig}`;
}

function unsign(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const id = value.slice(0, dot);
  if (sign(id) !== value) return null;
  return id;
}

export async function getSession(): Promise<string | null> {
  const store = await cookies();
  const c = store.get(COOKIE);
  if (!c?.value) return null;
  return unsign(c.value);
}

export async function createSession(coordinatorId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(coordinatorId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
