import { ensureSchema, getPool } from "@/lib/server/db";
import { getSessionUser, requireSameOrigin } from "@/lib/server/auth";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string;
  surname: string;
  bio: string;
  city: string;
  website: string;
  birth_date: string | null;
  learning_goals: string;
  role: "user" | "admin";
};

const profileColumns = `id, email, display_name, surname, bio, city, website,
  to_char(birth_date, 'YYYY-MM-DD') AS birth_date, learning_goals, role`;

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Войдите в аккаунт, чтобы открыть профиль." }, { status: 401 });

  try {
    await ensureSchema();
    const result = await getPool().query<ProfileRow>(`SELECT ${profileColumns} FROM users WHERE id = $1`, [user.id]);
    if (!result.rows[0]) return Response.json({ error: "Аккаунт не найден." }, { status: 404 });
    return Response.json({ profile: result.rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile load failed", error);
    return Response.json({ error: "Не удалось загрузить профиль." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (!requireSameOrigin(request)) return Response.json({ error: "Недопустимый источник запроса." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Войдите в аккаунт, чтобы сохранить профиль." }, { status: 401 });

  let data: unknown;
  try { data = await request.json(); } catch { return Response.json({ error: "Проверьте данные формы." }, { status: 400 }); }
  if (!data || typeof data !== "object") return Response.json({ error: "Проверьте данные формы." }, { status: 400 });

  const input = data as Record<string, unknown>;
  const value = (key: string) => typeof input[key] === "string" ? input[key].trim() : "";
  const displayName = value("displayName");
  const surname = value("surname");
  const bio = value("bio");
  const city = value("city");
  const website = value("website");
  const learningGoals = value("learningGoals");
  const birthDate = value("birthDate");

  for (const [label, entry, limit] of [
    ["Имя", displayName, 60], ["Фамилия", surname, 60], ["О себе", bio, 600],
    ["Город", city, 100], ["Сайт", website, 200], ["Цели обучения", learningGoals, 600],
  ] as const) {
    if (entry.length > limit) return Response.json({ error: `Поле «${label}»: максимум ${limit} символов.` }, { status: 400 });
  }
  if (displayName.length < 2) return Response.json({ error: "Имя должно содержать минимум 2 символа." }, { status: 400 });
  const parsedBirthDate = new Date(`${birthDate}T00:00:00.000Z`);
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(parsedBirthDate.getTime()) || parsedBirthDate.toISOString().slice(0, 10) !== birthDate || birthDate > new Date().toISOString().slice(0, 10))) {
    return Response.json({ error: "Укажите корректную дату рождения не позднее сегодняшнего дня." }, { status: 400 });
  }
  if (website) {
    try {
      const url = new URL(website);
      if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("protocol");
    } catch {
      return Response.json({ error: "Ссылка должна начинаться с https:// или http://." }, { status: 400 });
    }
  }

  try {
    await ensureSchema();
    const result = await getPool().query<ProfileRow>(
      `UPDATE users SET display_name = $2, surname = $3, bio = $4, city = $5,
        website = $6, birth_date = $7, learning_goals = $8, updated_at = now()
       WHERE id = $1 RETURNING ${profileColumns}`,
      [user.id, displayName, surname, bio, city, website, birthDate || null, learningGoals],
    );
    if (!result.rows[0]) return Response.json({ error: "Аккаунт не найден." }, { status: 404 });
    return Response.json({ profile: result.rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Profile save failed", error);
    return Response.json({ error: "Не удалось сохранить профиль." }, { status: 503 });
  }
}
