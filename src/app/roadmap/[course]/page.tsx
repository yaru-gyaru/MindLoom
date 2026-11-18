import { RoadmapView } from "@/components/roadmap-view";

export const instant = false;

export function generateStaticParams() {
  return ["python-backend", "ux-research", "c", "cpp", "java", "javascript"].map((course) => ({ course }));
}

export default async function CourseRoadmapPage({ params }: { params: Promise<{ course: string }> }) {
  const { course } = await params;
  return <RoadmapView courseId={course} />;
}
