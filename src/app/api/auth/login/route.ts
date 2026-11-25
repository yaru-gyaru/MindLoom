import { compare } from "bcryptjs";
import { ensureSchema, getPool } from "@/lib/server/db";
import { createSession, requireSameOrigin } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Проверьте данные формы." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Проверьте данные формы." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (email.length > 254 || password.length > 72 || !email || !password) return Response.json({ error: "Неверная почта или пароль." }, { status: 400 });
  try {
    await ensureSchema();
    const result = await getPool().query<{ id: string; email: string; display_name: string; role: "user" | "admin"; password_hash: string }>(
      "SELECT id, email, display_name, role, password_hash FROM users WHERE email = $1", [email],
    );
    const user = result.rows[0];
    if (!user || !(await compare(password, user.password_hash))) return Response.json({ error: "Неверная почта или пароль." }, { status: 401 });
    const sessionUser = { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
    await createSession(sessionUser);
    return Response.json({ user: sessionUser });
  } catch (error) {
    console.error("Login failed", error);
    return Response.json({ error: "Вход временно недоступен. Проверьте подключение PostgreSQL." }, { status: 503 });
  }
}
