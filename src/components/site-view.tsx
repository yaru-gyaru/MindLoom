"use client";

import Link from "next/link";
import { AppShell, useDemoRole } from "@/components/app-shell";
import { useClientReady, useSiteCatalog } from "@/lib/local-content";

export function SiteView({ siteId }: { siteId: string }) {
  const ready = useClientReady();
  const role = useDemoRole();
  const site = useSiteCatalog().find((item) => item.id === siteId);
  return <AppShell active="home">{site ? <div className="mx-auto max-w-4xl"><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Link href="/" className="text-sm font-semibold text-[#7166f6]">← На главную</Link>{role === "admin" && <Link href={`/admin/sites/${encodeURIComponent(siteId)}/edit`} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">Редактировать</Link>}</div><header className="rounded-[28px] bg-white p-8 shadow-sm sm:p-12"><span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: site.accent }}>Страница MindLoom</span><h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">{site.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{site.subtitle}</p></header><div className="mt-6 space-y-4">{site.sections.map((section, index) => <section key={index} className="rounded-[24px] border border-slate-200 bg-white p-7 sm:p-9"><div className="mb-5 h-1 w-12 rounded-full" style={{ backgroundColor: site.accent }} /><h2 className="text-2xl font-bold">{section.title}</h2><p className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-600">{section.body}</p></section>)}</div></div> : <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-2xl font-bold">{ready ? "Страница не найдена" : "Загрузка страницы…"}</h1>{ready && <p className="mt-3 text-sm text-slate-500">Эта страница может быть сохранена в другом браузере или на другом устройстве.</p>}<Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#7166f6]">На главную</Link></div>}</AppShell>;
}
