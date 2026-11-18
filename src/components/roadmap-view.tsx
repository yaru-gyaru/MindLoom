"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell, useDemoRole } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { defaultCourses, type CourseTopic } from "@/lib/roadmap-courses";
import { useClientReady, useCourseCatalog } from "@/lib/local-content";

type TopicStatus = "done" | "current" | "locked" | "preview";
type Direction = "vertical" | "horizontal";

const NODE_WIDTH = 194;
const NODE_HEIGHT = 140;
const STAGE_GAP = 210;
const HORIZONTAL_STAGE_GAP = 260;
const VERTICAL_MAP_WIDTH = 1760;
const HORIZONTAL_MAP_HEIGHT = 1760;

const mapRows = [
  [0],
  [1, 2],
  [3, 4, 6, 8],
  [5, 7, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24],
];

const dependencies: [number, number][] = [
  [0, 1], [0, 2],
  [1, 3], [2, 3], [1, 4], [1, 6], [2, 8],
  [4, 5], [6, 7], [8, 9], [8, 10], [4, 11], [8, 12],
  [5, 13], [5, 14], [9, 15], [10, 16], [11, 17], [12, 18],
  [18, 19], [16, 20], [13, 21], [14, 22], [17, 23], [18, 24],
];

function rowsFor(total: number) {
  const rows = mapRows.map((row) => row.filter((index) => index < total)).filter((row) => row.length > 0);
  for (let index = 25; index < total; index += 6) rows.push(Array.from({ length: Math.min(6, total - index) }, (_, offset) => index + offset));
  return rows;
}

function edgesFor(total: number, custom: boolean): [number, number][] {
  const rows = rowsFor(total);
  if (custom) return rows.slice(1).flatMap((row, stage) => row.map((index, place) => [rows[stage][Math.min(rows[stage].length - 1, Math.floor(place * rows[stage].length / row.length))], index] as [number, number]));
  const extra = rows.slice(6).flatMap((row, offset) => row.map((index, place) => [rows[offset + 5][Math.min(rows[offset + 5].length - 1, Math.floor(place * rows[offset + 5].length / row.length))], index] as [number, number]));
  return [...dependencies.filter(([, to]) => to < total), ...extra];
}

function topicStatus(index: number, completed: number): TopicStatus {
  return index < completed ? "done" : index === completed ? "current" : "locked";
}

function nodePosition(index: number, direction: Direction, total: number) {
  const rows = rowsFor(total);
  const stage = rows.findIndex((row) => row.includes(index));
  const place = rows[stage].indexOf(index);
  const spacing = stage === 0 ? 0 : stage === 1 ? 520 : stage === 2 ? 370 : 275;
  const verticalX = (VERTICAL_MAP_WIDTH - NODE_WIDTH - (rows[stage].length - 1) * spacing) / 2 + place * spacing;
  return direction === "vertical"
    ? { x: verticalX, y: 98 + stage * STAGE_GAP }
    : { x: 100 + stage * HORIZONTAL_STAGE_GAP, y: verticalX };
}

function connectionPath(fromIndex: number, toIndex: number, direction: Direction, total: number) {
  const from = nodePosition(fromIndex, direction, total);
  const to = nodePosition(toIndex, direction, total);
  if (direction === "vertical") {
    const startX = from.x + NODE_WIDTH / 2;
    const endX = to.x + NODE_WIDTH / 2;
    const startY = from.y + NODE_HEIGHT;
    const endY = to.y - 8;
    return `M ${startX} ${startY} C ${startX} ${startY + 34}, ${endX} ${endY - 34}, ${endX} ${endY}`;
  }
  const startX = from.x + NODE_WIDTH;
  const endX = to.x - 8;
  const startY = from.y + NODE_HEIGHT / 2;
  const endY = to.y + NODE_HEIGHT / 2;
  return `M ${startX} ${startY} C ${startX + 38} ${startY}, ${endX - 38} ${endY}, ${endX} ${endY}`;
}

