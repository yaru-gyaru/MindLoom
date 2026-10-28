import Link from "next/link";
import { Icon } from "./icons";

type Section = "home" | "roadmap" | "review" | "results" | "admin";

const nav = [
  { href: "/", label: "Обзор", icon: "grid", id: "home" },
  { href: "/roadmap", label: "Карта знаний", icon: "map", id: "roadmap" },
  { href: "/review", label: "Повторение", icon: "layers", id: "review" },
  { href: "/results", label: "Результаты", icon: "target", id: "results" },
  { href: "/admin", label: "Админ-панель", icon: "sliders", id: "admin" },
] as const;

export function AppShell({ active, children }: { active: Section; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
      <aside className="hidden w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link href="/" className="flex h-23 items-center gap-3 px-7" aria-label="MindLoom — на главную">
          <span className="flex size-10 items-center justify-center rounded-[14px] bg-[#6258f4] text-white shadow-[0_9px_20px_rgba(98,88,244,0.25)]"><Icon name="layers" size={23} /></span>
          <span className="text-xl font-bold tracking-[-0.05em]">mind<span className="text-[#6258f4]">loom</span></span>
        </Link>
        <div className="px-4 pt-8">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Рабочее пространство</p>
          <nav aria-label="Основная навигация" className="mt-4 space-y-1">
            {nav.map((item) => (
              <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${active === item.id ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon name={item.icon} size={19} />{item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <div className="relative overflow-hidden rounded-2xl bg-[#171b38] p-5 text-white">
            <div className="absolute -right-5 -top-5 size-25 rounded-full border border-white/10" />
            <div className="absolute -right-1 top-3 size-16 rounded-full border border-white/10" />
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#b8b3ff]"><Icon name="sparkles" size={19} /></span>
            <p className="mt-4 text-sm font-semibold">Знания складываются в картину</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">Исследуйте темы и связи между ними в одном месте.</p>
          </div>
          <div className="mt-5 flex items-center gap-3 px-2 pb-1">
            <div className="flex size-9 items-center justify-center rounded-full bg-[#e3d8fb] text-xs font-bold text-[#6258a3]">MK</div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">Мой профиль</p><p className="text-xs text-slate-600">Демо аккаунт</p></div>
            <Icon name="more" size={17} className="ml-auto text-slate-500" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="MindLoom — на главную">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#6258f4] text-white"><Icon name="layers" size={18} /></span>
            <span className="font-bold tracking-[-0.05em]">mind<span className="text-[#6258f4]">loom</span></span>
          </Link>
          <div className="hidden h-10 w-full max-w-[340px] items-center gap-3 rounded-xl border border-slate-200 bg-[#f8f9fc] px-3 text-slate-500 lg:flex">
            <Icon name="search" size={17} /><span className="text-sm">Поиск по вашим знаниям...</span><span className="ml-auto rounded border border-slate-200 px-1.5 py-0.5 text-xs">⌘ K</span>
          </div>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <span className="rounded-full bg-[#eeecff] px-3 py-1.5 text-xs font-semibold text-[#6258f4]">Демо интерфейса</span>
            <span className="relative hidden text-slate-500 sm:block"><Icon name="bell" size={19} /><span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-[#f47b7b]" /></span>
            <span className="flex size-8 items-center justify-center rounded-full bg-[#e3d8fb] text-xs font-bold text-[#6258a3] sm:hidden">MK</span>
          </div>
        </header>
        <nav aria-label="Мобильная навигация" className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {nav.map((item) => <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${active === item.id ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-600"}`}>{item.label}</Link>)}
        </nav>
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
