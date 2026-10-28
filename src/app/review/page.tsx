"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { demoQuestions } from "@/lib/demo-quiz";

export default function ReviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(demoQuestions.length).fill(-1));
  const current = demoQuestions[step];
  const selected = answers[step];

  function selectAnswer(index: number) {
    setAnswers((previous) => previous.map((answer, position) => position === step ? index : answer));
  }

  function continueQuiz() {
    if (selected < 0) return;
    if (step === demoQuestions.length - 1) {
      router.push(`/results?answers=${answers.join("-")}`);
    } else {
      setStep((previous) => previous + 1);
    }
  }

  return <AppShell active="review">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#655f83]">Интервальное повторение · демо</p><h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Время закрепить знания</h1><p className="mt-2 text-base leading-7 text-slate-600">Ответьте на пять вопросов и посмотрите результат. Ответы останутся только в этом браузере.</p></div>
      <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500"><Icon name="clock" size={16} /> ~5 минут</span>
    </div>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[24px] bg-[#1d2348] p-7 text-white sm:p-8">
          <div className="absolute -right-10 -top-20 size-65 rounded-full border border-white/10" /><div className="absolute right-10 top-4 size-40 rounded-full border border-white/10" />
          <div className="relative flex flex-wrap items-center gap-5"><div className="flex size-15 shrink-0 items-center justify-center rounded-2xl bg-[#756cf1] text-white"><Icon name="layers" size={28} /></div><div><p className="text-sm font-semibold text-[#c1bbff]">ПОВТОРЕНИЕ НА СЕГОДНЯ</p><h2 className="mt-1 text-2xl font-bold">5 вопросов по 3 темам</h2><p className="mt-1 text-sm text-[#bfc5df]">System Design · Python Backend</p></div><div className="ml-auto rounded-xl bg-white/10 px-4 py-3 text-center"><p className="text-2xl font-bold">{String(step + 1).padStart(2, "0")}<span className="text-sm text-[#beb8ff]">/05</span></p><p className="text-sm text-[#bfc5df]">вопрос</p></div></div>
          <div className="relative mt-7 flex gap-1.5" aria-label={`Вопрос ${step + 1} из 5`}>{demoQuestions.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#a59eff]" : "bg-white/20"}`} />)}</div>
        </section>

        <section className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_4px_20px_rgba(29,34,72,0.03)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 rounded-full bg-[#f0efff] px-3 py-1.5 text-sm font-semibold text-[#7166f6]"><Icon name="book" size={14} /> {current.roadmap} · {current.topic}</span><span className="text-sm font-medium text-slate-500">Вопрос {step + 1} из {demoQuestions.length}</span></div>
          <h2 className="mt-7 max-w-xl text-xl font-bold leading-8 tracking-[-0.025em] sm:text-2xl">{current.question}</h2><p className="mt-2 text-sm text-slate-500">Выберите один вариант ответа</p>
          <div className="mt-7 space-y-3" role="group" aria-label="Варианты ответа">{current.choices.map((choice, index) => <button key={choice} type="button" onClick={() => selectAnswer(index)} aria-pressed={selected === index} className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${selected === index ? "border-[#9d95f7] bg-[#f6f5ff] text-slate-800" : "border-slate-200 text-slate-600 hover:border-[#bcb6ff]"}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${selected === index ? "bg-[#756bf1] text-white" : "bg-[#f5f6fa] text-slate-500"}`}>{String.fromCharCode(65 + index)}</span><span>{choice}</span>{selected === index && <Icon name="check" size={17} className="ml-auto shrink-0 text-[#756bf1]" />}</button>)}</div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-6"><p className="text-sm text-slate-500">Ответ проверится после завершения всех вопросов.</p><button type="button" disabled={selected < 0} onClick={continueQuiz} className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-[#7166f6] px-5 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] hover:bg-[#6258e8] disabled:cursor-not-allowed disabled:opacity-40">{step === demoQuestions.length - 1 ? "Показать результат" : "Следующий вопрос"} <Icon name="arrow" size={15} /></button></div>
        </section>
      </div>

      <aside className="space-y-5"><section className="rounded-[22px] border border-slate-200/80 bg-white p-6"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#fff1e6] text-[#eb9b60]"><Icon name="flame" size={21} /></span><div><p className="text-sm font-bold">Серия: 3 дня</p><p className="mt-0.5 text-sm text-slate-500">Демо показатель</p></div></div><div className="mt-6 grid grid-cols-7 gap-1.5">{["П", "В", "С", "Ч", "П", "С", "В"].map((day, index) => <div key={index} className="text-center"><span className={`flex aspect-square items-center justify-center rounded-lg text-sm ${index < 3 ? "bg-[#e9e6ff] font-bold text-[#7166f6]" : "bg-[#f5f6f9] text-slate-500"}`}>{index < 3 ? <Icon name="check" size={13} /> : day}</span><p className="mt-1.5 text-sm text-slate-500">{day}</p></div>)}</div><p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-5 text-slate-500">Регулярное повторение помогает переносить знания в долгосрочную память.</p></section>
      <section className="rounded-[22px] border border-slate-200/80 bg-white p-6"><h2 className="text-sm font-bold">Сегодня повторяем</h2><div className="mt-5 space-y-4">{[{ name: "Кэширование", detail: "System Design · 2 вопроса", icon: "layers" as const, color: "bg-[#eeecff] text-[#7166f6]" }, { name: "Базы данных", detail: "System Design · 2 вопроса", icon: "map" as const, color: "bg-[#e6f3fa] text-[#5aa9d1]" }, { name: "FastAPI", detail: "Python Backend · 1 вопрос", icon: "book" as const, color: "bg-[#e6f7ed] text-[#50ae80]" }].map((item) => <div key={item.name} className="flex items-start gap-3"><span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}><Icon name={item.icon} size={16} /></span><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-sm text-slate-500">{item.detail}</p></div></div>)}</div></section><Link href="/roadmap" className="flex items-center justify-center gap-2 rounded-xl border border-[#e3e0ff] bg-[#f2f0ff] px-4 py-3 text-sm font-semibold text-[#7166f6]">Вернуться к карте <Icon name="arrow" size={15} /></Link></aside>
    </div>
  </AppShell>;
}
