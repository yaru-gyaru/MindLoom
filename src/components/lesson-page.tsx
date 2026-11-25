"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { JavaCodeCell } from '@/components/java-code-cell';
import { courseHref, saveCourse, useClientReady, useCourseCatalog } from "@/lib/local-content";
import { topicLearningMaterial } from "@/lib/roadmap-courses";

function LessonContent({ content }: { content: string }) {
  return <div className="space-y-5">{content.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
    const lines = block.split("\n").filter(Boolean);
    const first = lines[0];
    if (lines.length === 1 && first === first.toUpperCase() && first.length < 80) return <h3 key={index} className="border-l-4 border-[#efaa45] pl-3 text-xs font-extrabold tracking-[0.13em] text-[#75533a]">{first}</h3>;
    if (lines.every((line) => /^\d+\./.test(line))) return <ol key={index} className="space-y-3">{lines.map((line) => { const [, number, text] = line.match(/^(\d+)\.\s*(.*)$/) ?? []; return <li key={number} className="flex items-start gap-3 text-[15px] leading-7 text-slate-700"><span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#3b3023] text-xs font-extrabold text-[#9a6724]">{number}</span><span>{text}</span></li>; })}</ol>;
    const looksLikeCode = lines.length > 1 && lines.some((line) => /^(from |import |def |class |if |for |return |print\(|SELECT |GET |POST |PATCH |DELETE |FROM |WHERE |assert |#|int main|int |double |char |std::|public class|public static|static int|interface |List<|const |let |export |try \{|for \(const )/.test(line));
    if (looksLikeCode) return <pre key={index} className="overflow-x-auto rounded-xl bg-[#302738] p-4 font-mono text-sm leading-6 text-[#f4edf8]"><code>{block}</code></pre>;
    return <p key={index} className="whitespace-pre-line text-[15px] leading-8 text-slate-700 sm:text-base">{block}</p>;
  })}</div>;
}

function highlightCode(code: string, language: string) {
  const keywords = new Set((language === "python"
    ? "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case"
    : language === "sql"
      ? "select from where insert into values update set delete create table index join inner left right on as group by order having limit offset distinct primary key foreign references not null default count sum avg"
      : "abstract arguments as async await break case catch class const continue debugger default delete do else enum export extends false final finally for from function get if implements import in instanceof interface let new null package private protected public raise return set static super switch this throw throws true try typeof undefined var void while with yield")
    .toLowerCase().split(/\s+/));
  const literals = new Set(["true", "false", "none", "null", "undefined", "nan", "self", "this"]);
  const builtins = new Set("print len range str int float list dict set tuple bool open input type super isinstance enumerate zip map filter sorted sum min max abs round any all".split(" "));
  const bashKeywords = new Set("if then else elif fi for do done case esac in function export local return exit echo cd source sudo apt npm npx pip python python3 uvicorn".split(" "));
  const tokens = code.match(/(?:#.*|\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|@[\w.]+|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|\s+|.)/g) ?? [];
  return tokens.map((token, index) => {
    let color = "";
    const lower = token.toLowerCase();
    if (/^(#|\/\/|\/\*)/.test(token)) color = "text-[#718096] italic";
    else if (/^(\"|'|`)/.test(token)) color = "text-[#a8d88d]";
    else if (/^\d/.test(token)) color = "text-[#f2a77b]";
    else if (token.startsWith("@")) color = "text-[#e4a8ff]";
    else if (/^[A-Za-z_$]/.test(token)) {
      if (keywords.has(lower) || ((language === "bash" || language === "terminal") && bashKeywords.has(lower))) color = "text-[#c792ea]";
      else if (literals.has(lower)) color = "text-[#ff9e80]";
      else if (builtins.has(lower) || tokens.slice(index + 1).join("").match(/^\s*\(/)) color = "text-[#82aaff]";
      else if (/^[A-Z]/.test(token)) color = "text-[#ffcb6b]";
    } else if (/^[=+\-*%<>!&|^~?:]+$/.test(token)) color = "text-[#89ddff]";
    return color ? <span key={index} className={color}>{token}</span> : token;
  });
}

function LectureCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  const label = language === "terminal" ? "Терминал" : language.toUpperCase();
  return <div className="mt-6 overflow-hidden rounded-2xl border border-[#394967] bg-[#080d19]"><div className="flex items-center justify-between border-b border-[#394967] px-4 py-3"><span className="font-semibold text-[#d8e7ff]">{label}</span><button type="button" onClick={copyCode} title={copied ? "Скопировано" : "Копировать код"} aria-label={copied ? "Код скопирован" : "Копировать код"} className="flex size-9 items-center justify-center rounded-lg border border-[#394967] text-[#9feaff] transition hover:bg-[#17223b]">{copied ? <Icon name="check" size={18} /> : <Icon name="copy" size={18} />}</button></div><pre className="overflow-x-auto p-4 font-mono text-sm leading-6 text-[#d8e7ff]"><code>{highlightCode(code, language)}</code></pre></div>;
}

export function LessonPage({ courseId, topicNumber }: { courseId: string; topicNumber: number }) {
  const catalog = useCourseCatalog();
  const ready = useClientReady();
  const course = catalog.find((item) => item.id === courseId);
  const topicIndex = topicNumber - 1;
  const topic = course?.topics[topicIndex];
  const track = courseId === "system" ? "system" : courseId === "python-backend" ? "python" : courseId === "ux-research" ? "ux" : "general";
  const material = useMemo(() => topic ? topicLearningMaterial(topic, track) : null, [topic, track]);
  const answerKey = `mindloom-practice-${encodeURIComponent(courseId)}-${topicNumber}`;
  const [answer, setAnswer] = useState("");
  const [answerLoaded, setAnswerLoaded] = useState(false);
  const [progressStatus, setProgressStatus] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      let localAnswer = "";
      try {
        localAnswer = window.localStorage.getItem(answerKey) ?? "";
        if (!cancelled) setAnswer(localAnswer);
        const response = await fetch("/api/progress", { cache: "no-store" });
        if (response.ok) {
          const progress = await response.json() as { answers?: Record<string, string>; completed?: string[] };
          if (!cancelled) {
            const savedAnswer = progress.answers?.[`${courseId}:${topicNumber}`];
            if (typeof savedAnswer === "string") setAnswer(savedAnswer);
            if (progress.completed?.includes(`${courseId}:${topicNumber}`) && course && topicIndex >= course.completed) {
              saveCourse(courseId, { title: course.title, category: course.category, description: course.description, completed: Math.min(topicIndex + 1, course.topics.length), stages: course.stages, topics: course.topics, tags: course.tags });
            }
          }
        }
      } catch {
        if (!cancelled) setAnswer(localAnswer);
      } finally {
        if (!cancelled) {
          setAnswerLoaded(true);
        }
      }
    }
    void loadProgress();
    return () => { cancelled = true; };
  }, [answerKey, course, courseId, topicIndex, topicNumber]);

  useEffect(() => {
    if (!answerLoaded) return;
    try { window.localStorage.setItem(answerKey, answer); } catch { /* Local notes are optional. */ }
  }, [answer, answerKey, answerLoaded]);

  useEffect(() => {
    if (!answerLoaded) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: `${courseId}:${topicNumber}`, action: "answer", answer }),
      }).then((response) => {
        if (response.status === 401) setProgressStatus("Войдите в аккаунт, чтобы сохранить ответ на сервере. Копия остаётся в этом браузере.");
        else if (!response.ok) setProgressStatus("Не удалось сохранить ответ на сервере. Он пока сохранён в этом браузере.");
        else setProgressStatus("");
      }).catch(() => setProgressStatus("Не удалось сохранить ответ на сервере. Он пока сохранён в этом браузере."));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answer, answerLoaded, courseId, topicNumber]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-sm text-slate-500">Открываем урок…</div>;

  if (!course || !topic || !material) return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] px-5 text-center"><h1 className="text-2xl font-bold">Урок не найден</h1><p className="mt-2 text-slate-500">Проверьте курс и номер темы.</p><Link href={course ? courseHref(courseId) : "/"} className="mt-5 rounded-xl bg-[#7166f6] px-5 py-3 text-sm font-semibold text-white">{course ? "Вернуться к курсу" : "К курсам"}</Link></main>;

  const locked = false;
  const completed = topicIndex < course.completed;
  const previousHref = topicIndex > 0 ? `/learn/${encodeURIComponent(courseId)}/${topicNumber - 1}` : undefined;
  const nextHref = topicNumber < course.topics.length && topicNumber <= course.completed ? `/learn/${encodeURIComponent(courseId)}/${topicNumber + 1}` : undefined;

  async function completeLesson() {
    if (!course) return;
    setCompleting(true);
    setProgressStatus("");
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: `${courseId}:${topicNumber}`, action: "complete" }),
      });
      if (!response.ok) throw new Error("Could not save progress");
    } catch {
      setProgressStatus("Не удалось сохранить прогресс. Войдите в аккаунт и проверьте подключение к серверу.");
      setCompleting(false);
      return;
    }
    if (topicIndex === course.completed) {
      saveCourse(courseId, { title: course.title, category: course.category, description: course.description, completed: Math.min(course.completed + 1, course.topics.length), stages: course.stages, topics: course.topics, tags: course.tags });
    }
    setCompleting(false);
  }

  const isPython = track === "python";
  const moduleNumber = Math.min(Math.ceil(topicNumber / 3), 5);
  const lectureBlocks = topic.lectureBlocks?.length ? topic.lectureBlocks : [
    { type: "text" as const, text: material.lecture },
    ...(topic.lectureCodeBlocks ?? (topic.lectureCode ? [topic.lectureCode] : [])).map((block) => ({ type: "code" as const, ...block })),
    ...(topic.codeCell ? [{ type: "runner" as const, ...topic.codeCell }] : []),
  ];
  return <main className="learn-page min-h-screen bg-[#fff9ed] text-[#2d2433]">
    <header className="sticky top-0 z-20 border-b border-[#45324a] bg-[#34233a] text-white shadow-sm">
      <div className="mx-auto flex h-[68px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8"><Link href={courseHref(courseId)} className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-bold text-white/85 hover:bg-[#10182c]/10"><Icon name="chevron" size={15} className="rotate-180" /><span className="hidden sm:inline">К карте курса</span><span className="sm:hidden">Назад</span></Link><div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="max-w-52 truncate font-bold">{course.title}</span><span className="text-white/40">/</span><span className="max-w-72 truncate text-white/70">{topic.title}</span></div><span className="rounded-full border border-[#ffd77b]/40 bg-[#ffd77b]/15 px-3 py-1.5 text-xs font-extrabold tracking-wide text-[#ffda83]">✦ +50 XP</span></div>
      <div className="h-1 bg-[#10182c]/10"><div className="h-full bg-[#ffc75e] transition-all" style={{ width: `${Math.round((course.completed / course.topics.length) * 100)}%` }} /></div>
    </header>

    <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8 lg:py-9">
      <section className="min-w-0">
        <div className="mb-5 rounded-[22px] border-2 border-[#493950] bg-[#fff] p-6 shadow-[5px_5px_0_#493950] sm:p-8"><div className="flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#866c8a]"><span className="rounded-full bg-[#28305b] px-3 py-1.5 text-[#7053a0]">{courseId === "system" ? `Модуль ${moduleNumber}` : `Уровень ${Math.floor(topicIndex / 5) + 1}`}</span><span>Миссия {String(topicNumber).padStart(2, "0")}</span></div><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-5xl">{topic.title}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{topic.summary}</p><div className="mt-6 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#344360]"><div className="h-full rounded-full bg-[#9b76d1]" style={{ width: `${Math.round((topicNumber / course.topics.length) * 100)}%` }} /></div><span className="text-xs font-extrabold text-[#72577c]">{topicNumber}/{course.topics.length}</span></div></div>

        {locked ? <div className="rounded-[22px] border-2 border-[#493950] bg-[#10182c] p-8 shadow-[5px_5px_0_#493950]"><h2 className="text-xl font-bold">РћС‚РєСЂРѕР№С‚Рµ РїСЂРµРґС‹РґСѓС‰СѓСЋ РјРёСЃСЃРёСЋ</h2><p className="mt-2 text-sm leading-6 text-slate-500">Р­С‚Р° С‚РµРјР° СЃС‚Р°РЅРµС‚ РґРѕСЃС‚СѓРїРЅР° РїРѕСЃР»Рµ Р·Р°РІРµСЂС€РµРЅРёСЏ РїСЂРµРґС‹РґСѓС‰РµР№.</p><Link href={courseHref(courseId)} className="mt-5 inline-flex rounded-xl bg-[#7253a1] px-5 py-3 text-sm font-bold text-white">Р’РµСЂРЅСѓС‚СЊСЃСЏ Рє РєР°СЂС‚Рµ</Link></div> : <>
          <article id="lesson" className="scroll-mt-24 rounded-[22px] border-2 border-[#493950] bg-[#10182c] p-6 shadow-[5px_5px_0_#493950] sm:p-8"><div className="mb-6 flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#28305b] text-[#b8adff]"><Icon name="layers" size={21} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#856c91]">Изучаем</p><h2 className="mt-0.5 text-xl font-extrabold">Лекция</h2></div></div>{lectureBlocks.map((block, index) => block.type === "text" ? <LessonContent key={`text-${index}`} content={block.text} /> : block.type === "code" ? block.code.trim() ? <LectureCodeBlock key={`code-${index}`} language={block.language} code={block.code} /> : null : <div key={`runner-${index}`}><JavaCodeCell courseId={courseId} topicNumber={topicNumber} cellId={`${topicNumber}-${index}`} starterCode={block.code} /></div>)}{topic.lectureImage && <figure className="mt-6"><img src={topic.lectureImage} alt={topic.lectureImageAlt || topic.title} className="max-h-[560px] w-full rounded-xl border border-[#394967] object-contain" />{topic.lectureImageAlt && <figcaption className="mt-2 text-sm text-slate-400">{topic.lectureImageAlt}</figcaption>}</figure>}</article>

          <article id="practice" className="mt-6 scroll-mt-24 overflow-hidden rounded-[22px] border-2 border-[#493950] bg-[#10182c] shadow-[5px_5px_0_#493950]"><div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#eee7f0] bg-[#17223b] px-6 py-5 sm:px-8"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#173b37] text-[#4b853e]"><Icon name="check" size={20} /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#71896b]">Практика</p><h2 className="text-xl font-extrabold">Твоя миссия</h2></div></div><span className="rounded-full bg-[#3b3023] px-3 py-1.5 text-xs font-extrabold text-[#936126]">Награда · 50 XP</span></div><div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.85fr)]"><div className="p-6 sm:p-8"><LessonContent content={material.practice} /></div><div className="border-t-2 border-[#eee7f0] bg-[#faf8fc] p-5 sm:p-7 lg:border-l-2 lg:border-t-0"><div className="mb-3 flex items-center justify-between gap-3"><label htmlFor="practice-answer" className="text-sm font-extrabold">{isPython ? "Твой код" : "Твоё решение"}</label><span className="rounded-md bg-[#34233a] px-2 py-1 font-mono text-[10px] font-bold text-[#ffe095]">{isPython ? "PYTHON" : "ЗАМЕТКИ"}</span></div><textarea id="practice-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={12} spellCheck={!isPython} placeholder={isPython ? "# Напиши решение задания здесь\n\ndef main():\n    " : "Запиши ход решения, выводы и вопросы по заданию…"} className={`w-full resize-y rounded-xl border-2 border-[#493950] bg-[#302738] p-4 text-sm leading-6 text-[#f4edf8] outline-none placeholder:text-white/40 focus:border-[#9b76d1] focus:ring-4 focus:ring-[#9b76d1]/15 ${isPython ? "font-mono" : "font-sans"}`} /><p className="mt-2 text-xs leading-5 text-slate-500">Ответ сохраняется в браузере автоматически. Можно вернуться к нему позже.</p></div></div></article>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-2 border-[#493950] bg-[#fff] p-5 shadow-[4px_4px_0_#493950]"><div><p className="text-sm font-semibold text-slate-600">{completed ? "Миссия завершена. Отличная работа!" : "Готово? Заверши миссию и открой следующий уровень."}</p>{progressStatus && <p role="status" className="mt-2 text-sm text-rose-700">{progressStatus}</p>}</div><div className="flex flex-wrap gap-2">{!completed && <button type="button" disabled={completing} onClick={completeLesson} className="rounded-xl bg-[#7253a1] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#60448a] disabled:opacity-60">{completing ? "Сохраняем…" : "Завершить миссию · +50 XP"}</button>}{nextHref && <Link href={nextHref} className="rounded-xl border-2 border-[#493950] bg-[#3b3023] px-5 py-3 text-sm font-extrabold text-[#68441a] hover:bg-[#ffe7aa]">Следующая миссия →</Link>}</div></div>
        </>}
      </section>

      <aside className="lg:sticky lg:top-[92px] lg:max-h-[calc(100vh-112px)] lg:self-start"><section className="overflow-hidden rounded-[22px] border-2 border-[#493950] bg-[#10182c] shadow-[5px_5px_0_#493950]"><div className="border-b-2 border-[#eee7f0] bg-[#17223b] p-5"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#856c91]">Твой маршрут</p><h2 className="mt-1 text-lg font-extrabold">Миссии курса</h2><p className="mt-1 text-sm font-medium text-slate-500">{course.completed} из {course.topics.length} пройдено</p></div><nav aria-label="Темы курса" className="max-h-[calc(100vh-260px)] space-y-1 overflow-y-auto p-3">{course.topics.map((item, index) => { const isActive = index === topicIndex; const href = `/learn/${encodeURIComponent(courseId)}/${index + 1}`; return <Link key={`${index}-${item.title}`} href={href} aria-current={isActive ? "page" : undefined} className={`flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${isActive ? "bg-[#28305b] text-[#d5c9ff]" : "text-slate-600 hover:bg-[#1b2941]"}`}><span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${isActive ? "bg-[#10182c] text-[#b8adff]" : index < course.completed ? "bg-[#173b37] text-[#4b853e]" : "bg-[#24334c] text-slate-500"}`}>{index < course.completed ? <Icon name="check" size={14} /> : index + 1}</span><span className="pt-1 text-sm font-bold leading-5">{item.title}</span></Link>; })}</nav></section><div className="mt-5 rounded-[18px] border-2 border-[#493950] bg-[#3b3023] p-5 shadow-[4px_4px_0_#493950]"><p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#936126]">Подсказка</p><p className="mt-2 text-sm font-medium leading-6 text-[#68441a]">Сначала разберись с идеей, затем выполни миссию своими словами или кодом. Ошибки — часть обучения.</p></div></aside>
    </div>
  </main>;
}

