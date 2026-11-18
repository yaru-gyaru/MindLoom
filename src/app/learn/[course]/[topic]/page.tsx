import { LessonPage } from "@/components/lesson-page";

export const instant = false;

export default async function LessonRoute({ params }: { params: Promise<{ course: string; topic: string }> }) {
  const { course, topic } = await params;
  const topicNumber = Number(topic);
  return <LessonPage courseId={course} topicNumber={Number.isInteger(topicNumber) && topicNumber > 0 ? topicNumber : -1} />;
}