function GraphNode({ index, topic, completed, total, direction, selected, guest, onSelect }: { index: number; topic: CourseTopic; completed: number; total: number; direction: Direction; selected: boolean; guest: boolean; onSelect: () => void }) {
  const status: TopicStatus = guest ? "preview" : topicStatus(index, completed);
  const position = nodePosition(index, direction, total);
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={`knowledge-graph-node absolute z-10 h-[140px] w-[194px] rounded-[4px] border bg-[#111a2f] p-4 text-left text-[#e7efff] shadow-[4px_4px_0_#030611] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#70e6ff] ${selected ? "border-[#70e6ff] ring-[3px] ring-[#70e6ff]/30" : "border-[#415574]"} ${status === "locked" ? "opacity-90" : ""}`} style={{ left: position.x, top: position.y }}>
    <span className="flex items-center justify-between"><span className={`flex size-8 items-center justify-center rounded-lg text-sm font-bold ${status === "done" ? "bg-[#e4f7ed] text-[#47ae83]" : status === "current" ? "bg-[#eeecff] text-[#7166f6]" : "bg-slate-100 text-slate-500"}`}>{status === "done" ? <Icon name="check" size={16} /> : status === "locked" ? <Icon name="lock" size={15} /> : String(index + 1).padStart(2, "0")}</span><span className="text-xs text-slate-500">{topic.minutes} мин</span></span>
    <span className="mt-2 block min-h-10 text-sm font-bold leading-5">{topic.title}</span>
    <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500"><span className={`size-1.5 rounded-full ${status === "done" ? "bg-[#59c391]" : status === "current" ? "bg-[#8178ff]" : "bg-slate-300"}`} />{status === "done" ? "Изучено" : status === "current" ? "В процессе" : status === "locked" ? "Откроется позже" : "Для просмотра"}</span>
  </button>;
}

export function RoadmapView({ courseId }: { courseId: string }) {
  const catalog = useCourseCatalog();
  const ready = useClientReady();
  const entry = catalog.find((item) => item.id === courseId);
  const course = entry ?? defaultCourses.system;
  const role = useDemoRole();
  const total = course.topics.length;
  const progress = Math.round(course.completed / total * 100);
  const rows = rowsFor(total);
  const edges = edgesFor(total, entry?.isCustom ?? false);
  const verticalMapHeight = Math.max(320, 54 + rows.length * STAGE_GAP);
  const horizontalMapWidth = Math.max(420, 55 + rows.length * HORIZONTAL_STAGE_GAP);
  const graphScrollRef = useRef<HTMLDivElement>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical");
  const [directionOpen, setDirectionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedTopicRaw, setSelectedTopic] = useState(entry?.completed ?? 0);
  const selectedTopic = Math.min(selectedTopicRaw, total - 1);
  const selectedStatus = topicStatus(selectedTopic, course.completed);
  const selectedTitle = course.topics[selectedTopic].title;
  const selectedSummary = course.topics[selectedTopic].summary;
  const selectedNumber = String(selectedTopic + 1).padStart(2, "0");

  useEffect(() => {
    const graph = graphScrollRef.current;
    if (!graph) return;
    graph.scrollLeft = Math.max(0, (graph.scrollWidth - graph.clientWidth) / 2);
    graph.scrollTop = direction === "horizontal" ? Math.max(0, (graph.scrollHeight - graph.clientHeight) / 2) : 0;
  }, [direction]);

  function selectTopic(index: number) {
    setSelectedTopic(index);
    setSaved(false);
    setMenuOpen(false);
  }

  if (!entry) return <AppShell active="roadmap"><div className="rounded-2xl border border-slate-200 bg-[#10182c] p-8 text-center"><h1 className="text-xl font-bold">{ready ? "Курс не найден" : "Загрузка курса…"}</h1><p className="mt-2 text-sm text-slate-500">{ready ? "Проверьте список доступных курсов." : "Подготавливаем локальные данные."}</p><Link href="/" className="mt-5 inline-block text-sm font-semibold text-[#7166f6]">К списку курсов</Link></div></AppShell>;

  return <AppShell active="roadmap">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-[#7166f6]">Мои карты</Link><Icon name="chevron" size={13} /><span className="text-slate-600">{course.title}</span></div><h1 className="mt-3 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">{course.title}{courseId === "system" && " & Distributed Systems"}</h1><p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{course.description}</p></div><span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-[#10182c] px-4 py-2.5 text-sm font-semibold text-slate-600"><Icon name="download" size={16} /> Экспорт · скоро</span></div>

    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
      <button type="button" onClick={() => { setCategoryOpen(!categoryOpen); setTopicsOpen(false); }} aria-expanded={categoryOpen} aria-controls="roadmap-category-panel" className={`rounded-full px-3 py-1.5 font-semibold transition-colors ${categoryOpen ? "bg-[#dedaff] text-[#5e52df]" : "bg-[#eeecff] text-[#7166f6] hover:bg-[#e4e0ff]"}`}>{course.category}</button>
      <button type="button" onClick={() => { setTopicsOpen(!topicsOpen); setCategoryOpen(false); }} aria-expanded={topicsOpen} aria-controls="roadmap-topics-panel" className={`rounded-full px-3 py-1.5 ring-1 transition-colors ${topicsOpen ? "bg-[#eeecff] text-[#7166f6] ring-[#c9c4ff]" : "bg-[#10182c] text-slate-500 ring-slate-200 hover:bg-[#f7f6ff] hover:text-[#6257e6]"}`}>{total} тем</button>
      {role !== "guest" && <><span className="ml-auto text-slate-500">{course.completed} из {total} тем изучено</span><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[#7166f6]" style={{ width: `${progress}%` }} /></div><strong className="text-[#7166f6]">{progress}%</strong></>}
    </div>
    {categoryOpen && <section id="roadmap-category-panel" aria-label={`Направление ${course.category}`} className="mb-6 rounded-[22px] border border-[#e5e2ff] bg-[#10182c] p-5 shadow-[0_8px_26px_rgba(29,34,72,0.05)] sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7166f6]">Направление</p><h2 className="mt-1 text-lg font-bold">{course.category}</h2></div><button type="button" onClick={() => setCategoryOpen(false)} aria-label="Закрыть панель" className="rounded-lg px-2 text-xl text-slate-400 hover:bg-slate-100">×</button></div><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{course.description}</p><div className="mt-4 flex flex-wrap gap-2">{course.tags.map((skill) => <span key={skill} className="rounded-full bg-[#f1efff] px-3 py-1.5 text-xs font-semibold text-[#6257e6]">{skill}</span>)}</div><Link href="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#7166f6] hover:underline">Посмотреть другие карты <Icon name="arrow" size={15} /></Link></section>}
    {topicsOpen && <section id="roadmap-topics-panel" aria-label="Список тем карты" className="mb-6 rounded-[22px] border border-[#e5e2ff] bg-[#10182c] p-5 shadow-[0_8px_26px_rgba(29,34,72,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7166f6]">{course.title}</p><h2 className="mt-1 text-lg font-bold">Программа: {total} тем</h2></div><button type="button" onClick={() => setTopicsOpen(false)} aria-label="Закрыть панель" className="rounded-lg px-2 text-xl text-slate-400 hover:bg-slate-100">×</button></div>
      <p className="mt-2 text-sm leading-6 text-slate-500">Все темы показаны на карте ниже. Нажмите на узел, чтобы открыть описание.</p><ol className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1 text-sm sm:grid-cols-2 lg:grid-cols-3">{course.topics.map((topic, index) => <li key={topic.title} className="flex items-center gap-3 rounded-xl bg-[#f7f8fc] px-3 py-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#10182c] text-xs font-bold text-[#7166f6]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium text-slate-700">{topic.title}</span></li>)}</ol>
    </section>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_314px]">
      <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#10182c] shadow-[0_4px_20px_rgba(29,34,72,0.03)]" aria-label={`Карта знаний «${course.title}» из ${total} тем`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-[#f0efff] text-[#7166f6]"><Icon name="map" size={17} /></span><div><h2 className="text-sm font-bold">Карта знаний</h2><p className="text-sm text-slate-500">{total} связанных тем · нажмите на узел для просмотра</p></div></div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setDirectionOpen(!directionOpen); setSettingsOpen(false); }} aria-expanded={directionOpen} aria-controls="map-direction-panel" className={`rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-[#f7f6ff] ${directionOpen ? "border-[#7166f6] text-[#6257e6]" : "border-slate-200 text-slate-500"}`}>{direction === "vertical" ? "Сверху вниз" : "Слева направо"} <span aria-hidden="true">⌄</span></button>
            <button type="button" onClick={() => { setSettingsOpen(!settingsOpen); setDirectionOpen(false); }} aria-label="Настройки карты" aria-expanded={settingsOpen} aria-controls="map-settings-panel" className={`flex size-9 items-center justify-center rounded-lg border hover:bg-[#f7f6ff] ${settingsOpen ? "border-[#7166f6] text-[#6257e6]" : "border-slate-200 text-slate-500"}`}><Icon name="sliders" size={16} /></button>
          </div>
        </div>
        {directionOpen && <div id="map-direction-panel" className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-[#fafaff] px-5 py-4"><span className="mr-2 text-sm font-semibold text-slate-700">Направление карты</span>{([{ value: "vertical", label: "Сверху вниз" }, { value: "horizontal", label: "Слева направо" }] as const).map((item) => <button key={item.value} type="button" onClick={() => { setDirection(item.value); setDirectionOpen(false); }} aria-pressed={direction === item.value} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${direction === item.value ? "border-[#7166f6] bg-[#eeecff] text-[#6257e6]" : "border-slate-200 bg-[#10182c] text-slate-600 hover:border-[#b3adff]"}`}>{item.label}</button>)}</div>}
        {settingsOpen && <div id="map-settings-panel" className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-100 bg-[#fafaff] px-5 py-4"><span className="text-sm font-semibold text-slate-700">Настройки карты</span><label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showConnections} onChange={(event) => setShowConnections(event.target.checked)} className="size-4 accent-[#7166f6]" />Связи между темами</label>{role !== "guest" && <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} className="size-4 accent-[#7166f6]" />Изученные темы</label>}</div>}
        <div ref={graphScrollRef} className="max-h-[760px] overflow-auto bg-[#0b1222] [background-image:radial-gradient(rgba(151,174,208,0.2)_1px,transparent_1px)] [background-size:22px_22px]" id="knowledge-graph"><div className="relative" style={{ width: direction === "vertical" ? VERTICAL_MAP_WIDTH : horizontalMapWidth, height: direction === "vertical" ? verticalMapHeight : HORIZONTAL_MAP_HEIGHT }}>
          {rows.map((_, index) => { const phase = course.stages[index] ?? `Этап ${index + 1}`; return <div key={index} className={`knowledge-graph-stage pointer-events-none absolute rounded-[4px] border border-[#334665] ${index % 2 === 0 ? "bg-[#131f35]/72" : "bg-[#111a2f]/72"}`} style={direction === "vertical" ? { left: 30, top: 54 + index * STAGE_GAP, width: VERTICAL_MAP_WIDTH - 60, height: 190 } : { left: 55 + index * HORIZONTAL_STAGE_GAP, top: 30, width: 240, height: HORIZONTAL_MAP_HEIGHT - 60 }}><span className="absolute left-5 top-3 text-xs font-bold uppercase tracking-[0.14em] text-[#8178a2]">{String(index + 1).padStart(2, "0")} · {phase}</span></div>; })}
          {showConnections && <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${direction === "vertical" ? VERTICAL_MAP_WIDTH : horizontalMapWidth} ${direction === "vertical" ? verticalMapHeight : HORIZONTAL_MAP_HEIGHT}`} fill="none" aria-hidden="true"><defs><marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 7 4 1 7" fill="none" stroke="#a9a5da" strokeWidth="1.4" /></marker></defs><g stroke="#b8b4dc" strokeWidth="2.5" markerEnd="url(#arrowhead)">{edges.map(([from, to]) => (role === "guest" || showCompleted || (from >= course.completed && to >= course.completed)) && <path key={`${from}-${to}`} d={connectionPath(from, to, direction, total)} />)}</g></svg>}
          {course.topics.map((topic, index) => (role === "guest" || showCompleted || index >= course.completed) && <GraphNode key={index} index={index} topic={topic} completed={course.completed} total={total} direction={direction} selected={selectedTopic === index} guest={role === "guest"} onSelect={() => selectTopic(index)} />)}
        </div></div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-4 text-sm text-slate-500">{role === "guest" ? <span>{total} тем для просмотра</span> : <><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#59c391]" /> {course.completed} изучено</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[#8178ff]" /> 1 в процессе</span><span className="flex items-center gap-2"><i className="size-2 rounded-full bg-slate-300" /> {total - course.completed - 1} недоступно</span></>}<span className="ml-auto text-slate-500">Прокрутите карту, чтобы увидеть все ветви</span></div>
      </section>

      <aside className="space-y-5"><section className="rounded-[22px] border border-slate-200/80 bg-[#10182c] p-6 shadow-[0_4px_20px_rgba(29,34,72,0.03)]">
        <div className="flex items-center justify-between"><span className="rounded-full bg-[#eeecff] px-3 py-1 text-sm font-bold text-[#7166f6]">ТЕМА {selectedNumber}</span><div className="relative"><button type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Действия с темой" aria-expanded={menuOpen} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><Icon name="more" size={18} /></button>{menuOpen && <div className="absolute right-0 top-9 z-10 w-48 rounded-xl border border-slate-200 bg-[#10182c] p-1 shadow-xl"><button type="button" onClick={() => { setSaved(!saved); setMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50">{saved ? "Убрать из закладок" : "Сохранить тему"}</button></div>}</div></div>
        <h2 className="mt-5 text-xl font-bold tracking-[-0.025em]">{selectedTitle}</h2><p className="mt-2 text-sm leading-5 text-slate-500">{selectedSummary}</p>{saved && <p className="mt-2 text-xs font-semibold text-[#7166f6]">Сохранено на этом экране</p>}<div className="mt-5 flex items-center gap-3 border-y border-slate-100 py-4 text-sm text-slate-500"><Icon name="clock" size={16} /> ~{course.topics[selectedTopic].minutes} минут <span className="ml-auto rounded-full bg-[#f1efff] px-2.5 py-1 font-semibold text-[#756bf1]">{role === "guest" ? "Просмотр" : selectedStatus === "done" ? "Изучено" : selectedStatus === "current" ? "В процессе" : "Позже"}</span></div>
        <p className="mt-5 text-sm leading-6 text-slate-600">{selectedSummary}</p>
        {<div className="mt-6 grid gap-3"><Link href={`/learn/${encodeURIComponent(courseId)}/${selectedTopic + 1}#lesson`} className="flex items-center justify-between rounded-xl bg-[#7166f6] px-4 py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#6257e6]"><span><span className="block">Пройти урок</span><span className="mt-1 block text-xs font-medium text-white/75">Изучить тему и примеры</span></span><Icon name="arrow" size={17} /></Link><Link href={`/learn/${encodeURIComponent(courseId)}/${selectedTopic + 1}#practice`} className="flex items-center justify-between rounded-[4px] border border-[#415574] bg-[#17223b] px-4 py-4 text-sm font-bold text-[#9feaff] transition hover:bg-[#21314d]"><span><span className="block">Пройти практику</span><span className="mt-1 block text-xs font-medium text-[#8178a2]">Выполнить задание и сохранить ответ</span></span><Icon name="arrow" size={17} /></Link></div>}
      </section>{role !== "guest" && <div className="rounded-[4px] border border-[#276455] bg-[#102c2a] p-5 shadow-[4px_4px_0_#030611]"><div className="flex items-center gap-2 text-[#65d6a4]"><Icon name="sparkles" size={17} /><span className="text-sm font-bold">Текущий этап</span></div><p className="mt-2 text-sm leading-5 text-[#c7d9e7]">Тема {course.completed + 1} «{course.topics[course.completed].title}» в процессе.{course.completed + 1 < total && <> Следующая тема — «{course.topics[course.completed + 1].title}».</>}</p></div>}</aside>
    </div>
  </AppShell>;
}
