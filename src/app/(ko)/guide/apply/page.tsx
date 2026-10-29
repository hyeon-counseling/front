import type { Metadata } from "next";
import { GuideTabBody } from "@/components/assessment/GuideBlocks";
import { guideTab } from "@/content/assessmentGuide";

const found = guideTab("/guide/apply")!;

export const metadata: Metadata = { title: `${found.tab.label} · ${found.page.title}`, description: found.page.lead };

// /guide/apply — 문안은 src/content/assessmentGuide.ts
export default function GuideApplyIntro() {
  return <GuideTabBody tab={found.tab} />;
}
