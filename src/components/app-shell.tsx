"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, PixelMark } from "./icons";

type Section = "home" | "my-courses" | "catalog" | "roadmap" | "review" | "results" | "profile" | "admin";

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
type AuthUser = { email: string; displayName: string; role: "user" | "admin" };
type AuthSnapshot = { loaded: boolean; user: AuthUser | null };
let authSnapshot: AuthSnapshot = { loaded: false, user: null };
const serverAuthSnapshot: AuthSnapshot = { loaded: false, user: null };
const authListeners = new Set<() => void>();
let authRequestId = 0;

function subscribeAuth(onChange: () => void) { authListeners.add(onChange); return () => authListeners.delete(onChange); }
function updateAuth(snapshot: AuthSnapshot) {
  authRequestId += 1;
  authSnapshot = snapshot;
  authListeners.forEach((listener) => listener());
}
function updateAuthFromRequest(requestId: number, snapshot: AuthSnapshot) {
  if (requestId !== authRequestId) return;
  authSnapshot = snapshot;
  authListeners.forEach((listener) => listener());
}
function getAuthSnapshot() { return authSnapshot; }
function getServerAuthSnapshot() { return serverAuthSnapshot; }
function useAuthSnapshot() { return useSyncExternalStore(subscribeAuth, getAuthSnapshot, getServerAuthSnapshot); }
export function useAuthRole(): DemoRole {
  const auth = useAuthSnapshot();
  return auth.user?.role ?? "guest";
}

function canViewSection(role: DemoRole, section: Section) {
  if (role === "admin") return true;
  if (section === "admin") return false;
  return role === "user" || section === "home" || section === "roadmap" || section === "catalog";
}

export function MemberOnly({ children }: { children: React.ReactNode }) {
  const auth = useAuthSnapshot();
  const role = auth.user?.role ?? "guest";
  if (!auth.loaded) return <div className="rounded-2xl border border-[#344360] bg-[#10182c] p-5 text-sm text-[#a7b7d0]">Проверяем вход в аккаунт…</div>;
  return role === "guest" ? <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600"><p>Войдите или зарегистрируйтесь, чтобы сохранить прогресс и открыть этот раздел.</p><div className="mt-3 flex gap-3"><Link href="/login" className="font-semibold text-[#6258f4]">Войти</Link><Link href="/register" className="font-semibold text-[#6258f4]">Создать аккаунт</Link></div></div> : children;
}

export function HomeContentGrid({ children }: { children: React.ReactNode }) {
  const role = useAuthRole();
  return <div className={`mt-8 grid gap-6 ${role === "guest" ? "" : "xl:grid-cols-[minmax(0,1fr)_300px]"}`}>{children}</div>;
}

function AccountMenu({ user, onLogout }: { user: AuthUser | null; onLogout: () => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(26,31,68,0.18)]">{user ? <><p className="px-2 py-2 text-sm font-semibold text-slate-800">{user.displayName}</p><p className="px-2 pb-3 text-xs text-slate-500">{user.email}</p><Link href="/profile" className="block rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">Профиль</Link><button type="button" onClick={onLogout} className="mt-1 w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50">Выйти</button></> : <><p className="px-2 py-2 text-sm text-slate-600">Вы не вошли в аккаунт</p><Link href="/login" className="block rounded-lg px-2 py-2 text-sm font-semibold text-[#5147d7] hover:bg-slate-50">Войти</Link><Link href="/register" className="block rounded-lg px-2 py-2 text-sm font-semibold text-[#5147d7] hover:bg-slate-50">Регистрация</Link></>}</div>;
}

export function AppShell({ active, children }: { active: Section; children: React.ReactNode }) {
  const router = useRouter();
  const role = useAuthRole();
  const auth = useAuthSnapshot();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountName = auth.user?.displayName ?? "Гость";
  const initials = auth.user?.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() ?? "В";
  const visibleNav = role === "admin"
    ? nav.filter((item) => item.id === "admin")
    : nav.filter((item) => canViewSection(role, item.id));

  useEffect(() => {
    const refreshAuth = () => {
      const requestId = ++authRequestId;
      void fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
        .then((response) => response.json())
        .then((data: { user: AuthUser | null }) => updateAuthFromRequest(requestId, { loaded: true, user: data.user }))
        .catch(() => updateAuthFromRequest(requestId, { loaded: true, user: null }));
    };
    if (!authSnapshot.loaded) refreshAuth();
    window.addEventListener("mindloom-auth-change", refreshAuth);
    return () => window.removeEventListener("mindloom-auth-change", refreshAuth);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    updateAuth({ loaded: true, user: null });
    setAccountOpen(false);
    router.push("/");
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
            {auth.user && <Link href="/profile" aria-current={active === "profile" ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${active === "profile" ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon name="more" size={19} />Профиль</Link>}
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
            <button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-label={`Аккаунт: ${accountName}`} aria-expanded={accountOpen} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-50"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3d8fb] text-xs font-bold text-[#6258a3]">{initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{accountName}</span><span className="block text-xs text-slate-600">{auth.user?.role === "admin" ? "Администратор" : auth.user ? "Аккаунт MindLoom" : "Не выполнен вход"}</span></span><Icon name="more" size={17} className="text-slate-500" /></button>
            {accountOpen && <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-full"><AccountMenu user={auth.user} onLogout={logout} /></div>}
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
            <div className="relative"><button type="button" onClick={() => setAccountOpen(!accountOpen)} aria-label={`Аккаунт: ${accountName}`} aria-expanded={accountOpen} className="flex size-10 items-center justify-center rounded-[4px] border border-[#394967] bg-[#17223b] text-xs font-bold text-[#9feaff] hover:border-[#70e6ff]">{initials}</button>{accountOpen && <div className="absolute right-0 top-11 z-30 w-60"><AccountMenu user={auth.user} onLogout={logout} /></div>}</div>
          </div>
        </header>
        <nav aria-label="Мобильная навигация" className="site-mobile-nav flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {visibleNav.map((item) => <Link key={item.id} href={item.href} aria-current={active === item.id ? "page" : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4] ${active === item.id ? "bg-[#f0efff] text-[#5147d7]" : "text-slate-600"}`}>{item.label}</Link>)}
          {auth.user && <Link href="/profile" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6258f4]">Профиль</Link>}
        </nav>
        <div className="site-content mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{!auth.loaded ? <div className="mx-auto max-w-xl rounded-2xl border border-[#344360] bg-[#10182c] p-6 text-center text-[#a7b7d0]">Проверяем вход в аккаунт…</div> : canViewSection(role, active) ? children : <div className="mx-auto max-w-xl rounded-[24px] border border-slate-200 bg-white p-7 text-center shadow-[0_8px_28px_rgba(29,34,72,0.05)] sm:p-10"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#eeecff] text-[#7166f6]"><Icon name="lock" size={23} /></span><h1 className="mt-5 text-2xl font-bold">Раздел недоступен</h1><p className="mt-3 text-sm leading-6 text-slate-600">{active === "admin" ? "Админ-панель доступна только администратору." : "Войдите в аккаунт, чтобы открыть этот раздел."}</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href={active === "admin" ? "/" : "/login"} className="rounded-xl bg-[#7166f6] px-4 py-2.5 text-sm font-semibold text-white">{active === "admin" ? "На главную" : "Войти"}</Link><Link href="/register" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Создать аккаунт</Link></div></div>}</div>
      </div>
    </div>
  );
}

