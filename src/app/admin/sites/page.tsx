import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AdminSiteCatalog } from "@/components/admin-site-catalog";

export default function AdminSitesPage() {
  return <AppShell active="admin"><Link href="/admin" className="text-sm font-semibold text-[#7166f6]">← В админ-панель</Link><h1 className="mt-3 text-3xl font-bold">Страницы MindLoom</h1><p className="mt-2 text-sm text-slate-500">Создание и редактирование отдельных страниц.</p><AdminSiteCatalog full /></AppShell>;
}
