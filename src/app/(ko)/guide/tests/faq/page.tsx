import type { Metadata } from "next";
import { GuideTabBody } from "@/components/assessment/GuideBlocks";
import { guideTab } from "@/content/assessmentGuide";

const found = guideTab("/guide/tests/faq")!;

export const metadata: Metadata = { title: `${found.tab.label} · ${found.page.title}`, description: found.page.lead };

// /guide/tests/faq — 문안은 src/content/assessmentGuide.ts
export default function GuideTestsFaq() {
  return <GuideTabBody tab={found.tab} />;
}
