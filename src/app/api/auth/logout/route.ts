import { clearSession, requireSameOrigin } from "@/lib/server/auth";

export async function POST(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  await clearSession();
  return Response.json({ ok: true });
}
