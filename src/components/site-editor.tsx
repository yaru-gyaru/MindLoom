"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { saveSite, useClientReady, useSiteCatalog, type SiteEntry, type SiteSection } from "@/lib/local-content";

function SiteForm({ existing }: { existing?: SiteEntry }) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [subtitle, setSubtitle] = useState(existing?.subtitle ?? "");
  const [accent, setAccent] = useState(existing?.accent ?? "#7166f6");
  const [sections, setSections] = useState<SiteSection[]>(existing?.sections.map((section) => ({ ...section })) ?? [{ title: "", body: "" }]);
  const [error, setError] = useState("");

  function updateSection(index: number, patch: Partial<SiteSection>) {
    setSections((current) => current.map((section, i) => i === index ? { ...section, ...patch } : section));
  }
  function moveSection(index: number, step: number) {
    const target = index + step;
    if (target < 0 || target >= sections.length) return;
    setSections((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !subtitle.trim()) { setError("Заполните название и описание страницы."); return; }
    if (sections.some((section) => !section.title.trim() || !section.body.trim())) { setError("Заполните заголовок и текст каждого блока."); return; }
    const now = Date.now();
    saveSite({ id: existing?.id ?? `page-${now.toString(36)}`, title: title.trim(), subtitle: subtitle.trim(), accent, sections: sections.map((section) => ({ title: section.title.trim(), body: section.body.trim() })), createdAt: existing?.createdAt ?? now, updatedAt: now });
    router.push("/admin/sites");
  }

  const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal outline-none focus:border-[#7166f6]";
  return <form onSubmit={submit} className="space-y-5">
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-bold">Основная информация</h2><div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_130px]"><label className="text-sm font-semibold text-slate-700">Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, О проекте" className={field} /></label><label className="text-sm font-semibold text-slate-700">Акцентный цвет<input type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1" /></label></div><label className="mt-4 block text-sm font-semibold text-slate-700">Краткое описание<textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} rows={2} placeholder="Что посетитель найдёт на этой странице" className={field} /></label></section>
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">Блоки страницы</h2><p className="mt-1 text-sm text-slate-500">Порядок блоков здесь совпадает с порядком на странице.</p></div><button type="button" onClick={() => setSections((current) => [...current, { title: "", body: "" }])} className="rounded-xl border border-[#dedaff] px-4 py-2 text-sm font-semibold text-[#665be8]">+ Добавить блок</button></div><div className="mt-5 space-y-4">{sections.map((section, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-[#fafbfe] p-4"><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-[#7166f6]">Блок {index + 1}</span><div className="flex gap-1"><button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Переместить блок ${index + 1} выше`} className="rounded-lg px-2 py-1 text-slate-600 disabled:opacity-35">↑</button><button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} aria-label={`Переместить блок ${index + 1} ниже`} className="rounded-lg px-2 py-1 text-slate-600 disabled:opacity-35">↓</button><button type="button" onClick={() => setSections((current) => current.filter((_, i) => i !== index))} disabled={sections.length === 1} className="rounded-lg px-2 py-1 text-sm text-rose-600 disabled:opacity-35">Удалить</button></div></div><label className="mt-3 block text-xs font-semibold text-slate-600">Заголовок<input value={section.title} onChange={(event) => updateSection(index, { title: event.target.value })} className={field} /></label><label className="mt-3 block text-xs font-semibold text-slate-600">Текст<textarea value={section.body} onChange={(event) => updateSection(index, { body: event.target.value })} rows={5} className={field} /></label></div>)}</div></section>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">Страница сохраняется в этом браузере. Ссылка работает на этом устройстве.</p><div className="flex gap-2"><Link href="/admin/sites" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Отмена</Link><button type="submit" className="rounded-xl bg-[#7166f6] px-5 py-2.5 text-sm font-semibold text-white">Сохранить страницу</button></div></div>
  </form>;
}

export function SiteEditor({ siteId }: { siteId?: string }) {
  const sites = useSiteCatalog();
  const ready = useClientReady();
  const existing = siteId ? sites.find((site) => site.id === siteId) : undefined;
  return <AppShell active="admin"><div className="mb-6"><Link href="/admin/sites" className="text-sm font-semibold text-[#7166f6]">← К страницам</Link><h1 className="mt-3 text-3xl font-bold">{siteId ? "Редактировать страницу" : "Создать страницу"}</h1><p className="mt-2 text-sm text-slate-500">Отдельная страница внутри MindLoom с собственным адресом.</p></div>{siteId && !existing ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{ready ? "Страница не найдена." : "Загрузка страницы…"}</div> : <SiteForm key={`${existing?.id ?? "new"}-${existing?.updatedAt ?? 0}`} existing={existing} />}</AppShell>;
}
