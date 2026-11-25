"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const register = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const payload = register
      ? { displayName: values.get("displayName"), email: values.get("email"), password: values.get("password") }
      : { email: values.get("email"), password: values.get("password") };
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Не удалось выполнить запрос.");
      window.dispatchEvent(new Event("mindloom-auth-change"));
      router.push("/profile");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Сервер временно недоступен.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#080d19] px-4 py-10 text-[#e7efff]"><section className="w-full max-w-md rounded-3xl border border-[#344360] bg-[#10182c] p-7 shadow-2xl sm:p-9"><Link href="/" className="text-sm font-semibold text-[#70e6ff]">← MindLoom</Link><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#a99aff]">Личный аккаунт</p><h1 className="mt-2 text-3xl font-extrabold text-white">{register ? "Создать аккаунт" : "Войти в MindLoom"}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{register ? "Сохраняйте ответы и прогресс на сервере, чтобы продолжить обучение с любого устройства." : "Войдите, чтобы открыть сохранённый прогресс и продолжить обучение."}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">
      {register && <label className="block text-sm font-semibold">Имя<input name="displayName" required minLength={2} maxLength={60} autoComplete="name" className="mt-2 w-full rounded-xl border border-[#40516d] bg-[#0a1322] px-4 py-3 text-white outline-none focus:border-[#70e6ff]" /></label>}
      <label className="block text-sm font-semibold">Электронная почта<input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-2 w-full rounded-xl border border-[#40516d] bg-[#0a1322] px-4 py-3 text-white outline-none focus:border-[#70e6ff]" /></label>
      <label className="block text-sm font-semibold">Пароль<input name="password" type="password" required minLength={register ? 10 : 1} maxLength={72} autoComplete={register ? "new-password" : "current-password"} className="mt-2 w-full rounded-xl border border-[#40516d] bg-[#0a1322] px-4 py-3 text-white outline-none focus:border-[#70e6ff]" />{register && <span className="mt-1 block text-xs font-normal text-slate-400">Не менее 10 символов</span>}</label>
      {error && <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-[#6651ac] px-4 py-3 font-bold text-white transition hover:bg-[#7863c2] disabled:opacity-60">{busy ? "Подождите…" : register ? "Зарегистрироваться" : "Войти"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-300">{register ? "Уже есть аккаунт?" : "Ещё нет аккаунта?"} <Link className="font-semibold text-[#70e6ff]" href={register ? "/login" : "/register"}>{register ? "Войти" : "Зарегистрироваться"}</Link></p>
    </section></main>;
}
