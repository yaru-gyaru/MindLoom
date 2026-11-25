import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getSessionUser } from "@/lib/server/auth";

async function ProfileContent() {
  const user = await getSessionUser();

  return !user ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-8 text-center shadow-[4px_4px_0_#030611]">
          <h1 className="text-2xl font-bold text-[#edf4ff]">Войдите в аккаунт</h1>
          <p className="mt-3 text-[#a7b7d0]">Чтобы посмотреть профиль, сначала войдите.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#7157b8] px-5 py-3 font-semibold text-white hover:bg-[#8066ca]">Перейти ко входу</Link>
        </section>
      ) : (
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a99aff]">Аккаунт MindLoom</p>
          <h1 className="mt-3 text-4xl font-bold text-[#edf4ff]">{user.displayName}</h1>
          <section className="mt-7 rounded-2xl border border-[#344360] bg-[#10182c] p-6 shadow-[4px_4px_0_#030611] sm:p-8">
            <h2 className="text-xl font-semibold text-[#edf4ff]">Данные аккаунта</h2>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-[#344360] bg-[#17223b] p-4">
                <dt className="text-sm text-[#a7b7d0]">Электронная почта</dt>
                <dd className="mt-2 break-all font-semibold text-[#70e6ff]">{user.email}</dd>
              </div>
              <div className="rounded-xl border border-[#344360] bg-[#17223b] p-4">
                <dt className="text-sm text-[#a7b7d0]">Роль</dt>
                <dd className="mt-2 font-semibold text-[#edf4ff]">{user.role === "admin" ? "Администратор" : "Пользователь"}</dd>
              </div>
            </dl>
          </section>
        </div>
      );
}

export default function ProfilePage() {
  return <AppShell active="profile"><Suspense fallback={<div className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-6 text-center text-[#a7b7d0]">Загружаем профиль…</div>}><ProfileContent /></Suspense></AppShell>;
}
