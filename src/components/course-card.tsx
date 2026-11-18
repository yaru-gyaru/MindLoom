"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useDemoRole } from "@/components/app-shell";
import { courseHref, toggleSavedCourse, useSavedCourseIds, type CourseEntry } from "@/lib/local-content";

const styles: Record<string, { tile: string; bar: string; mark: string }> = {
  system: { tile: "bg-[#ebe8ff] text-[#675bea]", bar: "bg-[#7166f6]", mark: "S" },
  "python-backend": { tile: "bg-[#dff1fa] text-[#438dbb]", bar: "bg-[#5bb1db]", mark: "Py" },
  "ux-research": { tile: "bg-[#fff0e5] text-[#e79466]", bar: "bg-[#f1a77b]", mark: "Ux" },
  c: { tile: "bg-[#173b37] text-[#65d6a4]", bar: "bg-[#65d6a4]", mark: "C" },
  cpp: { tile: "bg-[#28305b] text-[#b8adff]", bar: "bg-[#b8adff]", mark: "C++" },
  java: { tile: "bg-[#3b3023] text-[#ffd175]", bar: "bg-[#ffd175]", mark: "J" },
  javascript: { tile: "bg-[#14283b] text-[#70e6ff]", bar: "bg-[#70e6ff]", mark: "JS" },
};

export function CourseCard({ course }: { course: CourseEntry }) {
  const role = useDemoRole();
  const saved = useSavedCourseIds().includes(course.id);
  const style = styles[course.id] ?? { tile: "bg-[#e9f8f0] text-[#47a980]", bar: "bg-[#58bb91]", mark: course.title.slice(0, 2).toUpperCase() };
  const progress = course.topics.length ? Math.round(course.completed / course.topics.length * 100) : 0;
  const saveButtonClass = "mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold transition-colors " + (saved ? "border-[#287d8e] bg-[#123443] text-[#70e6ff]" : "border-[#344360] bg-[#10182c] text-slate-300 hover:border-[#70e6ff] hover:text-[#70e6ff]");

  return <article className="flex h-full flex-col rounded-2xl border border-[#344360] bg-[#10182c] p-5 shadow-[4px_4px_0_#050914] transition-transform hover:-translate-y-0.5 hover:border-[#70e6ff]">
    <Link href={courseHref(course.id)} className="group block flex-1">
      <div className="flex items-start justify-between"><span className={"flex size-11 items-center justify-center rounded-xl text-sm font-bold " + style.tile}>{style.mark}</span><Icon name="arrow" size={16} className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#70e6ff]" /></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#a99aff]">{course.category}</p>
      <h3 className="mt-1 text-base font-bold text-[#eef2ff]">{course.title}</h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-400">{course.description}</p>
      {role !== "guest" && <><div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-400">{course.completed} из {course.topics.length} тем</span><span className="font-bold text-[#eef2ff]">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1c2941]"><div className={"h-full rounded-full " + style.bar} style={{ width: progress + "%" }} /></div></>}
    </Link>
    {role !== "guest" && <button type="button" onClick={() => toggleSavedCourse(course.id)} aria-pressed={saved} className={saveButtonClass}><span aria-hidden="true">{saved ? "✓" : "+"}</span>{saved ? "Сохранён в «Мои курсы»" : "Сохранить в «Мои курсы»"}</button>}
  </article>;
}
