import type { Metadata } from "next";
import { LinkHelp } from "@/components/assessment/LinkHelp";

export const metadata: Metadata = { title: "종합심리검사 진행", robots: { index: false } };

// /a — 개인 주소 없이 들어온 경우 (링크가 잘렸을 때 등)
export default function AssessmentLinkMissingPage() {
  return <LinkHelp />;
}
