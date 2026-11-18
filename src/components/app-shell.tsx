"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, PixelMark } from "./icons";

type Section = "home" | "my-courses" | "catalog" | "roadmap" | "review" | "results" | "admin";

const nav = [
  { href: "/", label: "Обзор", icon: "grid", id: "home" },
  { href: "/my-courses", label: "Мои курсы", icon: "book", id: "my-courses" },
  { href: "/catalog", label: "Каталог курсов", icon: "layers", id: "catalog" },
  { href: "/roadmap", label: "Карта знаний", icon: "map", id: "roadmap" },
  { href: "/review", label: "Повторение", icon: "layers", id: "review" },
  { href: "/results", label: "Результаты", icon: "target", id: "results" },
  { href: "/admin", label: "Админ-панель", icon: "sliders", id: "admin" },
] as const;

type DemoRole = "user" | "guest" | "admin";
const roleStorageKey = "mindloom-demo-role";
const accounts: { id: DemoRole; name: string; description: string; initials: string }[] = [
  { id: "user", name: "Пользователь", description: "Личный профиль", initials: "MK" },
  { id: "guest", name: "Гость", description: "Гостевой просмотр", initials: "Г" },
  { id: "admin", name: "Администратор", description: "Панель управления", initials: "A" },
];

function readRole(): DemoRole {
  const storedRole = window.localStorage.getItem(roleStorageKey);
  return storedRole === "guest" || storedRole === "admin" ? storedRole : "user";
}

function subscribeRole(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("mindloom-role-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("mindloom-role-change", onChange);
  };
}

export function useDemoRole(): DemoRole {
  // Render the least privileged view until the browser reads its saved choice.
  return useSyncExternalStore(subscribeRole, readRole, () => "guest" as DemoRole);
}

function canViewSection(role: DemoRole, section: Section) {
  if (role === "admin") return true;
  if (section === "admin") return false;
  return role === "user" || section === "home" || section === "roadmap" || section === "catalog";
}

export function MemberOnly({ children }: { children: React.ReactNode }) {
  const role = useDemoRole();
  return role === "guest" ? null : children;
}

export function HomeContentGrid({ children }: { children: React.ReactNode }) {
  const role = useDemoRole();
  return <div className={`mt-8 grid gap-6 ${role === "guest" ? "" : "xl:grid-cols-[minmax(0,1fr)_300px]"}`}>{children}</div>;
}

function AccountMenu({ role, onSelect }: { role: DemoRole; onSelect: (nextRole: DemoRole) => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(26,31,68,0.18)]" role="group" aria-label="Выбор демо-аккаунта"><p className="px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Сменить аккаунт</p>{accounts.map((account) => <button key={account.id} type="button" onClick={() => onSelect(account.id)} aria-pressed={role === account.id} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${role === account.id ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-700 hover:bg-slate-50"}`}><span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${role === account.id ? "bg-white text-[#6258a3]" : "bg-[#e9e7f5] text-[#625b89]"}`}>{account.initials}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{account.name}</span><span className="block text-xs text-slate-500">{account.description}</span></span>{role === account.id && <Icon name="check" size={16} />}</button>)}<p className="mt-1 border-t border-slate-100 px-3 py-2 text-xs leading-4 text-slate-500">Гость: карты. Пользователь: обучение и результаты. Администратор: все разделы. Демо без авторизации.</p></div>;
}

export function AppShell({ active, children }: { active: Section; children: React.ReactNode }) {
  const router = useRouter();
  const role = useDemoRole();
  const [accountOpen, setAccountOpen] = useState(false);
  const account = accounts.find((item) => item.id === role) ?? accounts[0];
  const visibleNav = role === "admin"
    ? nav.filter((item) => item.id === "admin")
    : nav.filter((item) => canViewSection(role, item.id));

  function selectAccount(nextRole: DemoRole) {
    window.localStorage.setItem(roleStorageKey, nextRole);
    window.dispatchEvent(new Event("mindloom-role-change"));
    setAccountOpen(false);
    router.push(nextRole === "admin" ? "/admin" : "/");
  }

  return (
    <div className="site-shell min-h-screen bg-[#f5f7fb] text-slate-900 lg:flex">
      <aside className="site-sidebar hidden w-[264px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link href="/" className="flex h-23 items-center gap-3 px-7" aria-label="MindLoom — на главную">
          <span className="site-brand-mark flex size-10 items-center justify-center rounded-[14px] bg-[#6258f4] text-white shadow-[0_9px_20px_rgba(98,88,244,0.25)]"><PixelMark /></span>
          <span className="site-brand-word text-xl font-bold tracking-[-0.05em]">mind<span className="text-[#6258f4]">loom</span></span>
        </Link>
        <div className="px-4 pt-8">
          <p className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Рабочее пространство</p>
          <nav aria-label="Основная навигация" className="mt-4 space-y-1">
            {visibleNav.map((item) => (
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
          <div className="relative mt-5">
            <button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-label={`Аккаунт: ${account.name}. Переключить аккаунт`} aria-expanded={accountOpen} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3d8fb] text-xs font-bold text-[#6258a3]">{account.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{account.name}</span><span className="block text-xs text-slate-600">Демо аккаунт</span></span><Icon name="more" size={17} className="text-slate-500" /></button>
            {accountOpen && <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-full"><AccountMenu role={role} onSelect={selectAccount} /></div>}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="site-topbar flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2 lg:hidden" aria-label="MindLoom — на главную">
            <span className="site-brand-mark flex size-8 items-center justify-center rounded-xl bg-[#6258f4] text-white"><PixelMark /></span>
            <span className="site-brand-word font-bold tracking-[-0.05em]">mind<span className="text-[#6258f4]">loom</span></span>
          </Link>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <span className="relative hidden text-slate-500 sm:block"><Icon name="bell" size={19} /><span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-[#f47b7b]" /></span>
            <div className="relative"><button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-label={`Аккаунт: ${account.name}. Переключить аккаунт`} aria-expanded={accountOpen} className="flex size-10 items-center justify-center rounded-[4px] border border-[#394967] bg-[#17223b] text-xs font-bold text-[#9feaff] hover:border-[#70e6ff]">{account.initials}</button>{accountOpen && <div className="absolute right-0 top-11 z-30 w-60"><AccountMenu role={role} onSelect={selectAccount} /></div>}</div>
          </div>
        </header>
        <nav aria-label="Мобильная навигация" className="site-mobile-nav flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {visibleNav.map((item) => <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${active === item.id ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-600"}`}>{item.label}</Link>)}
        </nav>
        <div className="site-content mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{canViewSection(role, active) ? children : <div className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-7 text-center shadow-[0_8px_28px_rgba(29,34,72,0.05)] sm:p-10"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eeecff] text-[#7166f6]"><Icon name="lock" size={23} /></span><h1 className="mt-5 text-2xl font-bold">Раздел недоступен</h1><p className="mt-3 text-sm leading-6 text-slate-600">{active === "admin" ? "Админ-панель доступна только профилю «Администратор»." : "Повторение и результаты доступны профилям «Пользователь» и «Администратор»."} Переключите демо-аккаунт в меню профиля.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => setAccountOpen(true)} className="rounded-xl bg-[#7166f6] px-4 py-2.5 text-sm font-semibold text-white">Сменить аккаунт</button><Link href="/" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">На главную</Link></div></div>}</div>
      </div>
    </div>
  );
}
