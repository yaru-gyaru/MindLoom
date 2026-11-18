"use client";

import { useMemo, useSyncExternalStore } from "react";
import { defaultCourses, type CourseConfig } from "@/lib/roadmap-courses";

export type CourseEntry = CourseConfig & { id: string; isCustom: boolean; updatedAt?: number };
export type SiteSection = { title: string; body: string };
export type SiteEntry = {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  sections: SiteSection[];
  createdAt: number;
  updatedAt: number;
};

type SavedCourse = { id: string; config: CourseConfig; createdAt: number; updatedAt: number };
const coursesKey = "mindloom-local-courses-v1";
const savedCoursesKey = "mindloom-saved-courses-v1";
const sitesKey = "mindloom-local-sites-v1";
const changeEvent = "mindloom-content-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

function readRaw(key: string) {
  try { return window.localStorage.getItem(key) ?? "[]"; } catch { return "[]"; }
}

function parseList<T>(raw: string): T[] {
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as T[] : []; } catch { return []; }
}

export function useClientReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function useCourseCatalog(): CourseEntry[] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(coursesKey), () => "[]");
  return useMemo(() => {
    const saved = parseList<SavedCourse>(raw).filter((item) => item && typeof item.id === "string" && item.config && Array.isArray(item.config.topics) && item.config.topics.length > 0);
    const custom = saved.filter((item) => !(item.id in defaultCourses)).sort((a, b) => b.createdAt - a.createdAt).map((item) => ({ ...item.config, id: item.id, isCustom: true, updatedAt: item.updatedAt }));
    const defaults = Object.entries(defaultCourses).map(([id, config]) => {
      const override = saved.find((item) => item.id === id);
      return { ...(override?.config ?? config), id, isCustom: false, updatedAt: override?.updatedAt };
    });
    return [...custom, ...defaults];
  }, [raw]);
}

export function useSavedCourseIds(): string[] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(savedCoursesKey), () => "[]");
  return useMemo(() => parseList<string>(raw).filter((id) => typeof id === "string"), [raw]);
}

export function toggleSavedCourse(id: string) {
  const saved = parseList<string>(readRaw(savedCoursesKey));
  const next = saved.includes(id) ? saved.filter((item) => item !== id) : [id, ...saved];
  window.localStorage.setItem(savedCoursesKey, JSON.stringify(next));
  window.dispatchEvent(new Event(changeEvent));
}

export function saveCourse(id: string, config: CourseConfig) {
  const saved = parseList<SavedCourse>(readRaw(coursesKey));
  const existing = saved.find((item) => item.id === id);
  const now = Date.now();
  const next = [{ id, config, createdAt: existing?.createdAt ?? now, updatedAt: now }, ...saved.filter((item) => item.id !== id)];
  window.localStorage.setItem(coursesKey, JSON.stringify(next));
  window.dispatchEvent(new Event(changeEvent));
}

export function courseHref(id: string) {
  return id === "system" ? "/roadmap" : `/roadmap/${encodeURIComponent(id)}`;
}

export function useSiteCatalog(): SiteEntry[] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(sitesKey), () => "[]");
  return useMemo(() => parseList<SiteEntry>(raw).filter((site) => site && typeof site.id === "string" && Array.isArray(site.sections)).sort((a, b) => b.createdAt - a.createdAt), [raw]);
}

export function saveSite(site: SiteEntry) {
  const saved = parseList<SiteEntry>(readRaw(sitesKey));
  window.localStorage.setItem(sitesKey, JSON.stringify([site, ...saved.filter((item) => item.id !== site.id)]));
  window.dispatchEvent(new Event(changeEvent));
}
