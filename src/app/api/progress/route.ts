import { ensureSchema, getPool } from "@/lib/server/db";
import { getSessionUser, requireSameOrigin } from "@/lib/server/auth";

const maxBodyLength = 18_000;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Войдите в аккаунт, чтобы загрузить прогресс." }, { status: 401 });
  try {
    await ensureSchema();
    const result = await getPool().query<{ assignment_id: string; answer: string; completed_at: Date | null }>(
      "SELECT assignment_id, answer, completed_at FROM user_progress WHERE user_id = $1 ORDER BY updated_at DESC", [user.id],
    );
    const answers: Record<string, string> = {};
    const completed: string[] = [];
    for (const row of result.rows) {
      if (row.answer) answers[row.assignment_id] = row.answer;
      if (row.completed_at) completed.push(row.assignment_id);
    }
    return Response.json({ answers, completed }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Progress load failed", error);
    return Response.json({ error: "Не удалось загрузить прогресс из базы данных." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Войдите в аккаунт, чтобы сохранить прогресс." }, { status: 401 });
  let body: unknown;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > maxBodyLength) return Response.json({ error: "Ответ слишком большой." }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Не удалось прочитать данные." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return Response.json({ error: "Некорректные данные." }, { status: 400 });
  const data = body as Record<string, unknown>;
  const assignmentId = typeof data.assignmentId === "string" ? data.assignmentId : "";
  if (!/^[a-z0-9_-]{1,80}:\d{1,4}$/i.test(assignmentId)) return Response.json({ error: "Некорректный урок." }, { status: 400 });
  try {
    await ensureSchema();
    if (data.action === "answer") {
      if (typeof data.answer !== "string" || Buffer.byteLength(data.answer, "utf8") > 16_000) return Response.json({ error: "Некорректный ответ." }, { status: 400 });
      await getPool().query(
        "INSERT INTO user_progress (user_id, assignment_id, answer) VALUES ($1, $2, $3) ON CONFLICT (user_id, assignment_id) DO UPDATE SET answer = EXCLUDED.answer, updated_at = now()",
        [user.id, assignmentId, data.answer],
      );
      return Response.json({ saved: true });
    }
    if (data.action === "complete") {
      await getPool().query(
        "INSERT INTO user_progress (user_id, assignment_id, completed_at) VALUES ($1, $2, now()) ON CONFLICT (user_id, assignment_id) DO UPDATE SET completed_at = COALESCE(user_progress.completed_at, now()), updated_at = now()",
        [user.id, assignmentId],
      );
      return Response.json({ saved: true });
    }
    return Response.json({ error: "Неизвестное действие." }, { status: 400 });
  } catch (error) {
    console.error("Progress save failed", error);
    return Response.json({ error: "Не удалось сохранить прогресс в базе данных." }, { status: 503 });
  }
}
