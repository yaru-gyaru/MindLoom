"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { useClientReady, useCourseCatalog, saveCourse, type CourseEntry } from "@/lib/local-content";
import { topicLearningMaterial, type CourseConfig, type CourseTopic, type LectureBlock } from "@/lib/roadmap-courses";

const javaStarter = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, Java!\");\n    }\n}";
const courseCategories = ["Разработка", "Языки программирования", "Веб-разработка", "Backend-разработка", "Дизайн", "Работа с данными"];
const lectureCodeLanguages = ["bash", "terminal", "javascript", "typescript", "python", "java", "c", "cpp", "sql", "html", "css"];

function blocksForTopic(topic: CourseTopic, generatedLecture: string): LectureBlock[] {
  if (topic.lectureBlocks) return topic.lectureBlocks;
  const blocks: LectureBlock[] = [{ type: "text", text: topic.lecture ?? generatedLecture }];
  for (const item of topic.lectureCodeBlocks ?? (topic.lectureCode ? [topic.lectureCode] : [])) blocks.push({ type: "code", ...item });
  if (topic.codeCell) blocks.push({ type: "runner", ...topic.codeCell });
  return blocks;
}

function preferredCodeLanguage(topics?: CourseTopic[]) {
  for (const topic of topics ?? []) {
    const block = topic.lectureBlocks?.find((item) => item.type === "code");
    if (block) return block.language;
    if (topic.lectureCodeBlocks?.[0]) return topic.lectureCodeBlocks[0].language;
    if (topic.lectureCode) return topic.lectureCode.language;
  }
  return "bash";
}

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
  const [topics, setTopics] = useState<CourseTopic[]>(existing?.topics.map((topic) => {
    const material = topicLearningMaterial(topic, trackForCourse(existing.id));
    return { ...topic, ...material, lectureBlocks: blocksForTopic(topic, material.lecture) };
  }) ?? [{ title: "", summary: "", minutes: 25, lecture: "", practice: "", lectureBlocks: [{ type: "text", text: "" }] }]);
  const [newCodeLanguage, setNewCodeLanguage] = useState(() => preferredCodeLanguage(existing?.topics));
  const [expandedTopicIndex, setExpandedTopicIndex] = useState<number | null>(0);
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

  function updateLectureBlock(index: number, blockIndex: number, block: LectureBlock) {
    const blocks = [...(topics[index].lectureBlocks ?? [])];
    blocks[blockIndex] = block;
    updateTopic(index, { lectureBlocks: blocks });
  }

  function insertLectureBlock(index: number, afterIndex: number, block: LectureBlock) {
    const blocks = [...(topics[index].lectureBlocks ?? [])];
    blocks.splice(afterIndex + 1, 0, block);
    updateTopic(index, { lectureBlocks: blocks });
  }

  function removeLectureBlock(index: number, blockIndex: number) {
    const blocks = (topics[index].lectureBlocks ?? []).filter((_, itemIndex) => itemIndex !== blockIndex);
    updateTopic(index, { lectureBlocks: blocks.length ? blocks : [{ type: "text", text: "" }] });
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

  function deleteTopic(index: number) {
    setTopics((current) => current.filter((_, topicIndex) => topicIndex !== index));
    setExpandedTopicIndex((current) => current === null ? null : current === index ? Math.max(0, Math.min(index, topics.length - 2)) : current > index ? current - 1 : current);
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
      lecture: topic.lecture?.trim() || undefined,
      lectureBlocks: topic.lectureBlocks ?? [{ type: "text", text: topic.lecture ?? "" }],
      practice: topic.practice?.trim() ?? "",
      ...(topic.lectureImage?.trim() ? { lectureImage: topic.lectureImage.trim(), lectureImageAlt: topic.lectureImageAlt?.trim() ?? "" } : { lectureImage: undefined, lectureImageAlt: undefined }),
      lectureCode: undefined,
      lectureCodeBlocks: undefined,
      codeCell: undefined,
    }));
    const config: CourseConfig = { title: title.trim(), category: category.trim(), description: description.trim(), tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), topics: cleanTopics, completed: Math.min(existing?.completed ?? 0, cleanTopics.length - 1), stages: existing?.stages ?? [] };
    const id = existing?.id ?? "course-" + Date.now().toString(36);
    try {
      saveCourse(id, config);
    } catch {
      setError("Не удалось сохранить курс в этом браузере. Возможно, закончилось место для сохранённых данных.");
      return;
    }
    setError("");
    setSavedMessage("Курс сохранён. Можно продолжить редактирование.");
    if (!existing) router.replace(`/admin/courses/${encodeURIComponent(id)}/edit`);
  }

  function addTopic() {
    const newIndex = topics.length;
    setTopics((current) => [...current, { title: "", summary: "", minutes: 25, lecture: "", practice: "", lectureBlocks: [{ type: "text", text: "" }] }]);
    setExpandedTopicIndex(newIndex);
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
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Темы курса</h2><p className="mt-1 text-sm text-slate-500">Сворачивай темы для удобной навигации и редактируй их по одной.</p></div><button type="button" onClick={addTopic} aria-label="Добавить тему" title="Добавить тему" className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#4d5d7c] bg-[#10182c] text-2xl font-medium leading-none text-[#70e6ff] shadow-[3px_3px_0_#030611] transition hover:bg-[#17223b]">+</button></div>
      <div className="mt-5 space-y-4">
        {topics.map((topic, index) => <div key={index} ref={(element) => { topicRefs.current[index] = element; }} className="scroll-mt-24 rounded-2xl border border-[#354765] bg-[#10182c] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" aria-expanded={expandedTopicIndex === index} aria-label={expandedTopicIndex === index ? "Свернуть тему" : "Развернуть тему"} onClick={() => setExpandedTopicIndex((current) => current === index ? null : index)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-[#17223b]"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#40516f] bg-[#17223b] text-[#70e6ff]"><Icon name="chevron" size={19} className={expandedTopicIndex === index ? "rotate-90" : ""} /></span><span className="min-w-0"><span className="block text-xs font-bold text-[#70e6ff]">Тема {String(index + 1).padStart(2, "0")}</span><span className="block truncate font-semibold text-[#e5eaff]">{topic.title || "Новая тема"}</span>{expandedTopicIndex !== index && topic.summary && <span className="mt-1 block truncate text-xs font-normal text-[#9aabc3]">{topic.summary}</span>}</span></button><button type="button" onClick={() => deleteTopic(index)} disabled={topics.length === 1} className="rounded-lg border border-[#754454] px-3 py-2 text-sm font-semibold text-[#ff9ba8] hover:bg-[#2c1b2b] disabled:opacity-35">Удалить</button></div>
          {expandedTopicIndex === index && <>
          <label className="mt-3 block text-xs font-semibold text-slate-600">Название<input value={topic.title} onChange={(event) => updateTopic(index, { title: event.target.value })} placeholder="Название темы" className={topicFieldClass} /></label>
          <label className="mt-3 block text-xs font-semibold text-slate-600">Краткое описание<textarea value={topic.summary} onChange={(event) => updateTopic(index, { summary: event.target.value })} rows={2} placeholder="Что узнает пользователь" className={topicFieldClass} /></label>
          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600">Содержание лекции <span className="font-normal text-slate-500">— добавляй текст и код в нужном порядке</span></p>
            {(topic.lectureBlocks ?? [{ type: "text" as const, text: topic.lecture ?? "" }]).map((block, blockIndex) => <div key={blockIndex} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#7166f6]">{block.type === "text" ? "Текст лекции" : block.type === "code" ? `Блок кода · ${block.language}` : "Запускаемая ячейка Java"}</p><button type="button" onClick={() => removeLectureBlock(index, blockIndex)} className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600">Удалить</button></div>
              {block.type === "text" ? <textarea value={block.text} onChange={(event) => updateLectureBlock(index, blockIndex, { ...block, text: event.target.value })} rows={7} placeholder="Пиши объяснение здесь. После него можно вставить блок кода, а затем добавить следующий текст." className={topicFieldClass + " font-mono"} /> : block.type === "code" ? <><label className="block text-xs font-semibold text-slate-600">Подпись блока<select value={block.language} onChange={(event) => { setNewCodeLanguage(event.target.value); updateLectureBlock(index, blockIndex, { ...block, language: event.target.value }); }} className={topicFieldClass}>{lectureCodeLanguages.map((language) => <option key={language} value={language}>{language === "terminal" ? "Терминал" : language.toUpperCase()}</option>)}</select></label><textarea value={block.code} onChange={(event) => updateLectureBlock(index, blockIndex, { ...block, code: event.target.value })} rows={6} spellCheck={false} placeholder="Команда или пример кода" className={topicFieldClass + " font-mono"} /></> : <textarea value={block.code} onChange={(event) => updateLectureBlock(index, blockIndex, { ...block, code: event.target.value })} rows={7} spellCheck={false} placeholder="Java-код, который ученик сможет запустить" className={topicFieldClass + " font-mono"} />}
              <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => insertLectureBlock(index, blockIndex, { type: "text", text: "" })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1687a0]">+ Текст ниже</button><button type="button" onClick={() => insertLectureBlock(index, blockIndex, { type: "code", language: newCodeLanguage, code: "" })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1687a0]">+ Блок кода ниже</button><button type="button" onClick={() => insertLectureBlock(index, blockIndex, { type: "runner", language: "java", code: javaStarter })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#1687a0]">+ Ячейка Java ниже</button></div>
            </div>)}
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-bold text-slate-700">Изображение в лекции <span className="font-normal text-slate-500">(необязательно)</span></p><p className="mt-1 text-xs font-normal text-slate-500">Добавьте иллюстрацию, схему или скриншот.</p></div>{topic.lectureImage && <button type="button" onClick={() => updateTopic(index, { lectureImage: undefined, lectureImageAlt: undefined })} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600">Убрать изображение</button>}</div>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Ссылка на изображение<input type="url" value={topic.lectureImage?.startsWith("data:") ? "" : topic.lectureImage ?? ""} onChange={(event) => updateTopic(index, { lectureImage: event.target.value || undefined })} placeholder="https://…" className={topicFieldClass} /></label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Или загрузить файл<input type="file" accept="image/*" onChange={(event) => uploadLectureImage(index, event.target.files?.[0])} className="mt-2 block w-full text-xs font-normal text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e9f8fb] file:px-3 file:py-2 file:font-semibold file:text-[#1687a0]" /></label>
            <label className="mt-3 block text-xs font-semibold text-slate-600">Описание изображения<input value={topic.lectureImageAlt ?? ""} onChange={(event) => updateTopic(index, { lectureImageAlt: event.target.value })} placeholder="Что изображено" className={topicFieldClass} /></label>
            {topic.lectureImage && <img src={topic.lectureImage} alt={topic.lectureImageAlt || "Предпросмотр изображения лекции"} className="mt-3 max-h-52 rounded-lg border border-slate-200 object-contain" />}
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-600">Практическое задание<textarea value={topic.practice ?? ""} onChange={(event) => updateTopic(index, { practice: event.target.value })} rows={4} placeholder="Задание для самостоятельной работы" className={topicFieldClass} /></label>
          </>}
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
