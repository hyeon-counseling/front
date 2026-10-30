import type { ReactNode } from "react";
import { GuideShell } from "@/components/assessment/GuideBlocks";
import { guidePage } from "@/content/assessmentGuide";

// 종합심리검사 신청 안내 — 탭이 바뀌어도 머리·탭·맨 아래는 그대로
export default function GuideApplyLayout({ children }: { children: ReactNode }) {
  return <GuideShell page={guidePage("apply")}>{children}</GuideShell>;
}
