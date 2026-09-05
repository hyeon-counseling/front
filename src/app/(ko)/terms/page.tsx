import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/ko/LegalPage";

export const metadata: Metadata = { title: "이용약관" };

// 초안 — 운영자 검토 후 확정. 약관 버전관리 기능은 추후.
export default function TermsPage() {
  return (
    <LegalPage eyebrow="약관" title="이용약관" updated="2026년 9월 4일 (초안)">
      <Section title="제1조 (목적)">
        <p>이 약관은 심리상담실 현(이하 &ldquo;회사&rdquo;)이 운영하는 웹사이트에서 제공하는 온라인 강의, 셀프 워크북, 아티클 및 관련 서비스(이하 &ldquo;서비스&rdquo;)의 이용 조건과 절차, 회사와 회원의 권리·의무를 정합니다.</p>
      </Section>
      <Section title="제2조 (정의)">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>&ldquo;회원&rdquo;은 이 약관에 동의하고 계정을 만든 사람을 말합니다.</li>
          <li>&ldquo;디지털 콘텐츠&rdquo;는 동영상 강의, 텍스트 강의, 웹 워크북, 전자책 등 온라인으로 제공되는 콘텐츠를 말합니다.</li>
          <li>&ldquo;이용권&rdquo;은 결제 또는 무료 제공으로 특정 콘텐츠를 정해진 기간 동안 이용할 수 있는 권리를 말합니다.</li>
        </ul>
      </Section>
      <Section title="제3조 (계정)">
        <p>회원은 정확한 정보로 가입해야 하며, 계정을 타인과 공유하거나 양도할 수 없습니다. 이용권은 계정 단위로 부여되며, 동시에 사용할 수 있는 기기 수가 제한될 수 있습니다.</p>
      </Section>
      <Section title="제4조 (서비스의 성격)">
        <p>서비스는 심리 교육과 자기 이해를 돕기 위한 것입니다. 의학적 진단, 정신과 치료, 임상 심리치료를 대체하지 않으며, 회원은 위급하거나 심각한 정신건강 문제가 있을 때 전문 기관의 도움을 받아야 합니다.</p>
      </Section>
      <Section title="제5조 (결제와 이용권)">
        <p>콘텐츠 가격과 이용 기간은 각 소개 페이지에 표시됩니다. 결제가 완료되면 이용권이 즉시 부여되고, 이용 기간이 끝나면 콘텐츠 접근이 종료됩니다. 학습 기록과 워크북 기록은 이용 기간 종료 후에도 회원이 열람할 수 있습니다.</p>
      </Section>
      <Section title="제6조 (청약철회와 환불)">
        <p>환불 기준은 별도의 <a href="/refund" className="text-[var(--brand)] underline">환불 규정</a>을 따릅니다. 전자상거래법에 따라 디지털 콘텐츠의 제공이 시작된 뒤에는 청약철회가 제한될 수 있으며, 회사는 이를 결제 전에 표시합니다.</p>
      </Section>
      <Section title="제7조 (저작권)">
        <p>서비스의 모든 콘텐츠에 대한 저작권은 회사에 있습니다. 회원은 개인적인 학습 목적으로만 콘텐츠를 이용할 수 있으며, 녹화·복제·배포·2차 이용은 금지됩니다. 회원이 워크북에 기록한 내용의 권리는 회원에게 있습니다.</p>
      </Section>
      <Section title="제8조 (회원 탈퇴)">
        <p>회원은 언제든 탈퇴할 수 있습니다. 탈퇴 시 개인정보는 개인정보처리방침에 따라 삭제되며, 남은 이용 기간에 대한 환불은 환불 규정을 따릅니다.</p>
      </Section>
      <Section title="제9조 (책임의 한계)">
        <p>회사는 천재지변, 통신 장애 등 불가항력으로 인한 서비스 중단에 책임지지 않습니다. 회원이 콘텐츠를 바탕으로 내린 결정과 행동의 결과는 회원 본인에게 있습니다.</p>
      </Section>
      <Section title="제10조 (분쟁 해결)">
        <p>서비스 이용과 관련한 분쟁은 회사와 회원이 성실히 협의하여 해결하며, 협의가 되지 않으면 회사 소재지를 관할하는 법원에 제기합니다.</p>
      </Section>
    </LegalPage>
  );
}
