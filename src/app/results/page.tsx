"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { parseDemoAnswers, questionPools, quizCourses, type QuizCourseId } from "@/lib/demo-quiz";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedCourse = searchParams.get("course");
  const initialCourse: QuizCourseId = quizCourses.some((course) => course.id === requestedCourse) ? requestedCourse as QuizCourseId : "system";
  const [courseId, setCourseId] = useState<QuizCourseId>(initialCourse);
  const [savedResults, setSavedResults] = useState<Partial<Record<QuizCourseId, number[]>>>({});
  const [historyLoaded, setHistoryLoaded] = useState(false);
  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem("mindloom-review-results-v1") ?? "{}");
      if (parsed && typeof parsed === "object") {
        const value = parsed as Record<string, { answers?: unknown }>;
        const results: Partial<Record<QuizCourseId, number[]>> = {};
        for (const course of quizCourses) {
          const answerList = value[course.id]?.answers;
          if (Array.isArray(answerList) && answerList.every((item) => Number.isInteger(item))) {
            const validated = parseDemoAnswers(answerList.join("-"), questionPools[course.id]);
            if (validated) results[course.id] = validated;
          }
        }
        setSavedResults(results);
      }
    } catch { setSavedResults({}); }
    setHistoryLoaded(true);
  }, []);
  function changeCourse(nextCourse: QuizCourseId) {
    setCourseId(nextCourse);
    router.replace(`/results?course=${nextCourse}`);
  }
  const questions = questionPools[courseId];
  const courseTitle = quizCourses.find((course) => course.id === courseId)?.title ?? "System Design";
  const submitted = courseId === initialCourse ? parseDemoAnswers(searchParams.get("answers"), questions) : null;
  const answers = submitted ?? savedResults[courseId] ?? null;
  const correctCount = answers?.filter((answer, index) => answer === questions[index].correct).length ?? 0;
  const percentage = Math.round(correctCount / questions.length * 100);
  const topics = Array.from(new Set(questions.map((question) => question.topic)));

  if (!historyLoaded && !answers) return <AppShell active="results"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Загружаем сохранённый результат…</div></AppShell>;

  if (!answers) return <AppShell active="results"><div className="mx-auto max-w-2xl rounded-[24px] border border-slate-200 bg-white p-7 sm:p-10"><p className="text-sm font-bold uppercase tracking-[0.14em] text-[#7166f6]">Результаты повторения</p><h1 className="mt-3 text-3xl font-bold">По курсу «{courseTitle}» пока нет результата</h1><p className="mt-3 leading-7 text-slate-600">Пройдите повторение по этому курсу. Ответы и разбор появятся здесь после завершения теста.</p><label className="mt-6 block text-sm font-semibold text-slate-700">Выбрать курс<select value={courseId} onChange={(event) => changeCourse(event.target.value as QuizCourseId)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-[#6258f4] outline-none focus:border-[#7166f6]">{quizCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><Link href={`/review?course=${courseId}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7166f6] px-5 py-3 text-sm font-bold text-white hover:bg-[#6257e6]">Пройти повторение <Icon name="arrow" size={15} /></Link></div></AppShell>;

  return <AppShell active="results">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#655f83]">Повторение · {courseTitle}</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Ваш результат</h1><p className="mt-2 text-base leading-7 text-slate-600">Последнее завершённое повторение по выбранному курсу.</p></div><label className="text-sm font-semibold text-slate-600">Курс<select value={courseId} onChange={(event) => changeCourse(event.target.value as QuizCourseId)} className="ml-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-bold text-[#6258f4] outline-none">{quizCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label></div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[24px] bg-[#1d2348] p-7 text-white sm:p-9"><div className="absolute -right-12 -top-28 size-80 rounded-full border border-white/10" /><div className="absolute right-12 top-4 size-48 rounded-full border border-white/10" /><div className="relative flex flex-wrap items-center gap-7"><div className="flex size-34 shrink-0 items-center justify-center rounded-full p-2" style={{ background: `conic-gradient(#a7a0ff ${percentage}%, rgba(255,255,255,.14) 0)` }}><div className="flex size-full flex-col items-center justify-center rounded-full bg-[#1d2348]"><strong className="text-3xl">{percentage}%</strong><span className="text-sm text-[#bfc5df]">верных ответов</span></div></div><div><p className="text-sm font-semibold uppercase tracking-[0.13em] text-[#b8b1ff]">Тест завершён · {courseTitle}</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">{correctCount >= 4 ? "Отличная работа!" : correctCount >= 2 ? "Хорошее начало!" : "Продолжайте практиковаться"}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#c4c9df]">Вы ответили правильно на {correctCount} из {questions.length} вопросов. Ниже — разбор каждого ответа.</p><Link href={`/review?course=${courseId}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#8178ff] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#7166f4]">Пройти ещё раз <Icon name="arrow" size={15} /></Link></div></div></section>
        <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 sm:p-8"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Разбор ответов</h2><p className="mt-1 text-sm text-slate-500">{questions.length} вопросов по {topics.length} темам</p></div><span className="text-sm font-semibold text-[#7166f6]">{correctCount}/{questions.length}</span></div><div className="mt-6 divide-y divide-slate-100">{questions.map((item, index) => { const isCorrect = answers[index] === item.correct; return <article key={item.question} className="flex gap-4 py-5 first:pt-0 last:pb-0"><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isCorrect ? "bg-[#e5f7ed] text-[#3aab78]" : "bg-[#fff0eb] text-[#eb8a6b]"}`}>{isCorrect ? <Icon name="check" size={18} /> : <span className="text-lg leading-none">×</span>}</span><div className="min-w-0"><p className="text-sm font-bold uppercase tracking-[0.13em] text-[#655e89]">{item.roadmap} · {item.topic}</p><h3 className="mt-1.5 text-sm font-semibold leading-6">{item.question}</h3><p className="mt-2 text-sm text-slate-500">Ваш ответ: <span className={isCorrect ? "font-semibold text-[#3aab78]" : "font-semibold text-[#e47b5c]"}>{item.choices[answers[index]]}</span></p>{!isCorrect && <p className="mt-1 text-sm text-slate-500">Верный ответ: <span className="font-semibold text-[#3aab78]">{item.choices[item.correct]}</span></p>}<p className="mt-2 text-sm leading-5 text-slate-500">{item.explanation}</p></div></article>; })}</div></section>
      </div>

      <aside className="space-y-5"><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-slate-200/80 bg-white p-5"><span className="flex size-8 items-center justify-center rounded-lg bg-[#e5f7ed] text-[#3aab78]"><Icon name="check" size={17} /></span><p className="mt-4 text-2xl font-bold">{correctCount}</p><p className="mt-1 text-sm text-slate-500">Верно</p></div><div className="rounded-2xl border border-slate-200/80 bg-white p-5"><span className="flex size-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#eb8a6b]"><Icon name="info" size={17} /></span><p className="mt-4 text-2xl font-bold">{questions.length - correctCount}</p><p className="mt-1 text-sm text-slate-500">На повторение</p></div></div><section className="rounded-[22px] border border-slate-200/80 bg-white p-6"><h2 className="text-sm font-bold">По темам</h2><div className="mt-5 space-y-5">{topics.map((topic) => { const items = questions.map((item, index) => ({ item, index })).filter(({ item }) => item.topic === topic); const topicCorrect = items.filter(({ item, index }) => answers[index] === item.correct).length; return <div key={topic}><div className="flex justify-between text-sm"><span className="font-medium text-slate-600">{topic}</span><span className="text-slate-500">{topicCorrect}/{items.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#7166f6]" style={{ width: `${topicCorrect / items.length * 100}%` }} /></div></div>; })}</div></section><div className="rounded-[20px] bg-[#eeecff] p-5"><div className="flex items-center gap-2 text-[#7166f6]"><Icon name="sparkles" size={17} /><span className="text-sm font-bold">Что дальше?</span></div><p className="mt-2 text-sm leading-5 text-slate-600">Откройте карту, чтобы ещё раз пройти темы, где были ошибки.</p><Link href={courseId === "system" ? "/roadmap" : `/roadmap/${courseId}`} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#7166f6]">К карте знаний <Icon name="arrow" size={14} /></Link></div><p className="text-center text-sm leading-5 text-slate-500">Результат рассчитан только в браузере. Данные не сохраняются.</p></aside>
    </div>
  </AppShell>;
}

export default function ResultsPage() {
  return <Suspense fallback={<AppShell active="results"><div className="rounded-2xl bg-white p-8 text-sm text-slate-500">Подготавливаем результат...</div></AppShell>}><ResultsContent /></Suspense>;
}
