"use client";

import Link from "next/link";
import { useSiteCatalog } from "@/lib/local-content";

export function AdminSiteCatalog({ full = false }: { full?: boolean }) {
  const sites = useSiteCatalog();
  return <section className="mt-7 rounded-[22px] border border-slate-200 bg-white p-6 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-bold">Страницы MindLoom</h2><p className="mt-1 text-sm text-slate-500">Создавайте отдельные страницы с собственным адресом и текстовыми блоками.</p></div>
      <div className="flex flex-wrap gap-2">{!full && <Link href="/admin/sites" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Все страницы</Link>}<Link href="/admin/sites/new" className="rounded-xl bg-[#7166f6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6257e6]">+ Создать страницу</Link></div>
    </div>
    {sites.length ? <div className="mt-5 grid gap-3 md:grid-cols-2">{(full ? sites : sites.slice(0, 2)).map((site) => <article key={site.id} className="rounded-2xl border border-slate-200 bg-[#fafbfe] p-5"><span className="text-xs font-bold uppercase tracking-wider text-[#7166f6]">Страница · {site.sections.length} блоков</span><h3 className="mt-2 text-lg font-bold">{site.title}</h3><p className="mt-1 line-clamp-2 text-sm text-slate-500">{site.subtitle}</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold"><Link href={`/sites/${encodeURIComponent(site.id)}`} className="text-[#7166f6]">Открыть страницу →</Link><Link href={`/admin/sites/${encodeURIComponent(site.id)}/edit`} className="text-slate-600">Редактировать</Link></div></article>)}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-[#fafbfe] p-6 text-sm text-slate-500">Пока нет созданных страниц. Добавьте первую, чтобы увидеть её здесь.</div>}
    <p className="mt-4 text-xs text-slate-500">Демо: страницы хранятся в этом браузере и доступны по ссылке только на этом устройстве.</p>
  </section>;
}
