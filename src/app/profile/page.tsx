import Link from "next/link";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ProfileForm, type EditableProfile } from "@/components/profile-form";
import { ensureSchema, getPool } from "@/lib/server/db";
import { getSessionUser } from "@/lib/server/auth";

async function ProfileContent() {
  const user = await getSessionUser();
  if (!user) {
    return <section className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-8 text-center shadow-[4px_4px_0_#030611]"><h1 className="text-2xl font-bold text-[#edf4ff]">Войдите в аккаунт</h1><p className="mt-3 text-[#a7b7d0]">Чтобы посмотреть профиль, сначала войдите.</p><Link href="/login" className="mt-5 inline-flex rounded-xl bg-[#7157b8] px-5 py-3 font-semibold text-white hover:bg-[#8066ca]">Перейти ко входу</Link></section>;
  }

  await ensureSchema();
  const result = await getPool().query<EditableProfile>(
    `SELECT email, display_name, surname, bio, city, website,
      to_char(birth_date, 'YYYY-MM-DD') AS birth_date, learning_goals, role
     FROM users WHERE id = $1`,
    [user.id],
  );
  const profile = result.rows[0];
  if (!profile) return <section className="rounded-2xl border border-[#344360] bg-[#10182c] p-8 text-[#a7b7d0]">Не удалось найти профиль аккаунта.</section>;
  return <ProfileForm initialProfile={profile} />;
}

export default function ProfilePage() {
  return <AppShell active="profile"><Suspense fallback={<div className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-6 text-center text-[#a7b7d0]">Загружаем профиль…</div>}><ProfileContent /></Suspense></AppShell>;
}
