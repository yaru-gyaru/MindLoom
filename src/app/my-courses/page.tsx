import { AppShell } from "@/components/app-shell";
import { MyCourseLibrary } from "@/components/course-library";

export default function MyCoursesPage() {
  return <AppShell active="my-courses"><MyCourseLibrary /></AppShell>;
}
