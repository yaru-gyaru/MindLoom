import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ensureSchema, getPool } from "@/lib/server/db";

const cookieName = "mindloom_session";
const sessionDuration = 60 * 60 * 24 * 7;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(secret);
}

export type AuthUser = { id: string; email: string; displayName: string; role: "user" | "admin" };

export async function createSession(user: AuthUser) {
  const token = await new SignJWT({ email: user.email, displayName: user.displayName, role: user.role })
    .setProtectedHeader({ alg: "HS256" }).setSubject(user.id).setIssuedAt().setIssuer("mindloom")
    .setExpirationTime(`${sessionDuration}s`).sign(secretKey());
  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: sessionDuration });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "mindloom" });
    if (!payload.sub) return null;
    await ensureSchema();
    const result = await getPool().query<{ id: string; email: string; display_name: string; role: "user" | "admin" }>(
      "SELECT id, email, display_name, role FROM users WHERE id = $1", [payload.sub],
    );
    const user = result.rows[0];
    return user ? { id: user.id, email: user.email, displayName: user.display_name, role: user.role } : null;
  } catch {
    return null;
  }
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}
