"use client";

import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { useDemoRole } from "@/components/app-shell";
import { useCourseCatalog, useSavedCourseIds } from "@/lib/local-content";

export function HomeCourseCards() {
  const courses = useCourseCatalog();
  const role = useDemoRole();
  const savedIds = useSavedCourseIds();
  const relevantCourses = role === "guest"
    ? courses.slice(0, 3)
    : courses.filter((course) => course.completed > 0 || savedIds.includes(course.id)).slice(0, 3);

  if (relevantCourses.length === 0) return <div className="rounded-2xl border border-dashed border-[#344360] bg-[#10182c] p-6 text-center"><p className="text-sm text-slate-400">Сохраните курс из каталога, чтобы он появился здесь.</p><Link href="/catalog" className="mt-3 inline-flex text-sm font-bold text-[#70e6ff]">Открыть каталог →</Link></div>;

  return <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{relevantCourses.map((course) => <CourseCard key={course.id} course={course} />)}</div>;
}
