import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "polla_admin";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || "change-me-please-set-a-real-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function buildToken(): string {
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt);
  return `${issuedAt}.${sig}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, sig] = token.split(".");
  if (!issuedAt || !sig) return false;
  const expected = sign(issuedAt);
  if (expected.length !== sig.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false;
  } catch {
    return false;
  }
  const issuedMs = Number(issuedAt);
  if (!Number.isFinite(issuedMs)) return false;
  if (Date.now() - issuedMs > COOKIE_MAX_AGE * 1000) return false;
  return true;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE_NAME)?.value);
}

export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, buildToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function checkAdminPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  if (expected.length !== input.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(input));
  } catch {
    return false;
  }
}
