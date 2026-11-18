"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { CourseCard } from "@/components/course-card";
import { useCourseCatalog, useSavedCourseIds } from "@/lib/local-content";

const categoryOrder = ["Разработка", "Backend-разработка", "Языки программирования", "Дизайн"];

function categorySort(a: string, b: string) {
  const aIndex = categoryOrder.indexOf(a);
  const bIndex = categoryOrder.indexOf(b);
  if (aIndex !== -1 || bIndex !== -1) return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  return a.localeCompare(b, "ru");
}

export function CourseCatalog() {
  const courses = useCourseCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все типы");
  const categories = useMemo(() => [...new Set(courses.map((course) => course.category))].sort(categorySort), [courses]);
  const filtered = courses
    .filter((course) => category === "Все типы" || course.category === category)
    .filter((course) => (course.title + " " + course.description + " " + course.category).toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru")));
  const grouped = [...new Set(filtered.map((course) => course.category))]
    .sort(categorySort)
    .map((type) => [type, filtered.filter((course) => course.category === type).sort((a, b) => a.title.localeCompare(b.title, "ru"))] as const);

  return <div>
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a99aff]">Все направления</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Каталог курсов</h1><p className="mt-2 text-base leading-7 text-slate-400">Курсы собраны по типу: от разработки до языков программирования.</p></div><Link href="/my-courses" className="inline-flex items-center gap-2 rounded-lg border border-[#394967] bg-[#10182c] px-4 py-2.5 text-sm font-bold text-[#70e6ff] hover:border-[#70e6ff]"><Icon name="book" size={17} />Мои курсы</Link></div>
    <section className="rounded-2xl border border-[#344360] bg-[#10182c] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#344360] bg-[#080d19] px-3 py-2.5 text-slate-400"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Поиск в каталоге курсов" placeholder="Поиск курса или темы" className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" /></label>
        <label className="flex items-center gap-2 rounded-lg border border-[#344360] bg-[#080d19] px-3 py-2.5 text-sm text-slate-400"><span>Тип</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="max-w-52 bg-transparent font-bold text-[#70e6ff] outline-none"><option>Все типы</option>{categories.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
      </div>
      <p className="mt-3 text-xs text-slate-500">Найдено курсов: {filtered.length}</p>
    </section>
    {grouped.length ? <div className="mt-7 space-y-8">{grouped.map(([type, items]) => <section key={type} aria-labelledby={"category-" + type}><div className="mb-4 flex items-end justify-between gap-3 border-b border-[#344360] pb-3"><div><h2 id={"category-" + type} className="text-xl font-bold text-[#eef2ff]">{type}</h2><p className="mt-1 text-sm text-slate-500">{items.length} {items.length === 1 ? "курс" : items.length < 5 ? "курса" : "курсов"}</p></div></div><div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{items.map((course) => <CourseCard key={course.id} course={course} showSave />)}</div></section>)}</div> : <div className="mt-7 rounded-2xl border border-dashed border-[#344360] bg-[#10182c] p-8 text-center"><p className="font-bold text-[#eef2ff]">Курсы не найдены</p><p className="mt-2 text-sm text-slate-400">Измените запрос или выберите другой тип курса.</p></div>}
  </div>;
}

export function MyCourseLibrary() {
  const courses = useCourseCatalog();
  const savedIds = useSavedCourseIds();
  const library = courses.filter((course) => course.completed > 0 || savedIds.includes(course.id));
  const inProgress = library.filter((course) => course.completed > 0 && course.completed < course.topics.length);
  const completed = library.filter((course) => course.completed >= course.topics.length);
  const saved = library.filter((course) => savedIds.includes(course.id) && course.completed === 0);

  return <div>
    <div className="mb-7"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a99aff]">Личная библиотека</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Мои курсы</h1><p className="mt-2 text-base leading-7 text-slate-400">Здесь сохранённые курсы и обучение, которое вы уже начали.</p></div>
    {library.length === 0 ? <section className="rounded-2xl border border-[#344360] bg-[#10182c] p-8 text-center sm:p-12"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#17223b] text-[#70e6ff]"><Icon name="book" size={22} /></span><h2 className="mt-4 text-xl font-bold text-[#eef2ff]">В библиотеке пока пусто</h2><p className="mt-2 text-sm text-slate-400">Сохраните курс из каталога, чтобы быстро вернуться к нему позже.</p><Link href="/catalog" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0f829b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#116f86]">Открыть каталог <Icon name="arrow" size={15} /></Link></section> : <div className="space-y-9">
      {inProgress.length > 0 && <section><h2 className="mb-4 text-xl font-bold text-[#eef2ff]">Продолжить обучение</h2><div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{inProgress.map((course) => <CourseCard key={course.id} course={course} />)}</div></section>}
      {saved.length > 0 && <section><h2 className="mb-4 text-xl font-bold text-[#eef2ff]">Сохранённые</h2><div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{saved.map((course) => <CourseCard key={course.id} course={course} />)}</div></section>}
      {completed.length > 0 && <section><h2 className="mb-4 text-xl font-bold text-[#eef2ff]">Завершённые</h2><div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{completed.map((course) => <CourseCard key={course.id} course={course} />)}</div></section>}
      <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-bold text-[#70e6ff] hover:text-white">Найти ещё курсы <Icon name="arrow" size={15} /></Link>
    </div>}
  </div>;
}
