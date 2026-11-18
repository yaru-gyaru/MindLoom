import { CourseEditor } from "@/components/course-editor";

export const instant = false;

export function generateStaticParams() {
  return ["system", "python-backend", "ux-research", "c", "cpp", "java", "javascript"].map((id) => ({ id }));
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseEditor courseId={id} />;
}
