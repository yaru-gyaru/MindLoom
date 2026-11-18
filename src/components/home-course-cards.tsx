"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { useDemoRole } from "@/components/app-shell";
import { courseHref, useCourseCatalog } from "@/lib/local-content";

const styles: Record<string, { tile: string; bar: string; mark: string }> = {
  system: { tile: "bg-[#ebe8ff] text-[#675bea]", bar: "bg-[#7166f6]", mark: "S" },
  "python-backend": { tile: "bg-[#dff1fa] text-[#438dbb]", bar: "bg-[#5bb1db]", mark: "Py" },
  "ux-research": { tile: "bg-[#fff0e5] text-[#e79466]", bar: "bg-[#f1a77b]", mark: "Ux" },
  c: { tile: "bg-[#173b37] text-[#65d6a4]", bar: "bg-[#65d6a4]", mark: "C" },
  cpp: { tile: "bg-[#28305b] text-[#b8adff]", bar: "bg-[#b8adff]", mark: "C++" },
  java: { tile: "bg-[#3b3023] text-[#ffd175]", bar: "bg-[#ffd175]", mark: "J" },
  javascript: { tile: "bg-[#14283b] text-[#70e6ff]", bar: "bg-[#70e6ff]", mark: "JS" },
};

export function HomeCourseCards() {
  const courses = useCourseCatalog();
  const role = useDemoRole();
  return <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{courses.map((course) => { const style = styles[course.id] ?? { tile: "bg-[#e9f8f0] text-[#47a980]", bar: "bg-[#58bb91]", mark: course.title.slice(0, 2).toUpperCase() }; const progress = Math.round(course.completed / course.topics.length * 100); return <Link key={course.id} href={courseHref(course.id)} className="group rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_4px_18px_rgba(27,33,71,0.03)] transition-transform hover:-translate-y-1"><div className="flex items-start justify-between"><span className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold ${style.tile}`}>{style.mark}</span><Icon name="more" size={17} className="text-slate-300" /></div><p className="mt-5 text-sm font-bold uppercase tracking-[0.14em] text-[#655e89]">{course.category}</p><h3 className="mt-1 text-base font-bold">{course.title}</h3><p className="mt-1 min-h-9 text-sm leading-5 text-slate-500">{course.description}</p>{role !== "guest" && <><div className="mt-4 flex items-center justify-between text-sm"><span className="text-slate-500">{course.completed} из {course.topics.length} тем</span><span className="font-bold text-slate-700">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${style.bar}`} style={{ width: `${progress}%` }} /></div></>}</Link>; })}</div>;
}
