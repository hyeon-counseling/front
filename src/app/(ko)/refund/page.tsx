import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/ko/LegalPage";

export const metadata: Metadata = { title: "환불 규정" };

// 초안 — 운영자 검토 후 확정 (PRD-V2 §5.4 기준)
export default function RefundPage() {
  return (
    <LegalPage eyebrow="약관" title="환불 규정" updated="2026년 9월 4일 (초안)">
      <Section title="강의·워크북 (디지털 콘텐츠)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>결제 후 <strong className="text-[var(--foreground)]">7일 이내</strong>이고 진도가 <strong className="text-[var(--foreground)]">10% 미만</strong>이면 전액 환불합니다.</li>
          <li>그 이후에는 콘텐츠 제공이 시작된 것으로 보아 환불이 제한됩니다. 다만 이용 기간이 남은 경우 잔여 기간에 비례해 환불할 수 있습니다.</li>
          <li>파일 손상, 재생 불가, 중복 결제 등 회사 측 문제는 기간과 관계없이 전액 환불합니다.</li>
        </ul>
      </Section>
      <Section title="상담·심리검사">
        <p>쇼핑몰 상품 페이지에 표시된 취소·변경 규정을 따릅니다. (상담운영시스템 도입 시 이 문서에 통합합니다.)</p>
      </Section>
      <Section title="환불 방법">
        <p>support@hyeoncounseling.com 으로 계정 이메일과 주문 번호, 사유를 보내 주세요. 영업일 기준 1일 안에 확인하고, 승인 시 결제 수단으로 3~7일 안에 환급됩니다.</p>
      </Section>
    </LegalPage>
  );
}
