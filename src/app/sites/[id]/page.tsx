import { SiteView } from "@/components/site-view";

export const instant = false;

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default async function SitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SiteView siteId={id} />;
}
