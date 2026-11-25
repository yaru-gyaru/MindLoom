import Link from "next/link";
import { getSessionUser } from "@/lib/server/auth";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) return <main className="mx-auto max-w-xl p-10 text-center"><h1 className="text-2xl font-bold">Войдите в аккаунт</h1><Link href="/login" className="mt-4 inline-block text-[#6258f4]">Перейти ко входу</Link></main>;
  return <main className="mx-auto max-w-2xl p-6"><p className="text-sm font-semibold text-[#6258f4]">Профиль</p><h1 className="mt-2 text-3xl font-bold">{user.displayName}</h1><section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">Данные аккаунта</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Электронная почта</dt><dd className="mt-1 font-medium">{user.email}</dd></div><div><dt className="text-slate-500">Роль</dt><dd className="mt-1 font-medium">{user.role === "admin" ? "Администратор" : "Пользователь"}</dd></div></dl></section></main>;
}
