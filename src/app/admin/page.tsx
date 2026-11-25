import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ensureSchema, getPool } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

type UserRow = {
  id: string;
  display_name: string;
  surname: string;
  email: string;
  role: "user" | "admin";
  created_at: Date;
  saved_answers: number;
  completed_answers: number;
};

type ActivityRow = {
  assignment_id: string;
  submissions: number;
  completed: number;
  last_activity: Date;
};

const dateTime = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" });

async function AdminDashboard() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return <section className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-8 text-center shadow-[4px_4px_0_#030611]"><h1 className="text-2xl font-bold text-[#edf4ff]">Доступ только для администратора</h1><p className="mt-3 text-[#a7b7d0]">Войдите в аккаунт с ролью администратора, чтобы открыть панель.</p><Link href="/" className="mt-5 inline-flex rounded-xl border border-[#344360] px-5 py-3 font-semibold text-[#70e6ff]">На главную</Link></section>;
  }

  await ensureSchema();
  const pool = getPool();
  const [usersResult, activityResult, summaryResult, databaseResult] = await Promise.all([
    pool.query<UserRow>(`SELECT u.id, u.display_name, u.surname, u.email, u.role, u.created_at,
        count(p.assignment_id)::int AS saved_answers,
        count(p.completed_at)::int AS completed_answers
      FROM users u LEFT JOIN user_progress p ON p.user_id = u.id
      GROUP BY u.id ORDER BY u.created_at DESC LIMIT 20`),
    pool.query<ActivityRow>(`SELECT assignment_id, count(*)::int AS submissions,
        count(completed_at)::int AS completed, max(updated_at) AS last_activity
      FROM user_progress GROUP BY assignment_id ORDER BY max(updated_at) DESC LIMIT 12`),
    pool.query<{ users: number; joined_today: number; answers: number; completed: number }>(`SELECT
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM users WHERE created_at >= date_trunc('day', now())) AS joined_today,
        (SELECT count(*)::int FROM user_progress) AS answers,
        (SELECT count(*)::int FROM user_progress WHERE completed_at IS NOT NULL) AS completed`),
    pool.query<{ name: string }>("SELECT current_database() AS name"),
  ]);
  const summary = summaryResult.rows[0];
  const metrics = [
    { label: "Аккаунты", value: summary.users, detail: `Новых сегодня: ${summary.joined_today}`, color: "text-[#70e6ff]" },
    { label: "Ответы на практику", value: summary.answers, detail: "Сохранены в базе", color: "text-[#b8a7ff]" },
    { label: "Завершённые задания", value: summary.completed, detail: "По отметкам пользователей", color: "text-[#69ddb0]" },
    { label: "База данных", value: databaseResult.rows[0]?.name ?? "—", detail: "PostgreSQL · подключена", color: "text-[#ffd36d]" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#a99aff]">Управление платформой</p><h1 className="mt-2 text-3xl font-bold text-[#edf4ff] sm:text-4xl">Админ-панель</h1><p className="mt-2 text-[#a7b7d0]">Данные аккаунтов и практических заданий из PostgreSQL.</p></div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-200"><span className="size-2 rounded-full bg-emerald-300" />Подключена: {databaseResult.rows[0]?.name}</span>
      </header>

      <section aria-label="Статистика базы данных" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-[#344360] bg-[#10182c] p-5 shadow-[4px_4px_0_#030611]"><p className="text-sm font-medium text-[#a7b7d0]">{metric.label}</p><p className={`mt-3 break-words text-3xl font-bold ${metric.color}`}>{metric.value}</p><p className="mt-2 text-xs text-[#8091aa]">{metric.detail}</p></article>)}
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-[#344360] bg-[#10182c] shadow-[4px_4px_0_#030611]">
        <div className="border-b border-[#344360] p-5 sm:px-6"><h2 className="text-xl font-semibold text-[#edf4ff]">Пользователи</h2><p className="mt-1 text-sm text-[#a7b7d0]">Последние 20 аккаунтов из таблицы users.</p></div>
        {usersResult.rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#17223b] text-xs uppercase tracking-wider text-[#a7b7d0]"><tr><th className="px-5 py-3 font-semibold">Имя</th><th className="px-5 py-3 font-semibold">Почта</th><th className="px-5 py-3 font-semibold">Роль</th><th className="px-5 py-3 font-semibold">Регистрация</th><th className="px-5 py-3 font-semibold">Ответы</th><th className="px-5 py-3 font-semibold">Завершено</th></tr></thead><tbody className="divide-y divide-[#263550]">{usersResult.rows.map((account) => <tr key={account.id}><td className="px-5 py-4 font-semibold text-[#edf4ff]">{account.display_name}{account.surname ? ` ${account.surname}` : ""}</td><td className="px-5 py-4 text-[#a7b7d0]">{account.email}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${account.role === "admin" ? "bg-[#332c50] text-[#c8baff]" : "bg-[#183443] text-[#8fe7f5]"}`}>{account.role === "admin" ? "Администратор" : "Пользователь"}</span></td><td className="px-5 py-4 text-[#a7b7d0]">{dateTime.format(new Date(account.created_at))}</td><td className="px-5 py-4 text-[#edf4ff]">{account.saved_answers}</td><td className="px-5 py-4 text-[#edf4ff]">{account.completed_answers}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-[#a7b7d0]">Пользователей пока нет.</p>}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-[#344360] bg-[#10182c] shadow-[4px_4px_0_#030611]">
        <div className="border-b border-[#344360] p-5 sm:px-6"><h2 className="text-xl font-semibold text-[#edf4ff]">Практическая активность</h2><p className="mt-1 text-sm text-[#a7b7d0]">Сводка по сохранённым ответам из таблицы user_progress.</p></div>
        {activityResult.rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#17223b] text-xs uppercase tracking-wider text-[#a7b7d0]"><tr><th className="px-5 py-3 font-semibold">Задание</th><th className="px-5 py-3 font-semibold">Ответов</th><th className="px-5 py-3 font-semibold">Завершено</th><th className="px-5 py-3 font-semibold">Последнее изменение</th></tr></thead><tbody className="divide-y divide-[#263550]">{activityResult.rows.map((activity) => <tr key={activity.assignment_id}><td className="px-5 py-4 font-semibold text-[#edf4ff]">{activity.assignment_id}</td><td className="px-5 py-4 text-[#a7b7d0]">{activity.submissions}</td><td className="px-5 py-4 text-[#a7b7d0]">{activity.completed}</td><td className="px-5 py-4 text-[#a7b7d0]">{dateTime.format(new Date(activity.last_activity))}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-[#a7b7d0]">Сохранённых ответов пока нет.</p>}
      </section>
    </div>
  );
}

export default function AdminPage() {
  return <AppShell active="admin"><Suspense fallback={<div className="rounded-2xl border border-[#344360] bg-[#10182c] p-6 text-[#a7b7d0]">Загружаем данные админ-панели…</div>}><AdminDashboard /></Suspense></AppShell>;
}
