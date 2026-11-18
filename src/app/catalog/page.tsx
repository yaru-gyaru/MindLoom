import { AppShell } from "@/components/app-shell";
import { CourseCatalog } from "@/components/course-library";

export default function CourseCatalogPage() {
  return <AppShell active="catalog"><CourseCatalog /></AppShell>;
}
