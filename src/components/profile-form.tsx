"use client";

import { useState, type FormEvent } from "react";

export type EditableProfile = {
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

const inputClass = "mt-2 w-full rounded-xl border border-[#344360] bg-[#0a1322] px-4 py-3 text-[#edf4ff] outline-none placeholder:text-[#73839c] focus:border-[#70e6ff] focus:ring-2 focus:ring-[#70e6ff]/15";

export function ProfileForm({ initialProfile }: { initialProfile: EditableProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const filledCount = [profile.surname, profile.bio, profile.city, profile.website, profile.birth_date, profile.learning_goals].filter(Boolean).length;
  const completion = Math.round(((filledCount + 1) / 7) * 100);

  function change(field: keyof EditableProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          displayName: profile.display_name,
          surname: profile.surname,
          bio: profile.bio,
          city: profile.city,
          website: profile.website,
          birthDate: profile.birth_date ?? "",
          learningGoals: profile.learning_goals,
        }),
      });
      const data = await response.json() as { profile?: EditableProfile; error?: string };
      if (!response.ok || !data.profile) throw new Error(data.error || "Не удалось сохранить профиль.");
      setProfile(data.profile);
      setMessage("Изменения сохранены.");
      window.dispatchEvent(new Event("mindloom-auth-change"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить профиль.");
    } finally {
      setBusy(false);
    }
  }

  const initials = `${profile.display_name.trim().charAt(0)}${profile.surname.trim().charAt(0)}`.toUpperCase();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-[#5e5990] bg-[#252a52] text-xl font-bold text-[#b8b3ff] shadow-[4px_4px_0_#030611]">{initials || "М"}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a99aff]">Аккаунт MindLoom</p>
          <h1 className="mt-1 break-words text-3xl font-bold text-[#edf4ff] sm:text-4xl">{profile.display_name}{profile.surname ? ` ${profile.surname}` : ""}</h1>
        </div>
        <span className="rounded-full border border-[#75652f] bg-[#302a20] px-4 py-2 text-sm font-semibold text-[#ffd36d]">{profile.role === "admin" ? "Администратор" : "Участник"}</span>
      </header>

      <section className="mt-7 rounded-2xl border border-[#344360] bg-[#10182c] p-5 shadow-[4px_4px_0_#030611] sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div><h2 className="text-lg font-semibold text-[#edf4ff]">Заполненность профиля</h2><p className="mt-1 text-sm text-[#a7b7d0]">Добавь информацию, чтобы профиль был полезнее.</p></div>
          <span className="text-lg font-bold text-[#70e6ff]">{completion}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#263550]"><div className="h-full rounded-full bg-gradient-to-r from-[#7259bd] to-[#70e6ff] transition-[width]" style={{ width: `${completion}%` }} /></div>
      </section>

      <form onSubmit={save} className="mt-6 rounded-2xl border border-[#344360] bg-[#10182c] p-5 shadow-[4px_4px_0_#030611] sm:p-8">
        <div><h2 className="text-xl font-semibold text-[#edf4ff]">Личная информация</h2><p className="mt-1 text-sm text-[#a7b7d0]">Почту и роль можно посмотреть ниже — они управляются аккаунтом.</p></div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#dce7f8]">Имя<input required minLength={2} maxLength={60} autoComplete="given-name" value={profile.display_name} onChange={(event) => change("display_name", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#dce7f8]">Фамилия<input maxLength={60} autoComplete="family-name" value={profile.surname} onChange={(event) => change("surname", event.target.value)} placeholder="Например, Иванов" className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#dce7f8]">Город<input maxLength={100} autoComplete="address-level2" value={profile.city} onChange={(event) => change("city", event.target.value)} placeholder="Алматы" className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#dce7f8]">Дата рождения<input type="date" max={new Date().toISOString().slice(0, 10)} value={profile.birth_date ?? ""} onChange={(event) => change("birth_date", event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#dce7f8] sm:col-span-2">Сайт или портфолио<input type="url" maxLength={200} autoComplete="url" value={profile.website} onChange={(event) => change("website", event.target.value)} placeholder="https://example.com" className={inputClass} /></label>
          <label className="block text-sm font-semibold text-[#dce7f8] sm:col-span-2">О себе<textarea maxLength={600} rows={4} value={profile.bio} onChange={(event) => change("bio", event.target.value)} placeholder="Расскажи о себе, опыте и интересах…" className={`${inputClass} resize-y`} /><span className="mt-1 block text-right text-xs font-normal text-[#8091aa]">{profile.bio.length}/600</span></label>
          <label className="block text-sm font-semibold text-[#dce7f8] sm:col-span-2">Цели обучения<textarea maxLength={600} rows={3} value={profile.learning_goals} onChange={(event) => change("learning_goals", event.target.value)} placeholder="Чему хочешь научиться с MindLoom?" className={`${inputClass} resize-y`} /></label>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[#344360] pt-6 sm:grid-cols-2">
          <div className="rounded-xl border border-[#344360] bg-[#17223b] p-4"><p className="text-sm text-[#a7b7d0]">Электронная почта</p><p className="mt-1 break-all font-semibold text-[#70e6ff]">{profile.email}</p></div>
          <div className="rounded-xl border border-[#344360] bg-[#17223b] p-4"><p className="text-sm text-[#a7b7d0]">Роль аккаунта</p><p className="mt-1 font-semibold text-[#edf4ff]">{profile.role === "admin" ? "Администратор" : "Пользователь"}</p></div>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-400/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
        {message && <p role="status" className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">{message}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4"><p className="text-xs text-[#8091aa]">Изменения сохранятся в аккаунте.</p><button type="submit" disabled={busy} className="rounded-xl border border-[#8e79d2] bg-[#6651ac] px-6 py-3 font-bold text-white shadow-[0_4px_0_#382d62] transition hover:bg-[#7863c2] disabled:cursor-wait disabled:opacity-60">{busy ? "Сохраняем…" : "Сохранить профиль"}</button></div>
      </form>
    </div>
  );
}
