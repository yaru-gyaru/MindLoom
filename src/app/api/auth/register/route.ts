import { randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { ensureSchema, getPool } from "@/lib/server/db";
import { createSession, requireSameOrigin } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Проверьте данные формы." }, { status: 400 }); }
  if (!body || typeof body !== "object") return Response.json({ error: "Проверьте данные формы." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const displayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: "Введите корректный адрес электронной почты." }, { status: 400 });
  if (displayName.length < 2 || displayName.length > 60) return Response.json({ error: "Имя должно содержать от 2 до 60 символов." }, { status: 400 });
  if (password.length < 10 || Buffer.byteLength(password, "utf8") > 72) return Response.json({ error: "Пароль должен содержать от 10 до 72 байт." }, { status: 400 });
  try {
    await ensureSchema();
    const id = randomUUID();
    const passwordHash = await hash(password, 12);
    const result = await getPool().query<{ id: string; email: string; display_name: string; role: "user" | "admin" }>(
      "INSERT INTO users (id, email, display_name, password_hash) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id, email, display_name, role",
      [id, email, displayName, passwordHash],
    );
    const user = result.rows[0];
    if (!user) return Response.json({ error: "Аккаунт с такой почтой уже существует." }, { status: 409 });
    const sessionUser = { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
    await createSession(sessionUser);
    return Response.json({ user: sessionUser }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return Response.json({ error: "Регистрация временно недоступна. Проверьте подключение PostgreSQL." }, { status: 503 });
  }
}
