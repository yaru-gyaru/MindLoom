"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { courseHref, useCourseCatalog } from "@/lib/local-content";

export function AdminCourseCatalog() {
  const courses = useCourseCatalog();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = courses.filter((course) => `${course.title} ${course.category} ${course.tags.join(" ")}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = filtered.find((course) => course.id === selectedId) ?? filtered[0];

  return <section className="mt-6 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(29,34,72,0.03)]" aria-labelledby="admin-courses-title">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
      <div><h2 id="admin-courses-title" className="text-lg font-bold">Курсы</h2><p className="mt-1 text-sm text-slate-500">Курсов в каталоге: {courses.length} · новые показываются первыми</p></div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <label className="flex min-w-44 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 py-2.5 text-slate-500"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Поиск курса" placeholder="Найти курс" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" /></label>
        <Link href="/admin/courses/new" className="rounded-xl bg-[#7166f6] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6257e6]">+ Создать курс</Link>
      </div>
    </div>
    <div className="grid lg:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.15fr)]">
      <div className="max-h-[530px] space-y-2 overflow-y-auto border-b border-slate-100 p-4 lg:border-b-0 lg:border-r" aria-label="Список курсов">
        {filtered.map((course) => {
          const active = selected?.id === course.id;
          return <button key={course.id} type="button" onClick={() => setSelectedId(course.id)} aria-pressed={active} className={`w-full rounded-xl border p-4 text-left transition-colors ${active ? "border-[#70e6ff] bg-[#17223b]" : "border-transparent hover:border-[#394967] hover:bg-[#17223b]"}`}>
            <span className="block text-sm font-bold text-[#eef2ff]">{course.title}</span>
            <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[#766cf4]">{course.category}</span>
            <span className="mt-3 block text-xs text-slate-400">{course.topics.length} тем в программе</span>
          </button>;
        })}
        {filtered.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-500">Курсы по запросу не найдены.</p>}
      </div>
      {selected ? <div className="p-6 sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7166f6]">{selected.category}</p><h3 className="mt-1 text-xl font-bold">{selected.title}</h3></div><div className="flex flex-wrap gap-2"><Link href={`/admin/courses/${encodeURIComponent(selected.id)}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Редактировать</Link><Link href={courseHref(selected.id)} className="inline-flex items-center gap-2 rounded-lg border border-[#dedaff] px-3 py-2 text-sm font-semibold text-[#665be8] hover:bg-[#f5f3ff]">Открыть карту <Icon name="arrow" size={15} /></Link></div></div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{selected.description}</p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-5">{selected.tags.map((tag) => <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">{tag}</span>)}</div>
      </div> : <div className="flex min-h-64 items-center justify-center p-6 text-sm text-slate-500">Выберите курс из списка.</div>}
    </div>
  </section>;
}
