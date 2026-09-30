import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/ko/LegalPage";

export const metadata: Metadata = { title: "개인정보처리방침" };

// 초안 — 운영자 검토 후 확정. 2026-09-27 심리검사(민감정보) 항목 추가. 2026-09-30 마음 날씨 동의 통합. 상담 기록은 상담운영 단계에서 추가.
export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="약관" title="개인정보처리방침" updated="2026년 9월 30일 (초안)">
      <Section title="1. 수집하는 개인정보">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>회원가입: 이름, 이메일, 비밀번호(암호화 저장), 생년월일, 성별. 소셜 로그인 시 해당 서비스가 제공하는 이메일·이름을 받고, 생년월일·성별은 가입 직후 추가로 입력받습니다. 만 14세 미만은 가입할 수 없습니다.</li>
          <li>결제: 주문 내역, 결제 승인 정보(카드번호 등 결제 수단 정보는 결제 대행사가 보관하며 회사는 저장하지 않음).</li>
          <li>서비스 이용: 수강 진도, 워크북 기록, 접속 기록·기기 정보(부정 이용 방지).</li>
          <li>선택: 휴대폰 번호(알림 수신 동의 시), 마케팅 수신 동의 여부.</li>
        </ul>
      </Section>
      <Section title="1-2. 민감정보 (심리검사 응답·마음 날씨)">
        {/* 2026-09-30: 마음 날씨 동의를 심리검사 민감정보 동의와 통합 */}
        <p>심리검사 또는 앱 마음 날씨 기능을 이용하는 회원에 한해, 별도 동의를 받아 아래 정보를 처리합니다. 동의하지 않을 수 있으나 그 경우 심리검사와 마음 날씨 기능을 이용할 수 없습니다.</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>항목: 검사 문항 응답, 점수와 결과, 검사 당시 나이·성별, 마음 날씨(앱에서 날짜별로 고르는 기분 날씨)</li>
          <li>목적: 결과 제공, 본인의 검사 기록 보관, 마음 날씨 달력·변화 보여주기, 상담 신청 시 참고, 개인을 알아볼 수 없는 형태의 서비스 개선 통계</li>
          <li>열람: 심리검사 기록은 본인과 심리상담실 현 상담가(운영자). 운영자의 열람 기록을 남깁니다. 마음 날씨는 본인만 열람할 수 있으며, 운영자도 볼 수 없습니다.</li>
          <li>보유: 회원 탈퇴 시 즉시 삭제. 마음 날씨는 앱 [내 정보]에서 언제든 전부 지울 수 있습니다.</li>
        </ul>
      </Section>
      <Section title="2. 이용 목적">
        <p>회원 관리와 본인 확인, 콘텐츠 제공과 이용권 관리, 결제·환불 처리, 학습 기록 저장, 공지·알림 발송, 부정 이용 방지, 서비스 개선을 위한 통계.</p>
      </Section>
      <Section title="3. 보유 기간">
        <p>회원 탈퇴 시 지체 없이 삭제합니다. 다만 전자상거래법에 따라 결제·계약 기록은 5년, 소비자 불만·분쟁 처리 기록은 3년 동안 비식별 처리하여 보관합니다.</p>
      </Section>
      <Section title="4. 처리 위탁과 국외 이전">
        <p>서비스 운영을 위해 아래 업체에 처리를 위탁하며, 일부는 국외 서버를 사용합니다.</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>MongoDB Atlas (데이터베이스 · 미국) — 회원·학습 데이터 저장</li>
          <li>Cloudflare (파일·동영상 스트리밍 · 미국) — 콘텐츠 전송</li>
          <li>Render, Vercel (서버·웹 호스팅 · 미국)</li>
          <li>Resend (이메일 발송 · 미국) — 인증·안내 메일</li>
          <li>Solapi (카카오 알림톡·문자 · 한국) — 알림 발송</li>
          <li>결제 대행사 (한국) — 결제 승인·취소</li>
        </ul>
      </Section>
      <Section title="5. 정보주체의 권리">
        <p>회원은 언제든 자신의 개인정보를 열람·수정·삭제하거나 처리 정지를 요구할 수 있습니다. 마이페이지에서 직접 하거나 support@hyeoncounseling.com 으로 요청하면 됩니다.</p>
      </Section>
      <Section title="6. 안전성 확보 조치">
        <p>비밀번호 암호화, 전송 구간 암호화(HTTPS), 접근 권한 관리, 접속 기록 보관.</p>
      </Section>
      <Section title="7. 개인정보 보호책임자">
        <p>김태현 · support@hyeoncounseling.com</p>
      </Section>
    </LegalPage>
  );
}
