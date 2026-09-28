import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의",
  description: "심리상담실 현에 문의하기. 영업일 기준 1~2일 안에 답변드립니다.",
};

const KINDS = [
  { t: "수강·기록", d: "강의 재생, 쓰기 기록 저장, 계정 관련 문제" },
  { t: "결제·환불", d: "결제 오류, 중복 결제, 환불 요청 (결제 후 7일 이내)" },
  { t: "상담·검사", d: "상담 신청 방법, 일정 변경, 검사 문의" },
];

export default function ContactPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4"><span className="eyebrow">문의</span></p>
        <h1 className="font-display text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">이메일로 편하게</h1>
        <p className="mt-4 max-w-2xl text-[var(--foreground-muted)]">영업일 기준 1~2일 안에 답변드립니다. 계정 이메일과 상황을 함께 적어 주시면 더 빨리 도와드릴 수 있어요.</p>

        <div className="mt-10 rounded-3xl bg-[var(--surface)] p-8 text-center sm:p-10">
          <p className="text-sm text-[var(--foreground-muted)]">문의 메일</p>
          <a href="mailto:support@hyeoncounseling.com" className="font-display mt-2 inline-block text-2xl text-[var(--brand)] hover:underline sm:text-3xl">
            support@hyeoncounseling.com
          </a>
          <p className="mt-4 text-xs text-[var(--foreground-subtle)]">운영 시간 평일 10:00 – 18:00 (KST)</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {KINDS.map((k) => (
            <div key={k.t} className="card p-5">
              <h3 className="font-semibold text-[var(--foreground)]">{k.t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground-muted)]">{k.d}</p>
            </div>
          ))}
        </div>

        <dl className="mt-10 space-y-2 rounded-2xl border border-[var(--border-light)] p-6 text-sm text-[var(--foreground-muted)]">
          <div className="flex gap-3"><dt className="min-w-[120px] font-medium text-[var(--foreground)]">상호</dt><dd>심리상담실 현 (Hyeon Counseling)</dd></div>
          <div className="flex gap-3"><dt className="min-w-[120px] font-medium text-[var(--foreground)]">대표</dt><dd>김태현</dd></div>
          <div className="flex gap-3"><dt className="min-w-[120px] font-medium text-[var(--foreground)]">사업자등록번호</dt><dd>185-25-02396</dd></div>
          <div className="flex gap-3"><dt className="min-w-[120px] font-medium text-[var(--foreground)]">주소</dt><dd>서울특별시 동작구 상도로15다길 16</dd></div>
        </dl>
      </div>
    </div>
  );
}
