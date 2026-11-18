import { SiteEditor } from "@/components/site-editor";

export const instant = false;

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default async function EditSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteEditor siteId={id} />;
}
