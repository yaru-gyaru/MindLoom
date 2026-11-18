"use client";

import Link from "next/link";
import { useSiteCatalog } from "@/lib/local-content";

export function HomeSiteCards() {
  const sites = useSiteCatalog();
  if (!sites.length) return null;
  return <section><div className="mb-4"><h2 className="text-lg font-bold tracking-[-0.02em]">Страницы MindLoom</h2><p className="mt-1 text-sm text-slate-500">Материалы и страницы проекта</p></div><div className="grid gap-4 md:grid-cols-2">{sites.map((site) => <Link key={site.id} href={`/sites/${encodeURIComponent(site.id)}`} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"><span className="block h-1 w-10 rounded-full" style={{ backgroundColor: site.accent }} /><h3 className="mt-4 text-base font-bold group-hover:text-[#6257e6]">{site.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{site.subtitle}</p><span className="mt-4 inline-block text-sm font-semibold text-[#7166f6]">Открыть страницу →</span></Link>)}</div></section>;
}
