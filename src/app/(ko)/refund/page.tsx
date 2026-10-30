import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/ko/LegalPage";
import { RefundRules } from "@/components/assessment/RefundRules";
import { CounselingRefundRules } from "@/components/counseling/CounselingRules";

export const metadata: Metadata = { title: "환불 규정" };

// 개정 2026-10-30 (상담가 확정). 강의·워크북은 PRD-V2 §5.4, 종합심리검사는 52-취소환불규정(RefundRules), 개인 상담은 결정 #56(CounselingRules)
export default function RefundPage() {
  return (
    <LegalPage eyebrow="약관" title="환불 규정" updated="2026년 10월 30일">
      <Section title="강의·워크북 (디지털 콘텐츠)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>결제 후 <strong className="text-[var(--foreground)]">7일 이내</strong>이고 진도가 <strong className="text-[var(--foreground)]">10% 미만</strong>이면 전액 환불합니다.</li>
          <li>그 이후에는 콘텐츠 제공이 시작된 것으로 보아 환불이 제한됩니다. 다만 이용 기간이 남은 경우 잔여 기간에 비례해 환불할 수 있습니다.</li>
          <li>파일 손상, 재생 불가, 중복 결제 등 회사 측 문제는 기간과 관계없이 전액 환불합니다.</li>
        </ul>
      </Section>
      <Section title="종합심리검사 + 해석 상담 (150,000원)">
        <RefundRules />
      </Section>
      <Section title="개인 상담 (1회기 60,000원)">
        <CounselingRefundRules />
      </Section>
      <Section title="환불 방법">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <b className="text-[var(--foreground)]">종합심리검사</b>: <Link href="/my/assessment" className="text-[var(--brand)] underline">마이페이지 → 심리검사 진행</Link> → [취소 요청]이 가장 빨라요. 지금 취소하면 얼마를 돌려받는지 바로 보여 드려요.
          </li>
          <li>그 밖에는 support@hyeon-counseling.com 이나 카카오톡 채널 「심리상담실 현」으로 계정 이메일·주문 번호·사유를 보내 주세요. 영업일 기준 1일 안에 확인해요.</li>
          <li>승인되면 결제한 수단으로 영업일 3~7일 안에 돌려드려요(카드사·결제수단에 따라 달라요).</li>
        </ul>
      </Section>
    </LegalPage>
  );
}
