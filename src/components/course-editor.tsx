"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useClientReady, useCourseCatalog, saveCourse, type CourseEntry } from "@/lib/local-content";
import { topicLearningMaterial, type CourseConfig, type CourseTopic } from "@/lib/roadmap-courses";

const javaStarter = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java!\");\n    }\n}";
const courseCategories = ["Разработка", "Языки программирования", "Веб-разработка", "Backend-разработка", "Дизайн", "Работа с данными"];
const lectureCodeLanguages = ["text", "javascript", "typescript", "python", "java", "c", "cpp", "sql", "html", "css"];

function trackForCourse(id?: string) {
  if (id === "system") return "system";
  if (id === "python-backend") return "python";
  if (id === "ux-research") return "ux";
  return "general";
}

function CourseForm({ existing }: { existing?: CourseEntry }) {
  const router = useRouter();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [useCustomCategory, setUseCustomCategory] = useState(Boolean(existing?.category && !courseCategories.includes(existing.category)));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [tags, setTags] = useState(existing?.tags.join(", ") ?? "");
  const [topics, setTopics] = useState<CourseTopic[]>(existing?.topics.map((topic) => ({ ...topic, ...topicLearningMaterial(topic, trackForCourse(existing.id)) })) ?? [{ title: "", summary: "", minutes: 25, lecture: "", practice: "" }]);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [topicToReveal, setTopicToReveal] = useState<number | null>(null);
  const topicRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (topicToReveal === null) return;
    topicRefs.current[topicToReveal]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTopicToReveal(null);
  }, [topicToReveal, topics.length]);

  function updateTopic(index: number, patch: Partial<CourseTopic>) {
    setTopics((current) => current.map((topic, topicIndex) => topicIndex === index ? { ...topic, ...patch } : topic));
  }

  function uploadLectureImage(index: number, file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Выберите файл изображения."); return; }
    if (file.size > 1_000_000) { setError("Изображение должно быть меньше 1 МБ. Для больших файлов вставьте ссылку на изображение."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateTopic(index, { lectureImage: reader.result, lectureImageAlt: file.name.replace(/\.[^.]+$/, "") });
        setError("");
      }
    };
    reader.onerror = () => setError("Не удалось загрузить изображение.");
    reader.readAsDataURL(file);
  }

  function moveTopic(index: number, step: number) {
    const target = index + step;
    if (target < 0 || target >= topics.length) return;
    setTopics((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !category.trim() || !description.trim()) { setError("Заполните название, категорию и описание курса."); return; }
    if (topics.some((topic) => !topic.title.trim() || !topic.summary.trim())) { setError("У каждой темы нужны название и краткое описание."); return; }
    const cleanTopics = topics.map((topic) => ({
      ...topic,
      title: topic.title.trim(),
      summary: topic.summary.trim(),
      minutes: Math.max(5, Number(topic.minutes) || 25),
      lecture: topic.lecture?.trim() ?? "",
      practice: topic.practice?.trim() ?? "",
      ...(topic.lectureImage?.trim() ? { lectureImage: topic.lectureImage.trim(), lectureImageAlt: topic.lectureImageAlt?.trim() ?? "" } : { lectureImage: undefined, lectureImageAlt: undefined }),
      ...(topic.lectureCode?.code.trim() ? { lectureCode: { language: topic.lectureCode.language, code: topic.lectureCode.code.trim() } } : { lectureCode: undefined }),
      ...(topic.codeCell ? { codeCell: { language: "java" as const, code: topic.codeCell.code.trim() || javaStarter } } : {}),
    }));
    const config: CourseConfig = { title: title.trim(), category: category.trim(), description: description.trim(), tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), topics: cleanTopics, completed: Math.min(existing?.completed ?? 0, cleanTopics.length - 1), stages: existing?.stages ?? [] };
    const id = existing?.id ?? "course-" + Date.now().toString(36);
    saveCourse(id, config);
    setError("");
    setSavedMessage("Курс сохранён. Можно продолжить редактирование.");
    if (!existing) router.replace(`/admin/courses/${encodeURIComponent(id)}/edit`);
  }

  function addTopic() {
    const newIndex = topics.length;
    setTopics((current) => [...current, { title: "", summary: "", minutes: 25, lecture: "", practice: "" }]);
    setTopicToReveal(newIndex);
    setSavedMessage("");
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-[#7166f6]";
  const topicFieldClass = "mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-6 outline-none focus:border-[#7166f6]";

  return <form onSubmit={submit} className="space-y-6">
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-7">
      <h2 className="text-lg font-bold">Информация о курсе</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, Frontend Development" className={fieldClass} /></label>
        <label className="text-sm font-semibold text-slate-700">Категория курса<select value={useCustomCategory ? "__custom" : category} onChange={(event) => { if (event.target.value === "__custom") { setUseCustomCategory(true); if (courseCategories.includes(category)) setCategory(""); } else { setUseCustomCategory(false); setCategory(event.target.value); } }} className={fieldClass}><option value="">Выберите категорию</option>{courseCategories.map((item) => <option key={item} value={item}>{item}</option>)}<option value="__custom">Своя категория…</option></select>{useCustomCategory && <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Например, Data Engineering" className={fieldClass} />}</label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Описание<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="О чём этот курс и чему он учит" className={fieldClass} /></label>
      <label className="mt-4 block text-sm font-semibold text-slate-700">Метки через запятую<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="API, базы данных, практика" className={fieldClass} /></label>
    </section>

    <section className="rounded-[22px] border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Темы курса</h2><p className="mt-1 text-sm text-slate-500">Здесь редактируются лекция, практика и пример кода каждой темы.</p></div><button type="button" onClick={addTopic} className="rounded-xl border border-[#dedaff] px-4 py-2 text-sm font-semibold text-[#665be8] hover:bg-[#f5f3ff]">+ Добавить тему</button></div>
      <div className="mt-5 space-y-4">
        {topics.map((topic, index) => <div key={index} ref={(element) => { topicRefs.current[index] = element; }} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-[#fafbfe] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold text-[#7166f6]">Тема {String(index + 1).padStart(2, "0")}</span><div className="flex gap-1"><button type="button" onClick={() => moveTopic(index, -1)} disabled={index === 0} aria-label={"Переместить тему " + (index + 1) + " выше"} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-white disabled:opacity-35">↑</button><button type="button" onClick={() => moveTopic(index, 1)} disabled={index === topics.length - 1} aria-label={"Переместить тему " + (index + 1) + " ниже"} className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-white disabled:opacity-35">↓</button><button type="button" onClick={() => setTopics((current) => current.filter((_, topicIndex) => topicIndex !== index))} disabled={topics.length === 1} className="rounded-lg px-2 py-1 text-sm text-rose-600 hover:bg-rose-50 disabled:opacity-35">Удалить тему</button></div></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
            <label className="text-xs font-semibold text-slate-600">Название<input value={topic.title} onChange={(event) => updateTopic(index, { title: event.target.value })} placeholder="Название темы" className={topicFieldClass} /></label>
            <label className="text-xs font-semibold text-slate-600">Минуты<input type="number" min={5} max={240} value={topic.minutes} onChange={(event) => updateTopic(index, { minutes: Number(event.target.value) })} className={topicFieldClass} /></label>
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-600">Краткое описание<textarea value={topic.summary} onChange={(event) => updateTopic(index, { summary: event.target.value })} rows={2} placeholder="Что узнает пользователь" className={topicFieldClass} /></label>
          <label className="mt-3 block text-xs font-semibold text-slate-600">Текст лекции<textarea value={topic.lecture ?? ""} onChange={(event) => updateTopic(index, { lecture: event.target.value })} rows={8} placeholder="Объяснение, термины и примеры для урока" className={topicFieldClass + " font-mono"} /></label>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-slate-700">Изображение в лекции <span className="font-normal text-slate-500">(необязательно)</span></p><p className="mt-1 text-xs font-normal text-slate-500">Добавьте иллюстрацию, схему или скриншот.</p></div>{topic.lectureImage && <button type="button" onClick={() => updateTopic(index, { lectureImage: undefined, lectureImageAlt: undefined })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600">Убрать изображение</button>}</div>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Ссылка на изображение<input type="url" value={topic.lectureImage?.startsWith("data:") ? "" : topic.lectureImage ?? ""} onChange={(event) => updateTopic(index, { lectureImage: event.target.value || undefined })} placeholder="https://…" className={topicFieldClass} /></label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Или загрузить файл<input type="file" accept="image/*" onChange={(event) => uploadLectureImage(index, event.target.files?.[0])} className="mt-2 block w-full text-xs font-normal text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e9f8fb] file:px-3 file:py-2 file:font-semibold file:text-[#1687a0]" /></label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Описание изображения<input value={topic.lectureImageAlt ?? ""} onChange={(event) => updateTopic(index, { lectureImageAlt: event.target.value })} placeholder="Что изображено" className={topicFieldClass} /></label>
            {topic.lectureImage && <img src={topic.lectureImage} alt={topic.lectureImageAlt || "Предпросмотр изображения лекции"} className="mt-3 max-h-52 rounded-lg border border-slate-200 object-contain" />}
          </div>
          {topic.lectureCode ? <div className="mt-4 rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-slate-700">Пример кода в лекции</p><button type="button" onClick={() => updateTopic(index, { lectureCode: undefined })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600">Убрать пример</button></div><label className="mt-3 block text-xs font-semibold text-slate-600">Язык<select value={topic.lectureCode.language} onChange={(event) => updateTopic(index, { lectureCode: { ...topic.lectureCode!, language: event.target.value } })} className={topicFieldClass}>{lectureCodeLanguages.map((language) => <option key={language} value={language}>{language === "text" ? "Текст" : language.toUpperCase()}</option>)}</select></label><label className="mt-3 block text-xs font-semibold text-slate-600">Код<textarea value={topic.lectureCode.code} onChange={(event) => updateTopic(index, { lectureCode: { ...topic.lectureCode!, code: event.target.value } })} rows={7} spellCheck={false} className={topicFieldClass + " font-mono"} placeholder="Напишите пример кода" /></label></div> : <button type="button" onClick={() => updateTopic(index, { lectureCode: { language: "javascript", code: "" } })} className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#1687a0] hover:bg-[#e9f8fb]">+ Пример кода в лекции</button>}
          <label className="mt-3 block text-xs font-semibold text-slate-600">Практическое задание<textarea value={topic.practice ?? ""} onChange={(event) => updateTopic(index, { practice: event.target.value })} rows={4} placeholder="Задание для самостоятельной работы" className={topicFieldClass} /></label>
          {topic.codeCell ? <div className="mt-4 rounded-xl border border-[#394967] bg-[#10182c] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-white">Ячейка с кодом</p><p className="mt-1 text-xs text-slate-400">Java · ученик сможет изменить код и запустить его в уроке</p></div><button type="button" onClick={() => updateTopic(index, { codeCell: undefined })} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">Убрать ячейку</button></div>
            <textarea aria-label={"Стартовый код Java для темы " + (index + 1)} value={topic.codeCell.code} onChange={(event) => updateTopic(index, { codeCell: { language: "java", code: event.target.value } })} rows={8} spellCheck={false} className="mt-3 w-full resize-y rounded-lg border border-slate-600 bg-[#080d19] p-3 font-mono text-sm leading-6 text-[#d8e7ff] outline-none focus:border-[#70e6ff]" />
          </div> : <button type="button" onClick={() => updateTopic(index, { codeCell: { language: "java", code: javaStarter } })} className="mt-4 rounded-lg border border-[#394967] px-3 py-2 text-sm font-semibold text-[#1687a0] hover:bg-[#e9f8fb]">+ Ячейка с кодом</button>}
        </div>)}
      </div>
    </section>

    {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}{savedMessage && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{savedMessage}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">Новый курс появится первым в списке. Изменения сохраняются в этом браузере.</p><div className="flex gap-2"><Link href="/admin" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Отмена</Link><button type="submit" className="rounded-xl bg-[#7166f6] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6257e6]">Сохранить курс</button></div></div>
  </form>;
}

export function CourseEditor({ courseId }: { courseId?: string }) {
  const catalog = useCourseCatalog();
  const ready = useClientReady();
  const existing = courseId ? catalog.find((course) => course.id === courseId) : undefined;
  return <AppShell active="admin"><div className="mb-6"><Link href="/admin" className="text-sm font-semibold text-[#7166f6]">← К курсам</Link><h1 className="mt-3 text-3xl font-bold">{courseId ? "Редактировать курс" : "Создать курс"}</h1><p className="mt-2 text-sm text-slate-500">Изменяйте текст лекций и практику, добавляйте запускаемые примеры Java.</p></div>{courseId && !existing ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{ready ? "Курс не найден." : "Загрузка курса…"}</div> : <CourseForm key={(existing?.id ?? "new") + "-" + (existing?.updatedAt ?? 0)} existing={existing} />}</AppShell>;
}
